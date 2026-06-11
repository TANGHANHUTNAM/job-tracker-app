"use client";

import * as React from "react";
import { vi } from "date-fns/locale";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames, type DayPickerProps } from "react-day-picker";
import "react-day-picker/style.css";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

function Calendar({ className, classNames, showOutsideDays = true, ...props }: DayPickerProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={vi}
      className={cn("p-2", className)}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex flex-col gap-4 sm:flex-row", defaultClassNames.months),
        month: cn("flex flex-col gap-4", defaultClassNames.month),
        month_caption: cn("relative flex items-center justify-center pt-1", defaultClassNames.month_caption),
        caption_label: cn("font-heading text-sm font-medium", defaultClassNames.caption_label),
        nav: cn("flex items-center gap-1", defaultClassNames.nav),
        button_previous: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "absolute left-1 top-1 size-7", defaultClassNames.button_previous),
        button_next: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "absolute right-1 top-1 size-7", defaultClassNames.button_next),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn("w-9 text-xs font-medium text-muted-foreground", defaultClassNames.weekday),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn(defaultClassNames.day, "size-9 p-0 text-sm"),
        day_button: cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "size-9 rounded-md p-0 font-normal aria-selected:opacity-100", defaultClassNames.day_button),
        selected: cn("bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground", defaultClassNames.selected),
        today: cn("bg-accent text-accent-foreground", defaultClassNames.today),
        outside: cn("text-muted-foreground opacity-50", defaultClassNames.outside),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className={cn("size-4", iconClassName)} {...iconProps} />
          ) : (
            <ChevronRightIcon className={cn("size-4", iconClassName)} {...iconProps} />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
