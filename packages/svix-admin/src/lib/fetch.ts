export function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeoutMs = 10_000
): Promise<Response> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id))
}
