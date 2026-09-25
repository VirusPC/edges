import type { ReactNode } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

const CHAPTER =
  "border-y border-[#5b9fd4]/50 bg-[#1e3348] text-[#f4f7fb] shadow-[inset_3px_0_0_0_#5b9fd4]"
const STATUS =
  "border-b border-[#2a3544] bg-[#121820] text-[#c5d0de] shadow-none"

export function SectionHeader({
  title,
  collapsed,
  onToggle,
  toggleId,
  actions,
  stickyClassName = "sticky top-0 z-20",
  section,
  variant,
}: {
  title: ReactNode
  collapsed: boolean
  onToggle: () => void
  toggleId: string
  actions?: ReactNode
  stickyClassName?: string
  section?: "projects" | "tasks" | "details"
  variant: "chapter" | "status"
}) {
  const ToggleIcon = collapsed ? ChevronRight : ChevronDown
  const surface = variant === "chapter" ? CHAPTER : STATUS
  return (
    <h2
      data-section-title={section}
      data-section-variant={variant}
      data-section-collapsed={collapsed ? "on" : "off"}
      className={
        "flex h-12 shrink-0 items-center gap-2 px-3 text-lg font-semibold tracking-wide " +
        surface +
        " " +
        stickyClassName
      }
    >
      <span className="flex min-w-0 flex-1 items-center gap-2 truncate">{title}</span>
      {actions}
      <button
        type="button"
        data-section-toggle={toggleId}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "展开" : "收起"}
        className={
          "inline-flex size-7 shrink-0 items-center justify-center " +
          (variant === "chapter" ? "text-[#9aa8bc]" : "text-[#66788c]")
        }
        onClick={onToggle}
      >
        <ToggleIcon className="size-4" aria-hidden="true" />
      </button>
    </h2>
  )
}
