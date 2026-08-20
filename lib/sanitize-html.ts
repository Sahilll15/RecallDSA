/**
 * Conservative allowlist sanitiser for problem statements pulled from a judge.
 * The source is trusted, but its HTML is still third-party markup rendered with
 * dangerouslySetInnerHTML, so anything executable is removed rather than relied
 * on to be absent.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'strong', 'i', 'em', 'u', 'code', 'pre', 'ul', 'ol', 'li',
  'sup', 'sub', 'span', 'div', 'blockquote', 'table', 'thead', 'tbody', 'tr',
  'th', 'td', 'img', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'font',
]);

const ALLOWED_ATTRS = new Set(['href', 'src', 'alt', 'title', 'colspan', 'rowspan']);

const VOID_TAGS = new Set(['br', 'img', 'hr']);

function safeUrl(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (trimmed.startsWith('javascript:') || trimmed.startsWith('data:')) return false;
  if (trimmed.startsWith('vbscript:')) return false;
  return true;
}

export function sanitizeStatementHtml(html: string): string {
  if (!html) return '';

  // Executable and layout-breaking elements go with their contents.
  let out = html.replace(
    /<(script|style|iframe|object|embed|link|meta|form|input|button|svg)\b[\s\S]*?<\/\1\s*>/gi,
    '',
  );
  out = out.replace(/<(script|style|iframe|object|embed|link|meta|input|svg)\b[^>]*\/?>/gi, '');
  out = out.replace(/<!--[\s\S]*?-->/g, '');

  return out.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s=/>]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*\/?>/g,
    (match, rawName: string, rawAttrs: string) => {
      const name = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(name)) return '';

      const closing = match.startsWith('</');
      if (closing) return `</${name}>`;

      const attrs: string[] = [];
      const attrPattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attr: RegExpExecArray | null;

      while ((attr = attrPattern.exec(rawAttrs)) !== null) {
        const key = attr[1].toLowerCase();
        const value = attr[2] ?? attr[3] ?? attr[4] ?? '';
        if (!ALLOWED_ATTRS.has(key)) continue;
        if ((key === 'href' || key === 'src') && !safeUrl(value)) continue;
        attrs.push(`${key}="${value.replace(/"/g, '&quot;')}"`);
      }

      // Statement links leave the app, so they must not hand it the opener.
      if (name === 'a') attrs.push('target="_blank"', 'rel="noopener noreferrer"');

      const rendered = attrs.length > 0 ? `<${name} ${attrs.join(' ')}` : `<${name}`;
      return VOID_TAGS.has(name) ? `${rendered} />` : `${rendered}>`;
    },
  );
}
