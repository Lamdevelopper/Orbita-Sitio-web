import { PATCH } from "../route";

export async function POST(request: Request, context: { params: Promise<{ publicId: string }> }) {
  return PATCH(request, context);
}
