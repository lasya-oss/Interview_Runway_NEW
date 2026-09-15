import { NextResponse } from "next/server";
import { DRIVE_MATERIAL_CONTENT } from "@/app/lib/drive-material-content";
import {
  driveMaterialCompanionFilename,
  driveMaterialTitle,
  findDriveMaterial,
} from "@/app/lib/drive-materials";
import { createTextPdf } from "@/app/lib/text-pdf";
import { requireDemoProfile } from "@/app/lib/demo-session";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const material = findDriveMaterial(slug);

  if (!material || (material.kind !== "template" && material.kind !== "narrated")) {
    return NextResponse.json({ error: "Material preview not found." }, { status: 404 });
  }

  await requireDemoProfile(`/api/learn/library/material-preview/${slug}`);

  const companionFilename = driveMaterialCompanionFilename(material);
  const source = DRIVE_MATERIAL_CONTENT[material.id] ?? (
    companionFilename ? await readFirstPartyText(request, companionFilename) : null
  );

  if (!source) {
    return NextResponse.json({ error: "Material preview is unavailable." }, { status: 404 });
  }

  const title = driveMaterialTitle(material.filename);
  const pdf = createTextPdf(title, companionFilename ?? material.filename, source);
  const filename = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "material"}.pdf`;

  return new NextResponse(pdf, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Type": "application/pdf",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function readFirstPartyText(request: Request, filename: string): Promise<string | null> {
  try {
    const { env } = await import("cloudflare:workers");
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(
        new Request(new URL(`/drive-materials/${encodeURIComponent(filename)}`, request.url)),
      );
      if (response.ok) return response.text();
    }
  } catch {
    // The Node-based renderer used by local builds has no Cloudflare module.
  }

  if (typeof process === "undefined" || !process.versions?.node) return null;
  try {
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");
    return readFile(resolve(process.cwd(), "public", "drive-materials", filename), "utf8");
  } catch {
    return null;
  }
}
