"use client";

import {
  publishChapter,
  schedulePublicRelease,
} from "@/lib/actions/chapter.action";
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
import { DialogDescription } from "@radix-ui/react-dialog";

export default function PublishButton({
  chapterId,
  isSaving,
}: {
  chapterId: number;
  isSaving: boolean;
}) {
  const [publishDate, setPublishDate] = useState<Date | undefined>(
    new Date(addMinutes(new Date(), 5))
  );
  const [publicDate, setPublicDate] = useState<Date | undefined>(
    new Date(addMinutes(new Date(), 5))
  );
  const [publishOpen, setPublishOpen] = useState(false);
  const [publicOpen, setPublicOpen] = useState(false);
  const handleSchedulePublishChapter = async () => {
    await publishChapter(chapterId, publishDate as Date);
    setPublishOpen(false);
  };

  const handleSchedulePublicRelease = async () => {
    await schedulePublicRelease(chapterId, publicDate as Date);
    setPublicOpen(false);
  };

  const handlePublishChapter = async () => {
    await publishChapter(chapterId, new Date());
  };

  return (
    <div className="">
      <Button onClick={() => handlePublishChapter()} disabled={isSaving}>
        Publish Now
      </Button>
      <Dialog modal={true} open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogTrigger asChild>
          <Button>Schedule Publish</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Publish Schedule</DialogTitle>
          </DialogHeader>
          <DateTimePicker
            hourCycle={12}
            value={publishDate}
            onChange={setPublishDate}
          />

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
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
              Schedule Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
