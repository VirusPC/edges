import { fromMarkdown } from 'mdast-util-from-markdown';
import { createNodeModel } from '../model.js';

/** @typedef {import('../model.js').NodeModel} NodeModel */
/** @typedef {import('../model.js').SectionKey} SectionKey */
/** @typedef {import('../model.js').NodeItem} NodeItem */
/** @typedef {import('../model.js').NodeLink} NodeLink */
/** @typedef {import('mdast').Nodes} AstNode */
/** @typedef {{start: number, end: number, prefix: string, protected: boolean}} Binding */

/** @type {Record<string, SectionKey>} */
const markers = { important: 'constraints', local: 'memory', children: 'children' };
/** @type {Record<string, SectionKey>} */
const titles = { 本层硬约束: 'constraints', 本层重要约束: 'constraints', 本层记忆: 'memory', 下层记忆索引: 'children' };

/** @param {AstNode} node */
function start(node) { return node.position?.start.offset ?? 0; }
/** @param {AstNode} node */
function end(node) { return node.position?.end.offset ?? 0; }

/** Private codec representation: source ranges/Markdown syntax never enter NodeModel. @param {string} source */
export function decodeDocument(source) {
  const ast = fromMarkdown(source);
  const model = createNodeModel();
  /** @type {Record<SectionKey, Binding[]>} */
  const bindings = { constraints: [], memory: [], children: [] };
  /** @type {Record<SectionKey, {present: boolean, insert: number}>} */
  const sections = {
    constraints: { present: false, insert: source.length },
    memory: { present: false, insert: source.length },
    children: { present: false, insert: source.length },
  };
  /** @type {Binding[]} */
  const references = [];
  /** @type {Map<string, string>} */
  const definitions = new Map();
  /** @type {AstNode[]} */
  const pending = [ast];
  while (pending.length) {
    const node = pending.pop();
    if (!node) continue;
    if (node.type === 'definition' && !definitions.has(node.identifier)) definitions.set(node.identifier, node.url);
    if ('children' in node) for (let i = node.children.length - 1; i >= 0; i--) pending.push(node.children[i]);
  }

  /** @param {AstNode} node @returns {string} */
  function text(node) {
    if ('value' in node) return node.value;
    if ('children' in node) return node.children.map(text).join('');
    return node.type === 'break' ? '\n' : '';
  }
  /** @param {AstNode} node @returns {NodeLink | undefined} */
  function link(node) {
    const target = node.type === 'link' ? node.url : node.type === 'linkReference' ? definitions.get(node.identifier) : undefined;
    return target === undefined ? undefined : { kind: 'link', label: text(node), target };
  }
  /** @param {AstNode} node @returns {NodeItem['content']} */
  function runs(node) {
    const value = link(node);
    if (value) return [value];
    if (node.type === 'text' || node.type === 'inlineCode') return [{ kind: 'text', value: node.value }];
    if (node.type === 'break') return [{ kind: 'text', value: '\n' }];
    if (!('children' in node)) return [];
    /** @type {NodeItem['content']} */
    const result = [];
    for (const child of node.children) for (const run of runs(child)) {
      const last = result.at(-1);
      if (last?.kind === 'text' && run.kind === 'text') last.value += run.value;
      else result.push(run);
    }
    return result;
  }
  /** @param {AstNode} node */
  function unsupported(node) {
    if (['image', 'imageReference', 'html', 'code'].includes(node.type)) return true;
    return 'children' in node && node.children.some(unsupported);
  }
  /** @param {AstNode} node */
  function ordinaryReferences(node) {
    const value = link(node);
    if (value) {
      model.references.push(value);
      references.push({ start: start(node), end: end(node), prefix: '', protected: unsupported(node) });
      return;
    }
    if ('children' in node) node.children.forEach(ordinaryReferences);
  }
  /** @param {AstNode} node @param {SectionKey} section */
  function item(node, section) {
    const content = runs(node);
    if (!content.length) return;
    const list = node.type === 'listItem';
    const paragraph = list && node.children.length === 1 && node.children[0].type === 'paragraph' ? node.children[0] : undefined;
    model[section].push({ content });
    bindings[section].push({
      start: start(node), end: end(node),
      prefix: paragraph ? source.slice(start(node), start(paragraph))
        : node.type === 'heading' && node.children.length ? source.slice(start(node), start(node.children[0])) : '',
      protected: unsupported(node) || (list && !paragraph) || node.type === 'blockquote',
    });
  }

  /** @type {SectionKey | undefined} */
  let active;
  /** @type {SectionKey | undefined} */
  let marked;
  let headingDepth = 0;
  let outsideInsert = 0;
  let unsafe = false;
  let appendAt = source.length;
  /** @param {number} offset */
  function close(offset) {
    if (active) sections[active].insert = offset;
    active = undefined;
    headingDepth = 0;
  }
  /** @param {SectionKey} section */
  function open(section) {
    if (sections[section].present) unsafe = true;
    sections[section].present = true;
    active = section;
  }

  for (const block of ast.children) {
    if (!active) outsideInsert = start(block);
    if (block.type === 'html') {
      const marker = block.value.trim().match(/^<!-- project-memory-(important|local|children):(start|end) -->$/);
      if (marker) {
        const section = markers[marker[1]];
        if (marker[2] === 'start') {
          if (marked) unsafe = true;
          close(start(block));
          open(section);
          marked = section;
        } else {
          if (marked !== section) unsafe = true;
          close(start(block));
          marked = undefined;
        }
        if (!active) outsideInsert = end(block);
        continue;
      }
      if (block.value.trim() === '<!-- project-memory:end -->') {
        appendAt = start(block);
        if (!marked) close(start(block));
      }
      if (!active) outsideInsert = end(block);
      continue;
    }
    if (block.type === 'heading') {
      let isSectionHeading = false;
      if (!marked) {
        if (active && block.depth <= headingDepth) close(start(block));
        const section = titles[text(block)];
        if (section) {
          if (active) close(start(block));
          open(section);
          headingDepth = block.depth;
          isSectionHeading = true;
        }
      }
      if (!active) ordinaryReferences(block);
      else if (!isSectionHeading && runs(block).some(run => run.kind === 'link')) item(block, active);
      if (!active) outsideInsert = end(block);
      continue;
    }
    if (!active) ordinaryReferences(block);
    else if (block.type === 'list') { for (const child of block.children) item(child, active); }
    else if (block.type === 'paragraph' || block.type === 'blockquote') item(block, active);
    if (!active) outsideInsert = end(block);
  }
  if (marked) unsafe = true;
  const referencesInsert = active ? outsideInsert : source.length;
  close(source.length);
  return { model, bindings, references, sections, unsafe, appendAt, referencesInsert };
}

/** @param {string} source @returns {NodeModel} */
export function parseNode(source) {
  return decodeDocument(source).model;
}
