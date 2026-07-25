import { requireChatGPTUser } from "../chatgpt-auth";
import { AdminStudio } from "../../components/AdminStudio";
import { getEditorEmails } from "../../lib/api";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const user = await requireChatGPTUser("/admin");
  if (!getEditorEmails().includes(user.email.toLowerCase())) return <main className="page-shell admin-denied"><span className="eyebrow">ACCESO RESTRINGIDO</span><h1>Este espacio editorial es privado.</h1></main>;
  return <AdminStudio email={user.email} />;
}
