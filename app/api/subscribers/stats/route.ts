import { routeError } from "../../../../lib/api";
import { adminGuard, subscriberMetrics } from "../../../../lib/newsletter-service";

export async function GET(request: Request) {
  const denied = adminGuard(request);
  if (denied) return denied;
  try { return Response.json({ metrics: await subscriberMetrics() }); }
  catch (error) { return routeError(error); }
}
