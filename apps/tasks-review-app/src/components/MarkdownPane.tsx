import { useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { reviewItemTitle } from "../display.ts"
import type { ReviewItem } from "../types.ts"
import { scrollReviewToCard, scrollReviewToSection } from "../scroll-review.ts"
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
        variant="chapter"
        section="details"
        toggleId="details"
        title="Details"
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
        onTitleDoubleClick={() => scrollReviewToSection("details")}
        actions={
          narrow ? (
            <button
              type="button"
              data-section-back="edges"
              className="shrink-0 text-sm font-medium text-[#5b9fd4]"
              onClick={() => {
                if (item?.stem) scrollReviewToCard(item.stem)
              }}
            >
              回到看板
            </button>
          ) : null
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
