import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { reviewItemTitle } from "../display.ts";
import type { ReviewItem } from "../types.ts";

export function MarkdownPane({ item }: { item?: ReviewItem }) {
  const body = item?.doc?.body ?? "";
  return (
    <aside data-markdown-pane="true" className="flex min-h-0 flex-col border-l border-[#334155] bg-[#121820]">
      {item ? (
        <header className="border-b border-[#334155] px-4 py-3">
          <p className="text-sm font-medium leading-snug text-[#e7ecf3]">{reviewItemTitle(item)}</p>
          <p className="mt-1 truncate font-mono text-[11px] text-[#9aa8bc]">{item.stem}</p>
        </header>
      ) : (
        <p className="px-4 py-6 text-sm text-[#9aa8bc]">选择一张卡片查看正文</p>
      )}
      <div className="markdown-body min-h-0 flex-1 overflow-auto px-4 py-3 text-sm leading-relaxed text-[#e7ecf3]">
        {body === "" ? null : <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>}
      </div>
    </aside>
  );
}
