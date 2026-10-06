'use strict';

const FORMATS = Object.freeze({
  binary: { label: 'Binary', radix: 2, prefix: '0b' },
  octal: { label: 'Octal', radix: 8, prefix: '0o' },
  decimal: { label: 'Decimal', radix: 10, prefix: '' },
  hex: { label: 'Hexadecimal', radix: 16, prefix: '0x' }
});

// Scan complete word-like tokens so malformed literals never produce a hover
// for a valid-looking prefix (for example, 0b102 or 0xFG).
const WORD = /[\p{L}\p{N}_$]+/gu;

function parseInteger(text) {
  let base;
  let digits;

  if (/^0[bB][01]+(?:_[01]+)*n?$/.test(text)) {
    base = 'binary';
    digits = text.slice(2);
  } else if (/^0[xX][0-9a-fA-F]+(?:_[0-9a-fA-F]+)*n?$/.test(text)) {
    base = 'hex';
    digits = text.slice(2);
  } else if (/^[0-9]+(?:_[0-9]+)*n?$/.test(text)) {
    base = 'decimal';
    digits = text;
  } else {
    return undefined;
  }

  digits = digits.replace(/n$/, '').replace(/_/g, '');
  const prefix = base === 'decimal' ? '' : FORMATS[base].prefix;
  return { base, value: BigInt(prefix + digits) };
}

function findIntegerAt(line, character) {
  WORD.lastIndex = 0;
  for (const match of line.matchAll(WORD)) {
    const tokenStart = match.index;
    const end = tokenStart + match[0].length;
    const beforeMinus = line.slice(0, tokenStart - 1).trimEnd();
    const hasUnaryMinus = line[tokenStart - 1] === '-' &&
      (!beforeMinus || /[=([{,:?~!+\-*/%&|^<>]$/.test(beforeMinus) ||
        /\b(?:return|yield|throw|case)$/.test(beforeMinus));
    const start = hasUnaryMinus ? tokenStart - 1 : tokenStart;
    if (character < start) break;
    if (character >= end) continue;

    // A segment of a float or scientific-notation number is not an integer.
    if (line[tokenStart - 1] === '.' || line[end] === '.' ||
        /[0-9][eE][+-]$/.test(line.slice(0, tokenStart))) {
      return undefined;
    }

    const parsed = parseInteger(match[0]);
    return parsed ? {
      ...parsed,
      value: hasUnaryMinus ? -parsed.value : parsed.value,
      text: line.slice(start, end),
      start,
      end
    } : undefined;
  }
  return undefined;
}

function conversionsFor(literal, formats, uppercaseHex) {
  if (!Array.isArray(formats)) return [];
  const seen = new Set();
  const results = [];
  for (const format of formats) {
    if (!Object.hasOwn(FORMATS, format) || format === literal.base || seen.has(format)) continue;
    seen.add(format);
    const { label, radix, prefix } = FORMATS[format];
    let digits = literal.value.toString(radix);
    if (format === 'hex' && uppercaseHex) digits = digits.toUpperCase();
    const negative = digits.startsWith('-');
    if (negative) digits = digits.slice(1);
    results.push({ label, value: (negative ? '-' : '') + prefix + digits });
  }
  return results;
}

module.exports = { findIntegerAt, conversionsFor };
