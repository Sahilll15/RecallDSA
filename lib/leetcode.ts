/**
 * Read-only client for LeetCode's public GraphQL endpoint. Problem statements
 * and topic tags are not in the user's repo, so they come from here rather than
 * being guessed from a file path.
 */

const ENDPOINT = 'https://leetcode.com/graphql';

const QUERY = `query problem($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionFrontendId
    title
    titleSlug
    difficulty
    content
    topicTags { slug }
    hints
  }
}`;

export interface LeetCodeProblem {
  number: string | null;
  title: string;
  titleSlug: string;
  difficulty: string | null;
  contentHtml: string | null;
  tags: string[];
  hints: string[];
}

const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: LeetCodeProblem | null }>();

/**
 * Returns null for a slug LeetCode does not know, which includes every problem
 * from another judge. Callers must treat null as "no data", not as an error.
 */
export async function fetchLeetCodeProblem(
  titleSlug: string,
): Promise<LeetCodeProblem | null> {
  const cached = cache.get(titleSlug);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.value;

  let value: LeetCodeProblem | null = null;

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // LeetCode returns 403 to a request with no browser-shaped agent.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Referer: `https://leetcode.com/problems/${titleSlug}/`,
      },
      body: JSON.stringify({ query: QUERY, variables: { titleSlug } }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      // A rate limit or a transient 5xx is not "this problem does not exist" —
      // caching it here would hide the problem's statement for CACHE_TTL_MS.
      return null;
    }

    const json = await res.json();
    const q = json?.data?.question;
    if (q) {
      value = {
        number: q.questionFrontendId ?? null,
        title: q.title ?? titleSlug,
        titleSlug: q.titleSlug ?? titleSlug,
        difficulty: typeof q.difficulty === 'string' ? q.difficulty.toLowerCase() : null,
        contentHtml: q.content ?? null,
        tags: Array.isArray(q.topicTags) ? q.topicTags.map((t: any) => t.slug) : [],
        hints: Array.isArray(q.hints) ? q.hints : [],
      };
    }
  } catch {
    // A network failure must not be cached as "this problem does not exist".
    return null;
  }

  cache.set(titleSlug, { at: Date.now(), value });
  return value;
}

