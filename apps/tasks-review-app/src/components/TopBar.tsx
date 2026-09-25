import { useState } from "react"
import { ListFilter, X } from "lucide-react"
import { itemAssignee, type ReviewFilter, type ReviewItem } from "../filter.ts"
import { statusLabel } from "../display.ts"
import { exportReviewRows } from "../export.ts"
import { REVIEW_PRIORITIES, REVIEW_STATUS_COLUMNS } from "../statuses.ts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const ALL_ASSIGNEE = "__all__"

function copyExport(items: ReviewItem[]) {
  const text = JSON.stringify(exportReviewRows(items), null, 2)
  const write = navigator.clipboard?.writeText(text)
  if (write === undefined) {
    console.log(text)
    return
  }
  void write.catch(() => {
    console.log(text)
  })
}

function FilterFields({
  items,
  filter,
  onChange,
  stacked = false,
  portalContainer = null,
}: {
  items: ReviewItem[]
  filter: ReviewFilter
  onChange: (next: ReviewFilter) => void
  stacked?: boolean
  portalContainer?: HTMLElement | null
}) {
  const assignees = [
    ...new Set(items.map(itemAssignee).filter((name) => name !== "")),
  ].sort((a, b) => a.localeCompare(b))
  const triggerClass = stacked ? "w-full bg-[#1a2332]" : "bg-[#1a2332]"
  return (
    <>
      <Input
        data-filter="q"
        value={filter.q}
        placeholder="全文"
        className={
          stacked
            ? "h-8 w-full bg-[#1a2332]"
            : "h-8 w-64 max-w-full shrink-0 bg-[#1a2332]"
        }
        onChange={(event) => onChange({ ...filter, q: event.target.value })}
      />
      <Select
        value={filter.priority}
        onValueChange={(priority) =>
          onChange({
            ...filter,
            priority: priority as ReviewFilter["priority"],
          })
        }
      >
        <SelectTrigger
          data-filter="priority"
          size="sm"
          className={triggerClass}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={portalContainer}>
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
          onChange({
            ...filter,
            assignee: assignee === ALL_ASSIGNEE ? "" : assignee,
          })
        }
      >
        <SelectTrigger
          data-filter="assignee"
          size="sm"
          className={triggerClass}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={portalContainer}>
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
        onValueChange={(status) =>
          onChange({ ...filter, status: status as ReviewFilter["status"] })
        }
      >
        <SelectTrigger data-filter="status" size="sm" className={triggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent container={portalContainer}>
          <SelectItem value="all">全部状态</SelectItem>
          {REVIEW_STATUS_COLUMNS.map((status) => (
            <SelectItem key={status} value={status}>
              {statusLabel(status)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="sm"
        data-action="copy-json"
        className="border-[#334155] bg-[#1a2332] text-[#e7ecf3] hover:bg-[#243044]"
        onClick={() => copyExport(items)}
      >
        复制导出 JSON
      </Button>
    </>
  )
}

export function TopBar({
  items,
  filter,
  onChange,
  narrow,
}: {
  items: ReviewItem[]
  filter: ReviewFilter
  onChange: (next: ReviewFilter) => void
  narrow: boolean
}) {
  const [sheetEl, setSheetEl] = useState<HTMLDivElement | null>(null)
  if (narrow) {
    return (
      <div className="ml-auto flex items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="筛选"
              data-action="open-filters"
              data-filter-icon="ListFilter"
              className="size-8 border-[#334155] bg-transparent text-[#9aa8bc] hover:bg-[#243044] hover:text-[#e7ecf3]"
            >
              <ListFilter className="size-4" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent
            ref={setSheetEl}
            data-filter-sheet=""
            onInteractOutside={(event) => {
              const target = event.target
              if (
                target instanceof Element &&
                target.closest("[data-slot=select-content]")
              ) {
                event.preventDefault()
              }
            }}
          >
            <SheetHeader>
              <SheetTitle>筛选</SheetTitle>
              <SheetClose
                aria-label="关闭筛选"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-[#9aa8bc] hover:bg-[#243044] hover:text-[#e7ecf3]"
              >
                <X className="size-4" aria-hidden />
              </SheetClose>
            </SheetHeader>
            <SheetDescription>
              全文、优先级、负责人和状态。导出 JSON 也在这里。
            </SheetDescription>
            <div className="flex flex-col gap-2">
              <FilterFields
                items={items}
                filter={filter}
                onChange={onChange}
                stacked
                portalContainer={sheetEl}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    )
  }
  return (
    <div className="ml-auto flex max-w-full min-w-0 flex-wrap items-center justify-end gap-2">
      <FilterFields items={items} filter={filter} onChange={onChange} />
    </div>
  )
}
