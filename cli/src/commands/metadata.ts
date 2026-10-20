export function collectRepeat(value: string, previous: string[] = []): string[] {
  return [...previous, value];
}
