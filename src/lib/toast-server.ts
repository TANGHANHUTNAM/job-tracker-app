import { cookies } from "next/headers"

import {
  FLASH_TOAST_COOKIE,
  flashToastCookieOptions,
  serializeFlashToast,
  type FlashToast,
} from "@/lib/toast"

async function setFlashToast(value: FlashToast) {
  const cookieStore = await cookies()

  cookieStore.set(
    FLASH_TOAST_COOKIE,
    serializeFlashToast(value),
    flashToastCookieOptions
  )
}

export { setFlashToast }
