"use client"

import * as React from "react"
import { SearchIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface SearchInputProps extends React.ComponentProps<"input"> {
  onValueChange?: (value: string) => void
  debounceMs?: number
}

function SearchInput({
  className,
  value,
  defaultValue,
  onChange,
  onValueChange,
  debounceMs = 0,
  ...props
}: SearchInputProps) {
  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "")
  const currentValue = isControlled ? value : internalValue

  React.useEffect(() => {
    if (!onValueChange) {
      return
    }

    if (debounceMs <= 0) {
      onValueChange(String(currentValue ?? ""))
      return
    }

    const timeoutId = window.setTimeout(() => {
      onValueChange(String(currentValue ?? ""))
    }, debounceMs)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [currentValue, debounceMs, onValueChange])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value

    if (!isControlled) {
      setInternalValue(newValue)
    }

    onChange?.(e)
  }

  return (
    <div className={cn("relative", className)}>
      <SearchIcon
        data-icon="inline-start"
        className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        className="h-9 pl-9 pr-3"
        defaultValue={defaultValue}
        value={currentValue}
        onChange={handleChange}
        {...props}
      />
    </div>
  )
}

export { SearchInput }
