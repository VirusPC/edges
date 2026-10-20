import { useEffect, useState } from "react";

const NARROW_QUERY = "(max-width: 767px)";

function readNarrow(): boolean {
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia(NARROW_QUERY).matches;
}

export function useNarrowLayout(): boolean {
  const [narrow, setNarrow] = useState(readNarrow);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const media = window.matchMedia(NARROW_QUERY);
    const apply = () => setNarrow(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  return narrow;
}
