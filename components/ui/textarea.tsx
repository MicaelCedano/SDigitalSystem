import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-slate-300 placeholder:text-slate-500 focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 flex min-h-20 w-full rounded-md border bg-white px-3 py-2 text-sm !text-slate-950 shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
