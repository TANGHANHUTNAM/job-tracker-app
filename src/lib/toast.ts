type FlashToastType = "success" | "error" | "info"

interface FlashToast {
  type: FlashToastType
  message: string
}

const FLASH_TOAST_COOKIE = "job-tracker-flash-toast"

const flashToastCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  maxAge: 60,
}

function serializeFlashToast(value: FlashToast) {
  return encodeURIComponent(JSON.stringify(value))
}

export { FLASH_TOAST_COOKIE, flashToastCookieOptions, serializeFlashToast }
export type { FlashToast, FlashToastType }
