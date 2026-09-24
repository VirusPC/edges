import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { reviewItemTitle } from "../display.ts";
import type { ReviewItem } from "../types.ts";

export function MarkdownPane({ item, narrow }: { item?: ReviewItem; narrow: boolean }) {
  const body = item?.doc?.body ?? "";
  return (
    <aside
      id="review-detail"
      data-markdown-pane="true"
      hidden={narrow && !item}
      className="flex w-full min-w-0 shrink-0 flex-col bg-[#121820] md:min-h-0"
    >
      {item ? (
        <header className="border-b border-[#334155] px-4 py-3">
          {narrow ? (
            <button
              type="button"
              className="mb-2 text-sm text-[#5b9fd4]"
              onClick={() => document.getElementById("review-board")?.scrollIntoView({ block: "start" })}
            >
              回到看板
            </button>
          ) : null}
          <p className="text-base font-semibold leading-snug text-[#e7ecf3]">{reviewItemTitle(item)}</p>
          <p className="mt-1 truncate font-mono text-[11px] text-[#9aa8bc]">{item.stem}</p>
        </header>
      ) : (
        <p className="px-4 py-6 text-sm text-[#9aa8bc]">选择一张卡片查看正文</p>
      )}
      <div className="markdown-body px-4 py-3 text-sm leading-relaxed text-[#e7ecf3] md:min-h-0 md:flex-1 md:overflow-auto">
        {body === "" ? null : <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>}
      </div>
    </aside>
  );
}
