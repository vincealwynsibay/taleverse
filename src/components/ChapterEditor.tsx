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
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { updateChapterContent } from "@/lib/actions/chapter.action";
import { Prisma } from "@prisma/client";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";

export default function ChapterEditor({
  chapterId,
  content,
  saving,
  published,
  handleChange,
  handleSave,
  slug,
}: {
  slug: string;
  chapterId: number;
  content: Prisma.JsonValue;
  saving: boolean;
  published: boolean;
  handleChange: Dispatch<SetStateAction<boolean>>;
  handleSave: Dispatch<SetStateAction<boolean>>;
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
  const [blocks, setBlocks] = useState<Block[]>(
    contentObject.length > 0 ? (contentObject as Block[]) : []
  );
  const router = useRouter();

  useEffect(() => {
    const updateChapter = async () => {
      return (await updateChapterContent(chapterId, JSON.stringify(blocks)))
        .success;
    };

    // novel is saving/updating
    if (saving) {
      // if already published, wait for button click
      if (published) {
        const isSuccess = updateChapter();
        if (!isSuccess) return;
        router.push(`/novels/${slug}`);
      } else {
        handleChange(() => false);
      }
    }
  }, [blocks, chapterId, handleChange, saving, published, router, slug]);

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      // remainingBlockSpecs contains all the other blocks
      ...remainingDefaultSpecs,
    },
  });

  const editor = useCreateBlockNote({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(blocks.length > 0 && { initialContent: [...(blocks as any)] }),
    schema,
    uploadFile,
  });

  const handleContentChange = async () => {
    setBlocks(() => editor.document);
    // update chapter content
    handleChange(() => true);

    if (!published) {
      handleSave(() => true);
      await updateChapterContent(chapterId, JSON.stringify(blocks));
      handleSave(() => false);
    }
  };

  return (
    <BlockNoteView
      onChange={() => handleContentChange()}
      editor={editor}
      theme={theme === "light" ? lightDefaultTheme : darkDefaultTheme}
    ></BlockNoteView>
  );
}
