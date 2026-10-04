/** Display source fields as plain text inside one Markdown index row. */
export function escapeIndexText(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[\\`*_{}\[\]()<>!|]/g, "\\$&");
}

/** Encode source filenames so whitespace and Markdown cannot change link structure. */
export function encodeIndexPath(value: string): string {
  return value
    .split("/")
    .map((segment) =>
      encodeURIComponent(segment).replace(
        /[!'()*]/g,
        (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
      ),
    )
    .join("/");
}
