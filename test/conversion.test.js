'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { findIntegerAt, conversionsFor } = require('../src/conversion');

test('binary, hex, and decimal literals convert exactly', () => {
  for (const [text, base] of [['0b101010', 'binary'], ['0X2a', 'hex'], ['42', 'decimal']]) {
    const literal = findIntegerAt(`x = ${text};`, 4);
    assert.equal(literal.base, base);
    assert.equal(literal.value, 42n);
    assert.deepEqual(conversionsFor(literal, ['hex', 'decimal', 'binary'], true),
      [
        { label: 'Hexadecimal', value: '0x2A' },
        { label: 'Decimal', value: '42' },
        { label: 'Binary', value: '0b101010' }
      ].filter(({ label }) => label.toLowerCase() !== (base === 'hex' ? 'hexadecimal' : base)));
  }
});

test('underscores and BigInt suffixes retain exact values', () => {
  const literal = findIntegerAt('0b1_0000_0000_0000_0000_0000_0000_0000_0000n', 8);
  assert.equal(literal.value, 4294967296n);
  assert.deepEqual(conversionsFor(literal, ['decimal', 'hex'], false), [
    { label: 'Decimal', value: '4294967296' },
    { label: 'Hexadecimal', value: '0x100000000' }
  ]);
});

test('configured formats control output and order', () => {
  const literal = findIntegerAt('255', 1);
  assert.deepEqual(conversionsFor(literal, ['octal', 'binary', 'hex', 'binary', 'twosComplement'], true), [
    { label: 'Octal', value: '0o377' },
    { label: 'Binary', value: '0b11111111' },
    { label: 'Hexadecimal', value: '0xFF' }
  ]);
  assert.deepEqual(conversionsFor(literal, [], true), []);
});

test('negative literals convert across bases and include the minus in the hover range', () => {
  const literal = findIntegerAt('value = -0X2an;', 8);
  assert.deepEqual(literal, {
    base: 'hex', value: -42n, text: '-0X2an', start: 8, end: 14
  });
  assert.deepEqual(conversionsFor(literal, ['binary', 'decimal', 'octal'], true), [
    { label: 'Binary', value: '-0b101010' },
    { label: 'Decimal', value: '-42' },
    { label: 'Octal', value: '-0o52' }
  ]);
  assert.deepEqual(conversionsFor(findIntegerAt('-42', 0), ['hex'], true), [
    { label: 'Hexadecimal', value: '-0x2A' }
  ]);
  assert.equal(findIntegerAt('x-42', 2).value, 42n);
  assert.equal(findIntegerAt('x - 42', 4).value, 42n);
});

test('malformed literals and numeric fragments do not get hovers', () => {
  for (const text of ['0b102', '0xFG', '0b1__0', '123abc', '1.5', '1e+3']) {
    for (let i = 0; i < text.length; i++) {
      assert.equal(findIntegerAt(text, i), undefined, `${text} at ${i}`);
    }
  }
});

test('only the literal under the cursor is selected', () => {
  const line = 'x = 0xF + 10';
  assert.equal(findIntegerAt(line, 5).value, 15n);
  assert.equal(findIntegerAt(line, 11).value, 10n);
  assert.equal(findIntegerAt(line, 9), undefined);
});
