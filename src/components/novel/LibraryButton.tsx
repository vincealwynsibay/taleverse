"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BookmarkCheck, BookmarkPlus } from "lucide-react";
import { toast } from "sonner";
import { toggleLibraryAction } from "@/app/actions/reader";
import { Button } from "@/components/ui/button";

export function LibraryButton({ novelId, inLibrary, signedIn }: { novelId: number; inLibrary: boolean; signedIn: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(inLibrary);

  return (
    <Button
      size="lg"
      variant="outline"
      aria-pressed={optimistic}
      disabled={pending}
      onClick={() => {
        if (!signedIn) {
          router.push("/sign-in");
          return;
        }
        start(async () => {
          setOptimistic(!optimistic);
          const res = await toggleLibraryAction(novelId);
          if (!res.ok) toast.error(res.error);
          else toast.success(res.data.inLibrary ? "Added to your library" : "Removed from your library");
          router.refresh();
        });
      }}
    >
      {optimistic ? <BookmarkCheck className="text-primary" /> : <BookmarkPlus />}
      {optimistic ? "In library" : "Add to library"}
    </Button>
  );
}
