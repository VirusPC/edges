import { Layers2 } from "lucide-react"

export function NavBar() {
  return (
    <nav
      data-review-nav="edges"
      aria-label="Edges"
      className="flex shrink-0 items-center gap-2"
    >
      <span
        data-edges-mark="Layers2"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-[#d7ebf8] text-[#0b1218]"
      >
        <Layers2 className="size-5" aria-hidden="true" />
      </span>
      <span
        data-edges-word="edges"
        className="text-xl font-semibold tracking-wide text-[#f4f7fb]"
      >
        Edges
      </span>
    </nav>
  )
}
