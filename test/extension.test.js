'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHoverProvider } = require('../src/extension');

test('hover uses current settings and spans the entire literal', () => {
  const settings = { formats: ['binary', 'decimal', 'hex'], uppercaseHex: false };
  const vscode = {
    workspace: { getConfiguration: () => ({ get: (key) => settings[key] }) },
    MarkdownString: class { constructor(value) { this.value = value; } },
    Range: class { constructor(line1, start, line2, end) { Object.assign(this, { line1, start, line2, end }); } },
    Hover: class { constructor(content, range) { Object.assign(this, { content, range }); } }
  };
  const provider = createHoverProvider(vscode);
  const document = { uri: {}, lineAt: () => ({ text: 'value = 0x2a;' }) };
  const hover = provider.provideHover(document, { line: 0, character: 10 });
  assert.equal(hover.content.value, '**Binary:** `0b101010`  \n**Decimal:** `42`');
  assert.equal(hover.range.start, 8);
  assert.equal(hover.range.end, 12);

  settings.formats = ['hex'];
  assert.equal(provider.provideHover(document, { line: 0, character: 10 }), undefined);
});

test('default hover shows the other ordinary bases', () => {
  const vscode = {
    workspace: { getConfiguration: () => ({ get: (_key, fallback) => fallback }) },
    MarkdownString: class { constructor(value) { this.value = value; } },
    Range: class { constructor(line1, start, line2, end) { Object.assign(this, { line1, start, line2, end }); } },
    Hover: class { constructor(content, range) { Object.assign(this, { content, range }); } }
  };
  const provider = createHoverProvider(vscode);
  const document = { uri: {}, lineAt: () => ({ text: '42' }) };
  const hover = provider.provideHover(document, { line: 0, character: 0 });
  assert.equal(hover.content.value, '**Hexadecimal:** `0x2A`  \n**Binary:** `0b101010`');
});
