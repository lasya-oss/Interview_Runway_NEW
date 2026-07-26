import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE_NAME,
  verifySessionToken,
} from "@/app/lib/google-auth";

export type ChatGPTUser = {
  displayName: string;
  email: string;
  fullName: string | null;
};

const SIGN_IN_PATH = "/sign-in";

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;
  return {
    displayName: session.name ?? session.email,
    email: session.email,
    fullName: session.name,
  };
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;

  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (url.pathname === SIGN_IN_PATH) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}
