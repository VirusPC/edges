import type { ReactNode } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"

export function SectionHeader({
  title,
  collapsed,
  onToggle,
  toggleId,
  actions,
  stickyClassName = "sticky top-0 z-20",
  section,
}: {
  title: ReactNode
  collapsed: boolean
  onToggle: () => void
  toggleId: string
  actions?: ReactNode
  stickyClassName?: string
  section?: "projects" | "tasks" | "details"
}) {
  const ToggleIcon = collapsed ? ChevronRight : ChevronDown
  return (
    <h2
      data-section-title={section}
      data-section-collapsed={collapsed ? "on" : "off"}
      className={
        "flex h-12 shrink-0 items-center gap-2 border-b border-[#334155] bg-[#1a2332] px-3 text-lg font-semibold tracking-wide text-[#e7ecf3] " +
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
        className="inline-flex size-7 shrink-0 items-center justify-center text-[#9aa8bc]"
        onClick={onToggle}
      >
        <ToggleIcon className="size-4" aria-hidden="true" />
      </button>
    </h2>
  )
}
