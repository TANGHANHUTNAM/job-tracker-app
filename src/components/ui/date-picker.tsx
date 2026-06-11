"use client";

import * as React from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  id?: string;
  value?: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
}

function DatePicker({ id, value, placeholder = "Chọn ngày", onValueChange }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className={cn("w-full justify-between text-left font-normal", !selectedDate && "text-muted-foreground")}
          />
        }
      >
        <span className="truncate">
          {selectedDate ? format(selectedDate, "dd/MM/yyyy", { locale: vi }) : placeholder}
        </span>
        <span className="flex items-center gap-1">
          {selectedDate && (
            <span
              className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onValueChange("");
              }}
            >
              <XIcon className="size-3.5" />
            </span>
          )}
          <CalendarIcon data-icon="inline-end" />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onValueChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export { DatePicker };
