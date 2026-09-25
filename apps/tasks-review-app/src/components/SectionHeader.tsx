export function SectionHeader({
  section,
  collapsed,
  onToggle,
  onBack,
}: {
  section: "projects" | "tasks" | "details"
  collapsed: boolean
  onToggle: () => void
  onBack?: () => void
}) {
  const title =
    section === "projects" ? "Projects" : section === "tasks" ? "Tasks" : "Details"
  return (
    <h2
      data-section-title={section}
      data-section-collapsed={collapsed ? "on" : "off"}
      className="sticky top-0 z-20 flex items-center gap-2 border-b border-[#334155] bg-[#1a2332] px-3 py-2 text-lg font-semibold tracking-wide text-[#e7ecf3]"
    >
      <span className="min-w-0 flex-1">{title}</span>
      {onBack ? (
        <button
          type="button"
          data-section-back="edges"
          className="shrink-0 text-sm font-medium text-[#5b9fd4]"
          onClick={onBack}
        >
          回到看板
        </button>
      ) : null}
      <button
        type="button"
        data-section-toggle={section}
        aria-expanded={!collapsed}
        className="shrink-0 text-sm font-medium text-[#9aa8bc]"
        onClick={onToggle}
      >
        {collapsed ? "展开" : "收起"}
      </button>
    </h2>
  )
}
