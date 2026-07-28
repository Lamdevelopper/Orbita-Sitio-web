import { requireChatGPTUser } from "../../chatgpt-auth";
import { getEditorEmails } from "../../../lib/api";
import { PostEditor } from "./PostEditor";
export const dynamic = "force-dynamic";

export default async function AdminPostPage() {
  const user = await requireChatGPTUser("/admin/post");
  if (!getEditorEmails().includes(user.email.toLowerCase())) return <main className="page-shell admin-denied"><span className="eyebrow">ACCESO RESTRINGIDO</span><h1>Este espacio editorial es privado.</h1></main>;
  return <PostEditor email={user.email} />;
}
