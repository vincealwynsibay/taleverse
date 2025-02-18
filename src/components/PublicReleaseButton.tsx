"use client";

import { schedulePublicRelease } from "@/lib/actions/chapter.action";
import { Button } from "./ui/button";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { DateTimePicker } from "./ui/datetime-picker";
import { DialogDescription } from "@radix-ui/react-dialog";

export default function PublicReleaseButton({
  chapterId,
  isSaving,
  publicAt,
}: {
  chapterId: number;
  isSaving: boolean;
  publicAt?: Date;
}) {
  const [publicDate, setPublicDate] = useState<Date | undefined>(
    publicAt || undefined
  );
  const [publicOpen, setPublicOpen] = useState(false);

  const handleSchedulePublicRelease = async () => {
    await schedulePublicRelease(chapterId, publicDate as Date);
    setPublicOpen(false);
  };

  return (
    <div className="">
      <Dialog modal={true} open={publicOpen} onOpenChange={setPublicOpen}>
        <DialogTrigger asChild>
          <Button>Set to Private</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Public Release</DialogTitle>
            <DialogDescription>
              Leave empty if public by default
            </DialogDescription>
          </DialogHeader>
          <DateTimePicker
            hourCycle={12}
            value={publicDate}
            onChange={setPublicDate}
          />

          <DialogFooter className="justify-end mt-4 flex flex-row items-center gap-4">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Close
              </Button>
            </DialogClose>
            <Button
              onClick={() => handleSchedulePublicRelease()}
              disabled={isSaving}
            >
              Schedule Release
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
