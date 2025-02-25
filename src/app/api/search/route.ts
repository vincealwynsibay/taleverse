import { searchNovels } from "@/lib/queries";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.slice(0, 80) ?? "";
  return Response.json({ results: await searchNovels(q) });
}
