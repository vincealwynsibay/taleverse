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
import { useTheme } from "next-themes";

export default function ChapterEditor({
  handleContentChange,
  blocks,
}: {
  blocks: Block[];
  handleContentChange: (newDocument: Block[]) => Promise<void>;
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

  return (
    <BlockNoteView
      onChange={() => handleContentChange(editor.document)}
      editor={editor}
      theme={theme === "light" ? lightDefaultTheme : darkDefaultTheme}
    ></BlockNoteView>
  );
}
