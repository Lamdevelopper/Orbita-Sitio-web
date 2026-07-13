import { getDb } from "../../../db";
import { subscribers } from "../../../db/schema";
import { cleanText, routeError } from "../../../lib/api";
export async function POST(request:Request){try{const body=await request.json() as Record<string,unknown>;const email=cleanText(body.email,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return Response.json({error:"Correo inválido"},{status:400});await getDb().insert(subscribers).values({email,status:"active",source:"website",createdAt:new Date()}).onConflictDoUpdate({target:subscribers.email,set:{status:"active"}});return Response.json({ok:true},{status:201})}catch(error){return routeError(error)}}
