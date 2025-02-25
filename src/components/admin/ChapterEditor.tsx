"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useTheme } from "next-themes";
import { uploadChapterImageAction } from "@/app/actions/admin";

/** Only the blocks the server-side reader renders (components/reader/ChapterBody.tsx). */
const schema = BlockNoteSchema.create({
  blockSpecs: {
    paragraph: defaultBlockSpecs.paragraph,
    heading: defaultBlockSpecs.heading,
    quote: defaultBlockSpecs.quote,
    image: defaultBlockSpecs.image,
    divider: defaultBlockSpecs.divider,
  },
});

async function uploadFile(file: File) {
  const form = new FormData();
  form.set("file", file);
  const res = await uploadChapterImageAction(form);
  if (!res.ok) throw new Error(res.error);
  return res.data.url;
}

export default function ChapterEditor({ initial, onChange }: { initial: unknown[]; onChange: (json: string) => void }) {
  const { resolvedTheme } = useTheme();
  const editor = useCreateBlockNote({
    schema,
    uploadFile,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initialContent: initial.length ? (initial as any) : undefined,
  });

  return (
    <BlockNoteView
      editor={editor}
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      onChange={() => onChange(JSON.stringify(editor.document))}
      className="-ml-9 min-h-[60vh]"
    />
  );
}
