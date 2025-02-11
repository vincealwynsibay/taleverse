"use client";

import { publishChapter } from "@/lib/actions/chapter.action";
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
import { addMinutes } from "date-fns";

export default function PublishButton({
  chapterId,
  isSaving,
}: {
  chapterId: number;
  isSaving: boolean;
}) {
  const [date, setDate] = useState<Date | undefined>(
    new Date(addMinutes(new Date(), 5))
  );
  const handleSchedulePublishChapter = async () => {
    await publishChapter(chapterId, date as Date);
  };
  const handlePublishChapter = async () => {
    await publishChapter(chapterId, new Date());
  };

  return (
    <Dialog>
      <DialogTrigger>Publish</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Publish Schedule</DialogTitle>
        </DialogHeader>
        <DateTimePicker hourCycle={12} value={date} onChange={setDate} />

        <DialogFooter className="justify-end mt-4 flex flex-row items-center gap-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Close
            </Button>
          </DialogClose>
          <Button
            onClick={() => handleSchedulePublishChapter()}
            disabled={isSaving}
          >
            Schedule Publish
          </Button>
          <Button onClick={() => handlePublishChapter()} disabled={isSaving}>
            Publish Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
