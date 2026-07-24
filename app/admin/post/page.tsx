import { env } from "cloudflare:workers";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { PostEditor } from "./PostEditor";

export const dynamic = "force-dynamic";

const FALLBACK = "lamoyi.matias@gmail.com";

export default async function AdminPostPage() {
  const user = await requireChatGPTUser("/admin/post");
  const editorEmails = (env as unknown as { EDITOR_EMAILS?: string }).EDITOR_EMAILS || FALLBACK;
  const allowed = editorEmails.split(",").map((item: string) => item.trim().toLowerCase());
  if (!allowed.includes(user.email.toLowerCase()))
    return <main className="page-shell admin-denied"><span className="eyebrow">ACCESO RESTRINGIDO</span><h1>Este espacio editorial es privado.</h1></main>;

  return <PostEditor email={user.email} />;
}
