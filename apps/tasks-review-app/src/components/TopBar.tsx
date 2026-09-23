import { itemAssignee, type ReviewFilter, type ReviewItem } from "../filter.ts";
import { exportReviewRows } from "../export.ts";
import { REVIEW_PRIORITIES, REVIEW_STATUS_COLUMNS } from "../statuses.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL_ASSIGNEE = "__all__";

export function TopBar({
  items,
  filter,
  onChange,
}: {
  items: ReviewItem[];
  filter: ReviewFilter;
  onChange: (next: ReviewFilter) => void;
}) {
  const assignees = [...new Set(items.map(itemAssignee).filter((name) => name !== ""))].sort((a, b) =>
    a.localeCompare(b),
  );
  return (
    <header className="flex flex-wrap items-center gap-2 border-b border-[#334155] bg-[#0f1419] px-3 py-2.5">
      <Input
        data-filter="q"
        value={filter.q}
        placeholder="全文"
        className="h-8 w-64 max-w-full shrink-0 bg-[#1a2332]"
        onChange={(event) => onChange({ ...filter, q: event.target.value })}
      />
      <Select
        value={filter.priority}
        onValueChange={(priority) => onChange({ ...filter, priority: priority as ReviewFilter["priority"] })}
      >
        <SelectTrigger data-filter="priority" size="sm" className="bg-[#1a2332]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部优先级</SelectItem>
          {REVIEW_PRIORITIES.map((priority) => (
            <SelectItem key={priority} value={priority}>
              {priority}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filter.assignee === "" ? ALL_ASSIGNEE : filter.assignee}
        onValueChange={(assignee) =>
          onChange({ ...filter, assignee: assignee === ALL_ASSIGNEE ? "" : assignee })
        }
      >
        <SelectTrigger data-filter="assignee" size="sm" className="bg-[#1a2332]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_ASSIGNEE}>全部负责人</SelectItem>
          {assignees.map((assignee) => (
            <SelectItem key={assignee} value={assignee}>
              {assignee}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={filter.status}
        onValueChange={(status) => onChange({ ...filter, status: status as ReviewFilter["status"] })}
      >
        <SelectTrigger data-filter="status" size="sm" className="bg-[#1a2332]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部状态</SelectItem>
          {REVIEW_STATUS_COLUMNS.map((status) => (
            <SelectItem key={status} value={status}>
              {status}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-action="copy-json"
        className="ml-auto border-[#334155] bg-[#1a2332] text-[#e7ecf3] hover:bg-[#243044]"
        onClick={() => {
          const text = JSON.stringify(exportReviewRows(items), null, 2);
          const write = navigator.clipboard?.writeText(text);
          if (write === undefined) {
            console.log(text);
            return;
          }
          void write.catch(() => {
            console.log(text);
          });
        }}
      >
        复制导出 JSON
      </Button>
    </header>
  );
}
