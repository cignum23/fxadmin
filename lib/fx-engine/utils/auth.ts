export function verifyApiKey(key: string | null | undefined): boolean {
  if (!key) return false;
  const validKeys = (process.env.INTERNAL_API_KEYS ?? '').split(',').map(k => k.trim()).filter(Boolean);
  return validKeys.includes(key);
}

export function verifyInternalApiKey(key: string | null | undefined): boolean {
  // Same as verifyApiKey but can be extended with different permissions
  return verifyApiKey(key);
}

export function verifyIPWhitelist(ip: string | null | undefined): boolean {
  if (!ip) return false;
  const whitelist = (process.env.IP_WHITELIST ?? '').split(',').map(s => s.trim()).filter(Boolean);
  
  // If no whitelist configured, allow all
  if (whitelist.length === 0) return true;
  
  return whitelist.includes(ip);
}
