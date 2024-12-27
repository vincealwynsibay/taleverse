import { getNovel } from "@/lib/actions/novel.action";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const novel = await getNovel((await params).slug);
  console.log(novel);

  return <div></div>;
}
