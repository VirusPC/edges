import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPane({ body }: { body: string }) {
  return (
    <aside data-markdown-pane="true" className="min-h-0 overflow-auto border-l border-[#334155] p-4">
      {body === "" ? null : <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>}
    </aside>
  );
}
