import { Environment, Paddle } from "@paddle/paddle-node-sdk";

export const VAULT_AMOUNT_MINOR = 79_900;
export const VAULT_CURRENCY = "INR" as const;

let paddleClient: Paddle | null = null;

export function getPaddleClient(): Paddle {
  if (!paddleClient) {
    const apiKey = requiredEnvironmentVariable("PADDLE_API_KEY");
    paddleClient = new Paddle(apiKey, {
      environment:
        paddleEnvironment() === "production"
          ? Environment.production
          : Environment.sandbox,
    });
  }

  return paddleClient;
}

export function paddleEnvironment(): "production" | "sandbox" {
  return process.env.PADDLE_ENV === "production" ? "production" : "sandbox";
}

export function getPaddleClientToken(): string | null {
  return process.env.PADDLE_CLIENT_TOKEN?.trim() || null;
}

export function getPaddleWebhookSecret(): string {
  return requiredEnvironmentVariable("PADDLE_WEBHOOK_SECRET");
}

export async function createVaultTransaction(
  checkoutSessionId: string,
  termsAcceptedAt: string,
) {
  return getPaddleClient().transactions.create({
    collectionMode: "automatic",
    currencyCode: VAULT_CURRENCY,
    customData: {
      checkoutSessionId,
      offer: "vault",
      refundPolicy: "final-sale-2026-09-17",
      site: "interviewrunway",
      termsAcceptedAt,
      termsVersion: "2026-09-17",
    },
    items: [
      {
        quantity: 1,
        price: {
          description:
            "One-time access to the InterviewRunway Vault launch edition and included updates",
          name: "InterviewRunway Vault",
          product: {
            description:
              "Founder-designed interview preparation library with 4-week and 12-week roadmaps.",
            name: "InterviewRunway Vault",
            taxCategory: "standard",
          },
          unitPrice: {
            amount: String(VAULT_AMOUNT_MINOR),
            currencyCode: VAULT_CURRENCY,
          },
        },
      },
    ],
  });
}

function requiredEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}
