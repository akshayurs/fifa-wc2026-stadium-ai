import { APP_NAME } from "@/lib/constants";
import { jsonResponse } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Liveness probe. Returns basic, non-sensitive service metadata. */
export function GET(): Response {
  return jsonResponse(200, {
    status: "ok",
    app: APP_NAME,
    time: new Date().toISOString(),
  });
}
