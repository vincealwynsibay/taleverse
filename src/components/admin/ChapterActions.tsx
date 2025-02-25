"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { createChapterAction, deleteChapterAction, deleteNovelAction } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function NewChapterButton({ novelId }: { novelId: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await createChapterAction(novelId);
          if (!res.ok) toast.error(res.error);
          else router.push(`/admin/novels/${res.data.slug}/chapters/${res.data.number}`);
        })
      }
    >
      {pending ? <LoaderCircle className="animate-spin" /> : <Plus />} New chapter
    </Button>
  );
}

function ConfirmDelete({
  title,
  description,
  onConfirm,
  trigger,
}: {
  title: string;
  description: string;
  onConfirm: () => Promise<void>;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await onConfirm();
                setOpen(false);
              })
            }
          >
            {pending && <LoaderCircle className="animate-spin" />} Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteChapterButton({ chapterId, label }: { chapterId: number; label: string }) {
  const router = useRouter();
  return (
    <ConfirmDelete
      title={`Delete ${label}?`}
      description="Readers lose access immediately and its comments are deleted. Credits already spent on it are not refunded."
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive">
          <Trash2 /> Delete chapter
        </Button>
      }
      onConfirm={async () => {
        const res = await deleteChapterAction(chapterId);
        if (!res.ok) toast.error(res.error);
        else {
          toast.success("Chapter deleted");
          router.push(`/admin/novels/${res.data.slug}`);
          router.refresh();
        }
      }}
    />
  );
}

export function DeleteNovelButton({ novelId, title }: { novelId: number; title: string }) {
  const router = useRouter();
  return (
    <ConfirmDelete
      title={`Delete “${title}”?`}
      description="This removes the novel, every chapter, and all reviews and comments on it."
      trigger={
        <Button variant="ghost" size="sm" className="text-destructive">
          <Trash2 /> Delete novel
        </Button>
      }
      onConfirm={async () => {
        const res = await deleteNovelAction(novelId);
        if (!res.ok) toast.error(res.error);
        else {
          toast.success("Novel deleted");
          router.push("/admin");
          router.refresh();
        }
      }}
    />
  );
}
