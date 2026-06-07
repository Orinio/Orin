'use client';

import { useState, useCallback, useMemo, type ReactNode } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

// ============================================================
// Code Block with syntax highlighting (lightweight, no deps)
// ============================================================

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  // Lightweight syntax coloring via regex
  const highlighted = useMemo(() => highlightCode(code, language), [code, language]);

  return (
    <div className="group relative rounded-xl overflow-hidden my-3" style={{ border: '1px solid var(--color-border)' }}>
      {/* Language label + copy button */}
      <div className="flex items-center justify-between px-4 py-2" style={{ backgroundColor: 'var(--color-surface-dim)', borderBottom: '1px solid var(--color-border)' }}>
        <span className="text-[11px] font-mono font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium transition-all opacity-0 group-hover:opacity-100"
          style={{ color: 'var(--color-text-tertiary)', backgroundColor: 'transparent' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-border)'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {copied ? <Check className="w-3 h-3" style={{ color: 'var(--color-bloom)' }} /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      {/* Code content */}
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed" style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-ink)', margin: 0 }}>
        <code dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </div>
  );
}

// Lightweight syntax highlighter
function highlightCode(code: string, language: string): string {
  let html = escapeHtml(code);

  // Keywords
  const keywords = language === 'python'
    ? /\b(def|class|import|from|return|if|else|elif|for|while|try|except|finally|with|as|in|not|and|or|True|False|None|print|self|lambda|yield|async|await|raise|pass|break|continue)\b/g
    : language === 'javascript' || language === 'typescript' || language === 'jsx' || language === 'tsx'
    ? /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|delete|typeof|instanceof|in|of|class|extends|super|import|from|export|default|async|await|yield|this|null|undefined|true|false)\b/g
    : language === 'go'
    ? /\b(func|package|import|return|if|else|for|range|switch|case|default|break|continue|go|defer|select|chan|map|struct|interface|type|const|var|nil|true|false)\b/g
    : language === 'rust'
    ? /\b(fn|let|mut|const|struct|enum|impl|trait|pub|use|mod|return|if|else|for|while|loop|match|break|continue|move|ref|self|Self|true|false|where|async|await|dyn|type)\b/g
    : /\b(function|return|if|else|for|while|class|import|export|from|const|let|var|new|try|catch|finally|throw|switch|case|default|break|continue|this|null|undefined|true|false|async|await)\b/g;

  html = html.replace(keywords, '<span style="color:#c678dd">$1</span>');

  // Strings
  html = html.replace(/(&quot;.*?&quot;|&#39;.*?&#39;|`.*?`)/g, '<span style="color:#98c379">$1</span>');
  html = html.replace(/(&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;|&#39;&#39;&#39;[\s\S]*?&#39;&#39;&#39;)/g, '<span style="color:#98c379">$1</span>');

  // Numbers
  html = html.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#d19a66">$1</span>');

  // Comments
  html = html.replace(/(\/\/.*$|#.*$)/gm, '<span style="color:#5c6370;font-style:italic">$1</span>');

  // Functions
  html = html.replace(/\b([a-zA-Z_]\w*)\s*\(/g, '<span style="color:#61afef">$1</span>(');

  return html;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================================
// Inline code
// ============================================================

function InlineCode({ children }: { children: ReactNode }) {
  return (
    <code
      className="px-1.5 py-0.5 rounded-md text-[13px] font-mono"
      style={{
        backgroundColor: 'var(--color-surface-dim)',
        color: 'var(--color-bloom)',
        border: '1px solid var(--color-border)',
      }}
    >
      {children}
    </code>
  );
}

// ============================================================
// Table renderer
// ============================================================

function MarkdownTable({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto my-3 rounded-xl" style={{ border: '1px solid var(--color-border)' }}>
      <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ backgroundColor: 'var(--color-surface-dim)' }}>
            {header.map((cell, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-xs font-semibold"
                style={{ color: 'var(--color-ink)', borderBottom: '1px solid var(--color-border)', borderRight: i < header.length - 1 ? '1px solid var(--color-border)' : 'none' }}
              >
                {cell.trim()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ backgroundColor: ri % 2 === 0 ? 'var(--color-surface)' : 'var(--color-surface-dim)' }}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-3 py-2 text-xs"
                  style={{ color: 'var(--color-ink)', borderBottom: '1px solid var(--color-border)', borderRight: ci < row.length - 1 ? '1px solid var(--color-border)' : 'none' }}
                >
                  {cell.trim()}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// Main Markdown Parser
// ============================================================

interface ParsedBlock {
  type: 'paragraph' | 'heading' | 'code' | 'table' | 'list' | 'blockquote' | 'hr';
  content: string;
  level?: number;
  language?: string;
  items?: string[];
  ordered?: boolean;
  header?: string[];
  rows?: string[][];
}

function parseMarkdown(text: string): ParsedBlock[] {
  const lines = text.split('\n');
  const blocks: ParsedBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code block
    if (line.trim().startsWith('```')) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', content: codeLines.join('\n'), language: language || 'text' });
      i++; // skip closing ```
      continue;
    }

    // Heading
    const headingMatch = line.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      blocks.push({ type: 'heading', content: headingMatch[2], level: headingMatch[1].length });
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ type: 'hr', content: '' });
      i++;
      continue;
    }

    // Table
    if (line.includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1])) {
      const parseRow = (row: string) => row.replace(/^\||\|$/g, '').split('|').map(c => c.trim());
      const header = parseRow(line);
      i += 2; // skip header and separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim() !== '') {
        rows.push(parseRow(lines[i]));
        i++;
      }
      blocks.push({ type: 'table', content: '', header, rows });
      continue;
    }

    // Blockquote
    if (line.trim().startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
      continue;
    }

    // List
    const listMatch = line.match(/^(\s*)([-*+]|\d+\.)\s+(.*)/);
    if (listMatch) {
      const ordered = /^\d+\./.test(listMatch[2]);
      const items: string[] = [];
      while (i < lines.length) {
        const lm = lines[i].match(/^(\s*)([-*+]|\d+\.)\s+(.*)/);
        if (lm && (!ordered || /^\d+\./.test(lm[2]))) {
          items.push(lm[3]);
          i++;
        } else if (lines[i].trim() === '' && i + 1 < lines.length && lines[i + 1].match(/^(\s*)([-*+]|\d+\.)\s/)) {
          i++; // skip blank line between list items
        } else {
          break;
        }
      }
      blocks.push({ type: 'list', content: '', items, ordered });
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph - collect consecutive non-empty lines
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '' && !lines[i].trim().startsWith('```') && !lines[i].trim().startsWith('#') && !lines[i].trim().startsWith('>') && !lines[i].match(/^(\s*)([-*+]|\d+\.)\s/) && !/^(-{3,}|\*{3,}|_{3,})$/.test(lines[i].trim())) {
      // Check if this is a table header (line with | followed by ---)
      if (lines[i].includes('|') && i + 1 < lines.length && /^\|?\s*[-:]+/.test(lines[i + 1])) break;
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: 'paragraph', content: paraLines.join('\n') });
    }
  }

  return blocks;
}

// ============================================================
// Inline formatting parser
// ============================================================

function formatInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  // Split by bold, italic, inline code, links, and citation markers
  const regex = /(\*\*.*?\*\*|__.*?__|(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)|`[^`]+`|\[[^\]]+\]\([^)]+\)|\[([^\]]*)\](\([^\)]+\))?|\[\d+\])/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const matched = match[0];

    if (matched.startsWith('**') || matched.startsWith('__')) {
      // Bold
      parts.push(<strong key={key++} style={{ fontWeight: 600 }}>{matched.slice(2, -2)}</strong>);
    } else if (matched.startsWith('*') && matched.endsWith('*') && !matched.startsWith('**')) {
      // Italic
      parts.push(<em key={key++}>{matched.slice(1, -1)}</em>);
    } else if (matched.startsWith('`')) {
      // Inline code
      parts.push(<InlineCode key={key++}>{matched.slice(1, -1)}</InlineCode>);
    } else if (matched.startsWith('[') && matched.includes('](')) {
      // Link
      const linkMatch = matched.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={key++}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 underline decoration-1 underline-offset-2 transition-colors"
            style={{ color: 'var(--color-bloom)' }}
          >
            {linkMatch[1]}
            <ExternalLink className="w-3 h-3 opacity-50" />
          </a>
        );
      }
    } else if (matched.match(/^\[\d+\]$/)) {
      // Citation marker [1], [2], etc.
      parts.push(
        <sup
          key={key++}
          className="inline-flex items-center justify-center w-4 h-3.5 rounded text-[9px] font-bold cursor-pointer transition-colors"
          style={{
            backgroundColor: 'var(--color-bloom)',
            color: 'white',
            verticalAlign: 'super',
            lineHeight: 0,
          }}
        >
          {matched.slice(1, -1)}
        </sup>
      );
    } else {
      parts.push(matched);
    }

    lastIndex = match.index + matched.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// ============================================================
// Main Component
// ============================================================

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const blocks = useMemo(() => parseMarkdown(content), [content]);

  return (
    <div className={`markdown-body ${className}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading': {
            const sizes: Record<number, string> = {
              1: 'text-lg font-bold mt-4 mb-2',
              2: 'text-base font-bold mt-3 mb-1.5',
              3: 'text-sm font-semibold mt-2 mb-1',
              4: 'text-sm font-semibold mt-2 mb-1',
              5: 'text-xs font-semibold mt-1 mb-0.5',
              6: 'text-xs font-semibold mt-1 mb-0.5',
            };
            const cls = sizes[block.level || 1];
            const content = formatInline(block.content);
            const lvl = Math.min(block.level || 1, 6);
            if (lvl === 1) return <h1 key={index} className={cls} style={{ color: 'var(--color-ink)' }}>{content}</h1>;
            if (lvl === 2) return <h2 key={index} className={cls} style={{ color: 'var(--color-ink)' }}>{content}</h2>;
            if (lvl === 3) return <h3 key={index} className={cls} style={{ color: 'var(--color-ink)' }}>{content}</h3>;
            if (lvl === 4) return <h4 key={index} className={cls} style={{ color: 'var(--color-ink)' }}>{content}</h4>;
            if (lvl === 5) return <h5 key={index} className={cls} style={{ color: 'var(--color-ink)' }}>{content}</h5>;
            return <h6 key={index} className={cls} style={{ color: 'var(--color-ink)' }}>{content}</h6>;
          }

          case 'code':
            return <CodeBlock key={index} language={block.language || ''} code={block.content} />;

          case 'table':
            return block.header && block.rows ? (
              <MarkdownTable key={index} header={block.header} rows={block.rows} />
            ) : null;

          case 'list':
            return block.ordered ? (
              <ol key={index} className="my-2 ml-1 space-y-1">
                {block.items?.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
                    <span className="font-mono text-xs mt-0.5" style={{ color: 'var(--color-text-tertiary)', minWidth: '1.2em' }}>{i + 1}.</span>
                    <span className="flex-1">{formatInline(item)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={index} className="my-2 ml-1 space-y-1">
                {block.items?.map((item, i) => (
                  <li key={i} className="flex gap-2 text-sm" style={{ color: 'var(--color-ink)' }}>
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--color-bloom)' }} />
                    <span className="flex-1">{formatInline(item)}</span>
                  </li>
                ))}
              </ul>
            );

          case 'blockquote':
            return (
              <blockquote
                key={index}
                className="my-3 pl-4 py-2 rounded-r-xl text-sm italic"
                style={{
                  borderLeft: '3px solid var(--color-bloom)',
                  backgroundColor: 'var(--color-primary-soft)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {formatInline(block.content)}
              </blockquote>
            );

          case 'hr':
            return <hr key={index} className="my-4" style={{ borderColor: 'var(--color-border)' }} />;

          case 'paragraph':
          default:
            return (
              <p key={index} className="text-sm leading-relaxed my-2" style={{ color: 'var(--color-ink)' }}>
                {formatInline(block.content)}
              </p>
            );
        }
      })}
    </div>
  );
}
