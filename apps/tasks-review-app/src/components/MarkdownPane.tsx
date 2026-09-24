import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { reviewItemTitle } from "../display.ts"
import type { ReviewItem } from "../types.ts"

export function MarkdownPane({
  item,
  narrow,
}: {
  item?: ReviewItem
  narrow: boolean
}) {
  const body = item?.doc?.body ?? ""
  return (
    <aside
      id="review-detail"
      data-markdown-pane="true"
      hidden={narrow && !item}
      className="flex w-full min-w-0 shrink-0 flex-col bg-[#121820] md:min-h-0"
    >
      {narrow && item ? (
        <div
          data-detail-sticky="edges"
          className="sticky top-0 z-30 flex min-h-12 items-center gap-2 border-b border-[#334155] bg-[#0f1419] px-3"
        >
          <button
            type="button"
            className="shrink-0 text-sm text-[#5b9fd4]"
            onClick={() =>
              document
                .getElementById("review-board")
                ?.scrollIntoView({ block: "start" })
            }
          >
            回到看板
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#e7ecf3]">
            {reviewItemTitle(item)}
          </p>
        </div>
      ) : null}
      <h2
        data-section-title="details"
        className="border-b border-[#334155] bg-[#1a2332] px-3 py-2 text-lg font-semibold tracking-wide text-[#e7ecf3]"
      >
        Details
      </h2>
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
        <p className="px-4 py-6 text-sm text-[#9aa8bc]">选择一张卡片查看正文</p>
      )}
      <div className="markdown-body px-4 py-3 text-sm leading-relaxed text-[#e7ecf3] md:min-h-0 md:flex-1 md:overflow-auto">
        {body === "" ? null : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        )}
      </div>
    </aside>
  )
}
