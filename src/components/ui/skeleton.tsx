import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton rounded-[var(--radius-control)]", className)}
      {...props}
    />
  )
}

export { Skeleton }
