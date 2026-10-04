import { decodeDocument, parseNode } from './parse.js';

/** @typedef {import('../model.js').NodeModel} NodeModel */
/** @typedef {import('../model.js').SectionKey} SectionKey */
/** @typedef {import('../model.js').NodeLink} NodeLink */
/** @typedef {import('../model.js').NodeItem} NodeItem */
/** @type {SectionKey[]} */
const keys = ['constraints', 'memory', 'children'];
const names = { constraints: ['important', '本层硬约束'], memory: ['local', '本层记忆'], children: ['children', '下层记忆索引'] };
/** @param {unknown} a @param {unknown} b */
const same = (a, b) => JSON.stringify(a, orderedKeys) === JSON.stringify(b, orderedKeys);
/** @param {string} _key @param {unknown} value */
function orderedKeys(_key, value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b))) : value;
}
/** @param {string} value */
const escape = value => value.replace(/[\\`*_[\]{}()#+!<>|&-]/g, '\\$&').replace(/^(\d+)\./gm, '$1\\.');

/** @param {NodeLink} value */
function renderLink(value) {
  if (/[\r\n]/.test(value.target)) throw new Error('Link targets cannot contain line breaks.');
  return `[${escape(value.label)}](<${value.target.replace(/[\\<>]/g, '\\$&')}>)`;
}
/** @param {NodeItem} item @param {string} prefix @param {string} newline */
function renderItem(item, prefix, newline) {
  const content = item.content.map(run => run.kind === 'link' ? renderLink(run) : escape(run.value)).join('');
  return prefix + content.replace(/\r?\n/g, newline + ' '.repeat(prefix.length));
}
/** @param {SectionKey} key @param {NodeItem[]} items @param {string} newline */
function renderSection(key, items, newline) {
  const [marker, title] = names[key];
  return [`<!-- project-memory-${marker}:start -->`, `## ${title}`, '', ...items.map(item => renderItem(item, '- ', newline)), `<!-- project-memory-${marker}:end -->`, ''].join(newline);
}

/**
 * Pure serialization. Original source enables loss-preserving edits; no IO occurs here.
 * @param {NodeModel} model
 * @param {string} [originalSource]
 * @returns {string}
 */
export function serializeNode(model, originalSource) {
  const newline = originalSource?.includes('\r\n') ? '\r\n' : '\n';
  if (originalSource === undefined) {
    const source = ['<!-- project-memory:start -->', ...keys.map(key => renderSection(key, model[key], newline)), '<!-- project-memory:end -->', '', ...model.references.map(ref => `- ${renderLink(ref)}`), ''].join(newline);
    if (!same(parseNode(source), model)) throw new Error('Model cannot be represented losslessly as a node document.');
    return source;
  }
  const original = decodeDocument(originalSource);
  const originalText = originalSource;
  if (same(original.model, model)) return originalSource;
  if (original.unsafe) throw new Error('Cannot edit ambiguous or unclosed node sections.');
  /** @type {{start: number, end: number, value: string, order: number}[]} */
  const edits = [];
  /** @param {number} start @param {number} end @param {string} value */
  const edit = (start, end, value) => edits.push({ start, end, value, order: edits.length });
  for (const key of keys) {
    const previous = original.model[key];
    const next = model[key];
    const bindings = original.bindings[key];
    const used = new Set();
    const matches = next.map(item => {
      const found = previous.findIndex((old, index) => !used.has(index) && same(old, item));
      if (found >= 0) used.add(found);
      return found;
    });
    if (bindings.some((binding, index) => binding.protected && !used.has(index))) {
      throw new Error('Cannot replace unsupported content; preserve the original item.');
    }
    /** @param {number} index @param {string} prefix */
    function renderNext(index, prefix) {
      const match = matches[index];
      return match >= 0 ? originalText.slice(bindings[match].start, bindings[match].end)
        : next[index] ? renderItem(next[index], prefix, newline) : '';
    }
    for (let index = 0; index < previous.length; index++) {
      if (matches[index] === index) continue;
      const binding = bindings[index];
      edit(binding.start, binding.end, renderNext(index, binding.prefix));
    }
    if (next.length > previous.length) {
      const extra = next.slice(previous.length);
      if (original.sections[key].present) {
        const offset = original.sections[key].insert;
        edit(offset, offset, newline + extra.map((_, index) => renderNext(previous.length + index, '- ')).join(newline) + newline);
      } else {
        edit(original.appendAt, original.appendAt, newline + renderSection(key, extra, newline));
      }
    }
  }
  for (let index = 0; index < original.model.references.length; index++) {
    if (same(original.model.references[index], model.references[index])) continue;
    const binding = original.references[index];
    if (binding.protected) throw new Error('Cannot replace a reference containing unsupported content.');
    edit(binding.start, binding.end, model.references[index] ? renderLink(model.references[index]) : '');
  }
  if (model.references.length > original.model.references.length) {
    edit(original.referencesInsert, original.referencesInsert, newline + model.references.slice(original.model.references.length).map(ref => `- ${renderLink(ref)}`).join(newline) + newline + newline);
  }
  let source = originalSource;
  let boundary = source.length;
  for (const change of edits.sort((a, b) => b.start - a.start || b.order - a.order)) {
    if (change.end > boundary) throw new Error('Overlapping node edits cannot be serialized safely.');
    source = source.slice(0, change.start) + change.value + source.slice(change.end);
    boundary = change.start;
  }
  if (!same(parseNode(source), model)) throw new Error('Model cannot be represented losslessly without changing surrounding content.');
  return source;
}
