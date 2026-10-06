'use strict';

const { findIntegerAt, conversionsFor } = require('./conversion');

function createHoverProvider(vscode) {
  return {
    provideHover(document, position) {
      const line = document.lineAt(position.line).text;
      const literal = findIntegerAt(line, position.character);
      if (!literal) return undefined;

      const config = vscode.workspace.getConfiguration('radixHover', document.uri);
      const formats = config.get('formats', ['hex', 'decimal', 'binary']);
      const uppercaseHex = config.get('uppercaseHex', true);
      const conversions = conversionsFor(literal, formats, uppercaseHex);
      if (conversions.length === 0) return undefined;

      const rows = conversions.map(({ label, value }) => `**${label}:** \`${value}\``);
      const content = new vscode.MarkdownString(rows.join('  \n'));
      const range = new vscode.Range(position.line, literal.start, position.line, literal.end);
      return new vscode.Hover(content, range);
    }
  };
}

function activate(context) {
  const vscode = require('vscode');
  const provider = vscode.languages.registerHoverProvider('*', createHoverProvider(vscode));
  context.subscriptions.push(provider);
}

module.exports = { activate, createHoverProvider };
