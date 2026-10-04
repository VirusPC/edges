import type { NodeLink } from './model.js';
import path from 'node:path';

/** Filesystem interpretation of authored targets. Domain/codec never resolve paths. */
export function resolveNodeLinks(links: { children: NodeLink[]; references: NodeLink[] }, directory: string) {
  if (!path.isAbsolute(directory)) throw new TypeError('Link base must be an absolute directory.');

  function resolve(values: NodeLink[]): string[] {
    const found = new Set<string>();
    for (const { target: href } of values) {
      if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) continue;
      let target;
      try { target = decodeURIComponent(href.split(/[?#]/, 1)[0]); } catch { continue; }
      if (target && path.basename(target) === 'AGENTS.md') found.add(path.resolve(directory, target));
    }
    return [...found];
  }
  return { children: resolve(links.children), references: resolve(links.references) };
}
