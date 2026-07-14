import { env } from "cloudflare:workers";
type Runtime={MEDIA?:R2Bucket};
export async function GET(_:Request,{params}:{params:Promise<{key:string[]}>}){const object=await (env as unknown as Runtime).MEDIA?.get((await params).key.join("/"));if(!object)return new Response("No encontrado",{status:404});return new Response(object.body,{headers:{"content-type":object.httpMetadata?.contentType||"application/octet-stream","cache-control":"public, max-age=31536000, immutable"}})}
