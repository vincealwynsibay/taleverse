"use client";

import { createNovel } from "@/lib/actions/novel.action";
import { novelSchema } from "@/lib/validation";
import { useActionState, useRef } from "react";
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

export default function CreateNovelForm() {
  const [state, submitNovel, isPending] = useActionState(createNovel, {
    message: "",
  });

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
  const isValid = form.formState.isValid;

  const formRef = useRef<HTMLFormElement>(null);
  return (
    <Form {...form}>
      <form
        ref={formRef}
        action={(data) => {
          form.trigger();
          if (!isValid) return;
          submitNovel(data);
        }}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="New Title" {...field} />
              </FormControl>
              <FormDescription>This is the public novel name.</FormDescription>
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
      </form>
    </Form>
  );
}
