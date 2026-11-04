// Umumiy CORS: faqat ruxsat etilgan manbalar (ALLOWED_ORIGIN — vergul bilan ajratilgan ro'yxat).
// O'rnatilmagan bo'lsa — smartavto.uz va lokal ishlab chiqish manzillari (avval "*" edi).
const DEFAULT_ORIGINS = [
  "https://smartavto.uz",
  "https://www.smartavto.uz",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:4173",
];

const allowed = (Deno.env.get("ALLOWED_ORIGIN") ?? "")
  .split(",")
  .map((s) => s.trim().replace(/\/$/, ""))
  .filter(Boolean);
const ORIGINS = allowed.length ? allowed : DEFAULT_ORIGINS;

export function corsHeaders(req: Request, methods = "POST, OPTIONS"): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  return {
    "Access-Control-Allow-Origin": ORIGINS.includes(origin) ? origin : ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-id, x-cron-secret",
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function preflight(req: Request, methods?: string): Response | null {
  return req.method === "OPTIONS" ? new Response("ok", { headers: corsHeaders(req, methods) }) : null;
}

export function jsonResponse(req: Request, data: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store",
      ...extra,
    },
  });
}
