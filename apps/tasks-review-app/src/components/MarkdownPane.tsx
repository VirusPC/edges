import type { ReactNode } from "react"
import { createPortal } from "react-dom"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { reviewItemTitle } from "../display.ts"
import type { ReviewItem } from "../types.ts"

export function MarkdownPane({
  item,
  narrow,
  open = false,
  onBack,
}: {
  item?: ReviewItem
  narrow: boolean
  open?: boolean
  onBack?: () => void
}) {
  const body = item?.doc?.body ?? ""
  const showPanel = narrow && open && item != null
  const article: ReactNode = (
    <>
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
    </>
  )
  const pane = (
    <aside
      id="review-detail"
      data-markdown-pane="true"
      data-detail-panel={showPanel ? "viewport" : undefined}
      hidden={narrow && !showPanel}
      className={
        "flex w-full min-w-0 shrink-0 flex-col bg-[#121820] md:min-h-0" +
        (showPanel
          ? " fixed inset-x-0 top-12 bottom-0 z-40 h-[calc(100dvh-3rem)] overflow-hidden"
          : "")
      }
      style={
        showPanel
          ? {
              position: "fixed",
              top: "3rem",
              right: 0,
              bottom: 0,
              left: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              height: "calc(100dvh - 3rem)",
              maxHeight: "calc(100dvh - 3rem)",
              zIndex: 40,
            }
          : undefined
      }
    >
      {showPanel ? (
        <div
          data-detail-sticky="edges"
          className="flex h-12 shrink-0 items-center gap-2 border-b border-[#334155] bg-[#0f1419] px-3"
          style={{ flex: "0 0 auto" }}
        >
          <button
            type="button"
            className="shrink-0 text-sm text-[#5b9fd4]"
            onClick={onBack}
          >
            回到看板
          </button>
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-[#e7ecf3]">
            {reviewItemTitle(item)}
          </p>
        </div>
      ) : null}
      {showPanel ? (
        <div
          data-detail-body="edges"
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
          style={{
            flex: "1 1 0%",
            minHeight: 0,
            overflowY: "auto",
            overscrollBehaviorY: "contain",
          }}
        >
          {article}
        </div>
      ) : (
        article
      )}
    </aside>
  )
  if (narrow && typeof document !== "undefined") {
    return createPortal(pane, document.body)
  }
  return pane
}
