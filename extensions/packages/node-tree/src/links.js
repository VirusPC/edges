import path from 'node:path';
import { fromMarkdown } from 'mdast-util-from-markdown';

/**
 * @typedef {object} NodeLinks
 * @property {string[]} children AGENTS entry paths registered in the child index.
 * @property {string[]} references Other local AGENTS links, not ownership edges.
 */

/**
 * Parse actual Markdown links, excluding code, comments and escaped examples.
 * @param {string} content
 * @param {string} directory
 * @returns {NodeLinks}
 */
export function parseNodeLinks(content, directory) {
  const ast = fromMarkdown(content);
  const children = new Set();
  const references = new Set();
  /** @type {Map<string, string>} */
  const definitions = new Map();
  /** @type {import('mdast').Nodes[]} */
  const pending = [ast];
  while (pending.length) {
    const node = pending.pop();
    if (!node) continue;
    if (node.type === 'definition' && !definitions.has(node.identifier)) definitions.set(node.identifier, node.url);
    if ('children' in node) {
      for (let i = node.children.length - 1; i >= 0; i--) pending.push(node.children[i]);
    }
  }
  let markedChildren = false;
  /** @type {number | undefined} */
  let childHeadingDepth;

  /** @param {import('mdast').Nodes} node @param {Set<string>} targets */
  function collect(node, targets) {
    const href = node.type === 'link' ? node.url : node.type === 'linkReference' ? definitions.get(node.identifier) : undefined;
    if (href && !/^[a-z][a-z\d+.-]*:/i.test(href) && !href.startsWith('//')) {
      let target;
      try { target = decodeURIComponent(href.split(/[?#]/, 1)[0]); } catch { target = ''; }
      if (target && path.basename(target) === 'AGENTS.md') targets.add(path.resolve(directory, target));
    }
    if ('children' in node) for (const child of node.children) collect(child, targets);
  }

  for (const block of ast.children) {
    if (block.type === 'html') {
      if (block.value.trim() === '<!-- project-memory-children:start -->') markedChildren = true;
      if (block.value.trim() === '<!-- project-memory-children:end -->') {
        markedChildren = false;
        childHeadingDepth = undefined;
      }
      continue;
    }
    if (block.type === 'heading' && !markedChildren) {
      if (childHeadingDepth && block.depth <= childHeadingDepth) childHeadingDepth = undefined;
      const title = block.children.map(node => node.type === 'text' ? node.value : '').join('');
      if (title === '下层记忆索引') childHeadingDepth = block.depth;
    }
    collect(block, markedChildren || childHeadingDepth ? children : references);
  }
  return { children: [...children], references: [...references] };
}
