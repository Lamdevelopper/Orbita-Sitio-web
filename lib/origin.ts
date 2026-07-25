import { headers } from "next/headers";

/** Deriva el origin real de los headers del request, sin hardcodear dominio. */
export async function getOrigin(): Promise<string> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "orbita-revista.example";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
