import { describe, expect, it } from 'vitest';
import { sanitizeStatementHtml } from './sanitize-html';

describe('sanitizeStatementHtml', () => {
  it('keeps the markup a problem statement actually uses', () => {
    const html =
      '<p>Given <code>nums</code>, return <strong>k</strong>.</p><pre>Input: [1,2]</pre><ul><li>1 &lt;= n</li></ul>';
    expect(sanitizeStatementHtml(html)).toBe(html);
  });

  it('drops script elements and their contents', () => {
    expect(sanitizeStatementHtml('<p>hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
  });

  it('drops inline event handlers', () => {
    expect(sanitizeStatementHtml('<p onclick="steal()">hi</p>')).toBe('<p>hi</p>');
    expect(sanitizeStatementHtml('<img src="x" onerror="steal()" />')).toBe(
      '<img src="x" />',
    );
  });

  it('refuses a javascript: url', () => {
    expect(sanitizeStatementHtml('<a href="javascript:alert(1)">x</a>')).toBe(
      '<a target="_blank" rel="noopener noreferrer">x</a>',
    );
  });

  it('sends real links out without handing over the opener', () => {
    expect(sanitizeStatementHtml('<a href="https://leetcode.com">x</a>')).toBe(
      '<a href="https://leetcode.com" target="_blank" rel="noopener noreferrer">x</a>',
    );
  });

  it('unwraps a tag that is not on the allowlist but keeps its text', () => {
    expect(sanitizeStatementHtml('<marquee>scrolling</marquee>')).toBe('scrolling');
  });

  it('strips style and iframe blocks', () => {
    expect(sanitizeStatementHtml('<style>body{display:none}</style><p>a</p>')).toBe('<p>a</p>');
    expect(sanitizeStatementHtml('<iframe src="evil"></iframe><p>a</p>')).toBe('<p>a</p>');
  });

  it('drops class and id attributes that could hijack app styles', () => {
    expect(sanitizeStatementHtml('<div class="fixed inset-0">x</div>')).toBe('<div>x</div>');
  });

  it('handles empty input', () => {
    expect(sanitizeStatementHtml('')).toBe('');
  });
});
