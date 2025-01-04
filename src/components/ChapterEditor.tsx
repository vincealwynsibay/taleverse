/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import "@blocknote/core/fonts/inter.css";
import {
  BlockNoteView,
  darkDefaultTheme,
  lightDefaultTheme,
} from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { defaultBlockSpecs, BlockNoteSchema, Block } from "@blocknote/core";
import { uploadFile } from "@/lib/actions/common";
import { useState } from "react";
import { updateChapterContent } from "@/lib/actions/chapter.action";
import { Prisma } from "@prisma/client";
import { useTheme } from "next-themes";

export default function ChapterEditor({
  chapterId,
  content,
}: {
  chapterId: number;
  content: Prisma.JsonValue;
}) {
  const {
    audio,
    table,
    numberedListItem,
    checkListItem,
    bulletListItem,
    codeBlock,
    ...remainingDefaultSpecs
  } = defaultBlockSpecs;

  const { theme } = useTheme();
  const contentObject = content as Prisma.JsonArray;
  const [blocks, setBlocks] = useState<Block[]>(contentObject as Block[]);

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      // remainingBlockSpecs contains all the other blocks
      ...remainingDefaultSpecs,
    },
  });

  const editor = useCreateBlockNote({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialContent: [...(contentObject as any)],
    schema,
    uploadFile,
  });

  const handleContentChange = async () => {
    setBlocks(() => editor.document);
    // update chapter content
    await updateChapterContent(chapterId, JSON.stringify(blocks));
  };

  return (
    <BlockNoteView
      onChange={() => handleContentChange()}
      editor={editor}
      theme={theme === "light" ? lightDefaultTheme : darkDefaultTheme}
    ></BlockNoteView>
  );
}
