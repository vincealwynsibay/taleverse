import { cn } from "@/lib/utils";
import React from "react";

interface PartialStarProps {
  fillPercentage: number;
  size: number;
  className?: string;
  Icon: React.ReactElement;
}
export default function PartialStar({
  fillPercentage,
  size,
  className,
  Icon,
}: PartialStarProps) {
  return (
    <div className="relative inline-block">
      {React.cloneElement(Icon, {
        size,
        className: cn("fill-transparent", className),
      })}
      <div
        className={cn("absolute top-0 left-0", `w-[${fillPercentage * 100}%]`)}
      >
        {React.cloneElement(Icon, {
          size,
          className: cn("fill-current", className),
        })}
      </div>
    </div>
  );
}
