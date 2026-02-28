import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-slate-950 placeholder:text-slate-500 selection:bg-indigo-100 selection:text-indigo-900 border-slate-300 h-10 w-full min-w-0 rounded-md border bg-white px-3 py-2 text-sm !text-slate-950 shadow-sm transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-indigo-500 focus-visible:ring-indigo-500/20 focus-visible:ring-[3px]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
