import path from 'node:path';

/**
 * Filesystem interpretation of authored targets. Domain/codec never resolve paths.
 * @param {{children: import('./model.js').NodeLink[], references: import('./model.js').NodeLink[]}} links
 * @param {string} directory
 */
export function resolveNodeLinks(links, directory) {
  if (!path.isAbsolute(directory)) throw new TypeError('Link base must be an absolute directory.');
  /** @param {import('./model.js').NodeLink[]} values */
  function resolve(values) {
    const found = new Set();
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
