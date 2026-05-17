/**
 * Helpers for parsing API responses where errors are shaped as `{ error: string }`.
 */

export async function readJsonSafe(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function messageFromApiBody(data: unknown, fallback: string): string {
  let msg = fallback;
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string" && err.trim()) msg = err.trim();
  }
  let detail = "";
  if (data && typeof data === "object" && "detail" in data) {
    const d = (data as { detail: unknown }).detail;
    if (typeof d === "string" && d.trim()) detail = d.trim();
  }
  return detail ? `${msg} — ${detail}` : msg;
}
