const CARD_STICKY_OFFSET = 96

function reviewScroller(): HTMLElement | null {
  const scroller = document.querySelector("[data-review-columns]")
  return scroller instanceof HTMLElement ? scroller : null
}

export function scrollReviewTo(target: Element | null, offset = 0) {
  const scroller = reviewScroller()
  if (!scroller || !target) return
  const top = Math.max(
    0,
    scroller.scrollTop +
      target.getBoundingClientRect().top -
      scroller.getBoundingClientRect().top -
      offset
  )
  if (typeof scroller.scrollTo === "function") scroller.scrollTo({ top })
  else scroller.scrollTop = top
}

export function scrollReviewToTop() {
  const scroller = reviewScroller()
  if (!scroller) return
  if (typeof scroller.scrollTo === "function") scroller.scrollTo({ top: 0 })
  else scroller.scrollTop = 0
}

const SECTION_ANCHOR = {
  projects: "[data-review-projects]",
  tasks: "[data-status-board]",
  details: "[data-markdown-pane]",
} as const

export function scrollReviewToSection(section: keyof typeof SECTION_ANCHOR) {
  scrollReviewTo(document.querySelector(SECTION_ANCHOR[section]))
}

export function scrollReviewToCard(stem: string) {
  scrollReviewTo(
    document.querySelector(`[data-stem="${CSS.escape(stem)}"]`),
    CARD_STICKY_OFFSET
  )
}
