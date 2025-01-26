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
        handleDOMEvents: {
          drop: () => true,
        },
        handleKeyDown: (_, event) => {
          // Disable tab key
          if (event.key === "Tab") {
            event.preventDefault();
            return true;
          }
          return false;
        },
        transformPastedText: (text) => {
          // Remove all types of whitespace from the start of lines
          return text
            .split("\n")
            .map((line) => line.replace(/^[\s\t]+/, ""))
            .join("\n");
        },
        transformPastedHTML: (html) => {
          // Remove any margin, padding, or text-indent CSS properties
          return html.replace(/style="[^"]*"/g, (match) => {
            return match
              .replace(/margin-left:[^;"]+;?/g, "")
              .replace(/padding-left:[^;"]+;?/g, "")
              .replace(/text-indent:[^;"]+;?/g, "");
          });
        },
      },
    },
  });

  return (
    <BlockNoteView
      editor={editor}
      formattingToolbar={false}
      onChange={() => handleContentChange(editor.document)}
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
