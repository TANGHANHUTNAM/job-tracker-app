"use client"

import * as React from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Toaster, toast } from "sonner"

import { FLASH_TOAST_COOKIE, type FlashToast } from "@/lib/toast"

function getFlashToastFromCookie(): FlashToast | null {
  const cookie = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${FLASH_TOAST_COOKIE}=`))

  if (!cookie) {
    return null
  }

  const value = cookie.split("=").slice(1).join("=")

  try {
    return JSON.parse(decodeURIComponent(value)) as FlashToast
  } catch {
    document.cookie = `${FLASH_TOAST_COOKIE}=; path=/; max-age=0; samesite=lax`
    return null
  }
}

function clearFlashToastCookie() {
  document.cookie = `${FLASH_TOAST_COOKIE}=; path=/; max-age=0; samesite=lax`
}

function AppToaster() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  React.useEffect(() => {
    const flashToast = getFlashToastFromCookie()

    if (!flashToast) {
      return
    }

    const showToast =
      flashToast.type === "success"
        ? toast.success
        : flashToast.type === "error"
          ? toast.error
          : toast.message

    showToast(flashToast.message)
    clearFlashToastCookie()
  }, [pathname, searchParams])

  return <Toaster closeButton position="top-right" richColors />
}

export { AppToaster }
