/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import "@blocknote/core/fonts/inter.css";
import {
  BlockNoteView,
  darkDefaultTheme,
  lightDefaultTheme,
} from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import {
  defaultBlockSpecs,
  BlockNoteSchema,
  Block,
  getBlockNoteExtensions,
} from "@blocknote/core";
import { uploadFile } from "@/lib/actions/common";
import { useTheme } from "next-themes";
import {
  BasicTextStyleButton,
  BlockTypeSelect,
  ColorStyleButton,
  CreateLinkButton,
  FileCaptionButton,
  FileReplaceButton,
  FormattingToolbar,
  FormattingToolbarController,
  TextAlignButton,
  useCreateBlockNote,
} from "@blocknote/react";

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
    _tiptapOptions: {
      editorProps: {
        // handleKeyDown: (_, event) => {
        //   if (event.key === "Tab") {
        //     console.log("happens");
        //     return;
        //   }
        // },
        // transformPasted: (slice) => {
        // },
        // handlePaste: (_, event) => {
        //   // Get the pasted text
        //   return true;
        // },
      },
    },
  });

  return (
    <BlockNoteView
      onChange={() => handleContentChange(editor.document)}
      editor={editor}
      theme={theme === "light" ? lightDefaultTheme : darkDefaultTheme}
      formattingToolbar={false}
    >
      <FormattingToolbarController
        formattingToolbar={() => (
          <FormattingToolbar>
            <BlockTypeSelect key={"blockTypeSelect"} />

            <FileCaptionButton key={"fileCaptionButton"} />
            <FileReplaceButton key={"replaceFileButton"} />

            <BasicTextStyleButton
              basicTextStyle={"bold"}
              key={"boldStyleButton"}
            />
            <BasicTextStyleButton
              basicTextStyle={"italic"}
              key={"italicStyleButton"}
            />
            <BasicTextStyleButton
              basicTextStyle={"underline"}
              key={"underlineStyleButton"}
            />
            <BasicTextStyleButton
              basicTextStyle={"strike"}
              key={"strikeStyleButton"}
            />
            {/* Extra button to toggle code styles */}
            <BasicTextStyleButton
              key={"codeStyleButton"}
              basicTextStyle={"code"}
            />

            <TextAlignButton
              textAlignment={"left"}
              key={"textAlignLeftButton"}
            />
            <TextAlignButton
              textAlignment={"center"}
              key={"textAlignCenterButton"}
            />
            <TextAlignButton
              textAlignment={"right"}
              key={"textAlignRightButton"}
            />

            <ColorStyleButton key={"colorStyleButton"} />

            <CreateLinkButton key={"createLinkButton"} />
          </FormattingToolbar>
        )}
      />
    </BlockNoteView>
  );
}
