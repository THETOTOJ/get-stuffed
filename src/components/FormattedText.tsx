import React from "react";

/**
 * Lightweight Discord-style inline markdown parser.
 * Supports: **bold**, *italic*, ~~strikethrough~~, `code`, [links](url)
 */

type TextNode = string | React.ReactElement;

function parseInline(text: string): TextNode[] {
  const result: TextNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Patterns ordered by specificity (longer delimiters first)
  const patterns: {
    regex: RegExp;
    render: (match: RegExpMatchArray, key: number) => React.ReactElement;
  }[] = [
    // Links: [text](url)
    {
      regex: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/,
      render: (m, k) => (
        <a
          key={k}
          href={m[2]}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: "2px" }}
        >
          {m[1]}
        </a>
      ),
    },
    // Bold: **text**
    {
      regex: /\*\*(.+?)\*\*/,
      render: (m, k) => <strong key={k}>{m[1]}</strong>,
    },
    // Italic: *text*
    {
      regex: /\*(.+?)\*/,
      render: (m, k) => <em key={k}>{m[1]}</em>,
    },
    // Strikethrough: ~~text~~
    {
      regex: /~~(.+?)~~/,
      render: (m, k) => <s key={k} style={{ opacity: 0.6 }}>{m[1]}</s>,
    },
    // Inline code: `text`
    {
      regex: /`([^`]+)`/,
      render: (m, k) => (
        <code
          key={k}
          style={{
            background: "var(--accent-light)",
            padding: "0.1rem 0.35rem",
            borderRadius: "4px",
            fontFamily: "monospace",
            fontSize: "0.9em",
          }}
        >
          {m[1]}
        </code>
      ),
    },
  ];

  while (remaining.length > 0) {
    let earliestIndex = remaining.length;
    let earliestPattern: (typeof patterns)[number] | null = null;
    let earliestMatch: RegExpMatchArray | null = null;

    for (const p of patterns) {
      const m = remaining.match(p.regex);
      if (m && m.index !== undefined && m.index < earliestIndex) {
        earliestIndex = m.index;
        earliestPattern = p;
        earliestMatch = m;
      }
    }

    if (!earliestPattern || !earliestMatch || earliestMatch.index === undefined) {
      result.push(remaining);
      break;
    }

    // Text before the match
    if (earliestMatch.index > 0) {
      result.push(remaining.slice(0, earliestMatch.index));
    }

    result.push(earliestPattern.render(earliestMatch, keyIdx++));
    remaining = remaining.slice(earliestMatch.index + earliestMatch[0].length);
  }

  return result;
}

export default function FormattedText({ text, className, style }: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  if (!text) return null;

  const lines = text.split("\n");

  return (
    <div className={className} style={style}>
      {lines.map((line, i) => (
        <React.Fragment key={i}>
          {parseInline(line)}
          {i < lines.length - 1 && <br />}
        </React.Fragment>
      ))}
    </div>
  );
}