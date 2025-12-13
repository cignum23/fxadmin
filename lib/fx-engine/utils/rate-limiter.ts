// Simple in-memory rate limiter (for production, use Redis)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export async function checkRateLimit(identifier: string = 'global'): Promise<boolean> {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 60; // 60 requests per minute

  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}
