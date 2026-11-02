#!/usr/bin/env node
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Superseded by ADR 0052; never recreate Task Project indexes on current boards. */
const retired = () => { throw new Error("The Task Project list migration is retired; use the recursive Project migration instead."); };
export function planTaskProjectLists(_root: string): never { return retired(); }
export async function applyTaskProjectLists(_plan: unknown): Promise<never> { return retired(); }

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.stderr.write("The Task Project list migration is retired; use the recursive Project migration instead.\n");
  process.exitCode = 1;
}
