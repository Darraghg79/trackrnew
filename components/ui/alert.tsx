"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive"
}

export function Alert({ className, variant = "default", ...props }: AlertProps) {
  const variantStyles = {
    default: "bg-background text-foreground",
    destructive: "border-red-500/50 text-red-600 dark:border-red-500",
  }

  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border p-4",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

export function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h5
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...props}
    />
  )
}

export function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <div
      className={cn("text-sm", className)}
      {...props}
    />
  )
}