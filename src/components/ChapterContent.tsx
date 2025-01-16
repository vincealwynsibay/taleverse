"use client";
import { Block } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { Prisma } from "@prisma/client";
import { useEffect, useMemo, useState } from "react";
import "../styles/ChapterContent.css";
import "@blocknote/react/style.css";
import "@blocknote/mantine/style.css";
import "@blocknote/core/style.css";

export default function ChapterContent({
  content,
}: {
  content: Prisma.JsonValue;
}) {
  const [result, setResult] = useState("");
  const editor = useCreateBlockNote();
  const contentObject = content as Prisma.JsonArray;
  const blocks = useMemo(
    () => (contentObject.length > 0 ? (contentObject as Block[]) : []),
    [contentObject]
  );

  useEffect(() => {
    const convertToHtml = async () => {
      const parsedContent = await editor.blocksToHTMLLossy(blocks);
      setResult(() => parsedContent);
    };
    convertToHtml();
  }, [editor, blocks]);

  console.log("result", result);

  return <div dangerouslySetInnerHTML={{ __html: result }} />;
}
