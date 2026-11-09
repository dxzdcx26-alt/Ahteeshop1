"use client"

import * as React from "react"
import type { ToastActionElement, ToastProps } from "@/components/ui/toast"

type ToastData = ToastProps & {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
}

type ToastState = ToastData & { id: string }
type ToastHandle = { id: string; dismiss: () => void }

const TOAST_LIMIT = 5
const EMPTY_TOASTS: ToastState[] = []
const listeners = new Set<() => void>()
let toasts: ToastState[] = EMPTY_TOASTS
let nextToastId = 0

function notify() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function removeToast(id: string) {
  toasts = toasts.filter((item) => item.id !== id)
  notify()
}

function dismissToast(id?: string) {
  toasts = toasts.map((item) =>
    id === undefined || item.id === id ? { ...item, open: false } : item
  )
  notify()
}

function toast(data: ToastData): ToastHandle {
  const id = String(++nextToastId)
  const item: ToastState = {
    ...data,
    id,
    open: true,
    onOpenChange: (open) => {
      data.onOpenChange?.(open)
      if (!open) removeToast(id)
    },
  }
  toasts = [item, ...toasts].slice(0, TOAST_LIMIT)
  notify()
  return { id, dismiss: () => dismissToast(id) }
}

export function useToast() {
  const currentToasts = React.useSyncExternalStore(
    subscribe,
    () => toasts,
    () => EMPTY_TOASTS
  )
  return { toasts: currentToasts, toast, dismiss: dismissToast }
}