// Utility to bypass Next.js 15 strict routing types
export function asRoute(path: string): any {
  return path as any
}