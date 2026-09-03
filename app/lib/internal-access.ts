/**
 * Match an authenticated account to the explicitly configured internal
 * full-access domain. Keeping this separate from the public entitlement store
 * makes the preview cohort easy to disable before customer launch.
 */
export function isInternalFullAccessEmail(
  email: string,
  configuredDomain = process.env.INTERNAL_FULL_ACCESS_DOMAIN,
): boolean {
  const domain = configuredDomain?.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!domain || domain.includes("@")) return false;

  const separator = normalizedEmail.lastIndexOf("@");
  return (
    separator > 0 &&
    normalizedEmail.indexOf("@") === separator &&
    normalizedEmail.slice(separator + 1) === domain
  );
}
