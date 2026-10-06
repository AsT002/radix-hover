# Radix Hover

Hover over a binary (`0b101010`), hexadecimal (`0x2A`), or decimal (`42`) integer to see its value in other bases. The extension works in text editors for any language. It also accepts uppercase prefixes, `_` digit separators, an optional `n` BigInt suffix, and negative literals. Conversions use `BigInt`, so large integers remain exact.

## Try it

1. Open this folder in VS Code.
2. Press **F5** to launch an Extension Development Host.
3. Open a file in the new window containing `0b101010`, `0x2A`, or `42`, then hover over a digit.

## Settings

Set the formats and their order in your VS Code settings:

```json
{
  "radixHover.formats": ["hex", "decimal", "binary", "octal"],
  "radixHover.uppercaseHex": true
}
```

The default order is `hex`, `decimal`, `binary`. The source literal's own base is omitted from its hover. Choose from `hex`, `decimal`, `binary`, and `octal`. An empty array disables these hovers. Fractions and exponent notation are not converted.

Run `npm test` to check the conversion logic. To make an installable `.vsix`, install `@vscode/vsce` and run `vsce package`. Replace the `publisher` value in `package.json` with your Marketplace publisher ID before publishing.
