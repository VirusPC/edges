import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { reviewItemTitle } from "../display.ts"
import type { ReviewItem } from "../types.ts"
import { SectionHeader } from "./SectionHeader.tsx"

export function MarkdownPane({
  item,
  narrow,
}: {
  item?: ReviewItem
  narrow: boolean
}) {
  const body = item?.doc?.body ?? ""
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    if (item) setCollapsed(false)
  }, [item])
  return (
    <aside
      id="review-detail"
      data-markdown-pane="true"
      className="flex w-full min-w-0 shrink-0 flex-col bg-[#121820] md:min-h-0"
    >
      <SectionHeader
        section="details"
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        onBack={
          narrow
            ? () =>
                document
                  .getElementById("review-board")
                  ?.scrollIntoView?.({ block: "start" })
            : undefined
        }
      />
      {collapsed ? null : (
        <>
          {item ? (
            <header className="border-b border-[#334155] px-4 py-3">
              <p className="text-base leading-snug font-semibold text-[#e7ecf3]">
                {reviewItemTitle(item)}
              </p>
              <p className="mt-1 truncate font-mono text-[11px] text-[#9aa8bc]">
                {item.stem}
              </p>
            </header>
          ) : (
            <p className="px-4 py-6 text-sm text-[#9aa8bc]">
              选择一张卡片查看正文
            </p>
          )}
          <div className="markdown-body px-4 py-3 text-sm leading-relaxed text-[#e7ecf3] md:min-h-0 md:flex-1 md:overflow-auto">
            {body === "" ? null : (
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
