import { getChatGPTUser, type ChatGPTUser } from "@/app/chatgpt-auth";
import { isInternalFullAccessEmail } from "@/app/lib/internal-access";

export type UserHistoryAuthorization =
  | { ok: true; user: ChatGPTUser }
  | { ok: false; status: 401 | 403; error: string };

export function isAuthorizedUserHistoryOperator(
  email: string,
  configuredDomain = process.env.INTERNAL_FULL_ACCESS_DOMAIN,
) {
  return isInternalFullAccessEmail(email, configuredDomain);
}

export async function authorizeUserHistoryRequest(): Promise<UserHistoryAuthorization> {
  const user = await getChatGPTUser();
  if (!user) return { ok: false, status: 401, error: "Authentication required" };
  if (!isAuthorizedUserHistoryOperator(user.email)) {
    return { ok: false, status: 403, error: "Vivid Labs reporting access required" };
  }
  return { ok: true, user };
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readLimitedJson(request: Request, maxBytes: number): Promise<
  | { ok: true; value: unknown }
  | { ok: false; reason: "invalid" | "too-large" }
> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return { ok: false, reason: "too-large" };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, reason: "invalid" };
  const chunks: Uint8Array[] = [];
  let totalLength = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalLength += value.byteLength;
    if (totalLength > maxBytes) {
      await reader.cancel();
      return { ok: false, reason: "too-large" };
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}
