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
import { defaultBlockSpecs, BlockNoteSchema } from "@blocknote/core";
import { uploadImage } from "@/lib/actions/common";
import { useTheme } from "next-themes";

export default function Editor() {
  const {
    audio,
    table,
    numberedListItem,
    checkListItem,
    bulletListItem,
    codeBlock,
    video,
    file,
    ...remainingDefaultSpecs
  } = defaultBlockSpecs;

  const { theme } = useTheme();

  const schema = BlockNoteSchema.create({
    blockSpecs: {
      // remainingBlockSpecs contains all the other blocks
      ...remainingDefaultSpecs,
    },
  });

  const editor = useCreateBlockNote({ schema, uploadFile: uploadImage });
  return (
    <BlockNoteView
      editor={editor}
      theme={theme === "light" ? lightDefaultTheme : darkDefaultTheme}
    ></BlockNoteView>
  );
}
