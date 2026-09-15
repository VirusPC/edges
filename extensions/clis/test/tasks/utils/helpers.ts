import { mkdir, readdir, readFile, rename, unlink, writeFile, access } from "node:fs/promises";
import type { BoardFs } from "../../../src/tasks/utils/board.js";

export type BoardWriter = BoardFs & {
  writeFile(abs: string, contents: string): Promise<void>;
  mkdirp(abs: string): Promise<void>;
  rename?(from: string, to: string): Promise<void>;
  unlink?(abs: string): Promise<void>;
};

export function nodeBoardFs(): BoardFs {
  return {
    async readFile(abs: string): Promise<string> {
      return readFile(abs, "utf8");
    },
    async readdir(abs: string): Promise<string[]> {
      return readdir(abs);
    },
    async exists(abs: string): Promise<boolean> {
      try {
        await access(abs);
        return true;
      } catch {
        return false;
      }
    },
  };
}

export function nodeBoardWriter(): BoardWriter {
  const fs = nodeBoardFs();
  return {
    ...fs,
    async writeFile(abs: string, contents: string): Promise<void> {
      await writeFile(abs, contents, "utf8");
    },
    async mkdirp(abs: string): Promise<void> {
      await mkdir(abs, { recursive: true });
    },
    async rename(from: string, to: string): Promise<void> {
      await rename(from, to);
    },
    async unlink(abs: string): Promise<void> {
      await unlink(abs);
    },
  };
}
