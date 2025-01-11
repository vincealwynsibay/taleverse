"use client";

import { createNovel } from "@/lib/actions/novel.action";
import { novelSchema } from "@/lib/validation";
import { useActionState, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import Image from "next/image";
import MaxWidthWrapper from "./MaxWidthWrapper";
import { cn } from "@/lib/utils";
import { User } from "lucide-react";

export default function CreateNovelForm() {
  const [state, submitNovel, isPending] = useActionState(createNovel, {
    message: "",
  });

  const [fileEnter, setFileEnter] = useState(false);

  const form = useForm<z.output<typeof novelSchema>>({
    resolver: zodResolver(novelSchema),
    defaultValues: {
      title: "",
      synopsis: "",
      author: "",
      releaseYear: "",
      ...(state?.fields ?? {}),
    },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isValid = form.formState.isValid;

  console.log(form.getValues());

  console.log(fileEnter);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <MaxWidthWrapper className="mx-auto">
      <h1 className="mb-4 text-xl font-bold">Create New Novel</h1>
      <Form {...form}>
        <form
          className="grid lg:grid-cols-[300px_1fr] gap-8"
          ref={formRef}
          action={(data) => {
            form.trigger();
            if (!isValid) return;
            submitNovel(data);
          }}
        >
          <div className="">
            <FormField
              control={form.control}
              name="image"
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              render={({ field: { value, onChange, ref, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <FormControl className="w-full h-full">
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setFileEnter(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setFileEnter(false);
                      }}
                      onDragEnd={(e) => {
                        e.preventDefault();
                        setFileEnter(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setFileEnter(false);
                        if (e.dataTransfer.items) {
                          [...e.dataTransfer.items].forEach((item) => {
                            if (item.kind === "file") {
                              const file = item.getAsFile();
                              console.log(file);
                              if (file) {
                                if (fileInputRef.current) {
                                  const dataTransfer = new DataTransfer();
                                  dataTransfer.items.add(file);
                                  fileInputRef.current.files =
                                    dataTransfer.files;
                                  onChange(file);
                                }
                              }
                            }
                          });
                        }
                      }}
                      className={cn(
                        fileEnter
                          ? "border-2 border-muted-foreground/50 border-dashed"
                          : "border-2",
                        "mx-auto box-border bg-background group w-[288px] relative grid h-[460px] cursor-pointer place-items-center rounded-lg object-fit text-center transition hover:bg-muted/25",
                        "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      )}
                    >
                      {/* Invisible Input */}
                      {form.getValues("image") ? (
                        <Image
                          src={URL.createObjectURL(form.getValues("image"))}
                          className="absolute w-full h-full aspect-[72/97] z-10 "
                          alt="cover image"
                          width={0}
                          height={0}
                        />
                      ) : (
                        <User className="stroke-transparent fill-muted absolute w-full h-full aspect-[72/97] z-10" />
                      )}
                      <Input
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        full={true}
                        ref={(e) => {
                          ref(e);
                          fileInputRef.current = e;
                        }}
                        type="file"
                        accept="image/*"
                        onChange={(event) =>
                          onChange(event.target.files && event.target.files[0])
                        }
                        {...fieldProps}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="New Title" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the public novel name.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="synopsis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Synopsis</FormLabel>
                  <FormControl>
                    <Textarea placeholder="New Synopsis" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is the novel summary/synopsis.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="author"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Author</FormLabel>
                  <FormControl>
                    <Input placeholder="Author Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="releaseYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Release Year</FormLabel>
                  <FormControl>
                    <Input placeholder="Release Year" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {state.message && <FormMessage>{state.message}</FormMessage>}
            <Button type="submit">
              {isPending ? "Loading..." : "Create Novel"}
            </Button>
          </div>
        </form>
      </Form>
    </MaxWidthWrapper>
  );
}
