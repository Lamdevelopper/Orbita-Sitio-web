import { requireChatGPTUser } from "../chatgpt-auth";
import { AdminStudio } from "../../components/AdminStudio";
export const dynamic="force-dynamic";
const OWNER="lamoyi.matias@gmail.com";
export default async function AdminPage(){const user=await requireChatGPTUser("/admin");if(user.email.toLowerCase()!==OWNER)return <main className="page-shell admin-denied"><span className="eyebrow">ACCESO RESTRINGIDO</span><h1>Este espacio editorial es privado.</h1></main>;return <AdminStudio email={user.email}/>}
