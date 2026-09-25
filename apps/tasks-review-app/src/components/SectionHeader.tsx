import type { ReactNode } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

const CHAPTER =
  "border-b border-[#2c4a63] bg-[#163044] text-[#e7ecf3] shadow-none"
const STATUS =
  "border-b border-[#1c2633] bg-[#0f1419] text-[#9aa8bc] shadow-none"

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
