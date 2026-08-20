import { canonicalProblemKey, slugifySegment } from './problem-identity';

/**
 * Pattern classification, best source first.
 *
 * The old detector matched pattern keywords as substrings of the file path.
 * For a repo laid out by problem ("0410-split-array-largest-sum/..."), the path
 * carries the problem name and no pattern name, so almost everything came back
 * unclassified, while broad keywords like "array" matched incidental words and
 * filed a binary-search problem under Arrays.
 *
 * Topic tags from the judge are authoritative, so they win. A path is only
 * consulted for what it genuinely knows: a directory the user named after a
 * pattern, or a slug containing an unmistakable phrase.
 */

/** Most instructive first: the pattern worth practising, not merely a true label. */
const PATTERN_PRIORITY = [
  'binary-search-on-answer',
  'monotonic-stack',
  'union-find',
  'topological-sort',
  'trie',
  'sliding-window',
  'two-pointers',
  'prefix-sum',
  'binary-search',
  'backtracking',
  'bit-manipulation',
  'dynamic-programming',
  'intervals',
  'heap',
  'linked-list',
  'bst',
  'trees',
  'graphs',
  'bfs',
  'dfs',
  'matrix',
  'greedy',
  'hashing',
  'stack',
  'queue',
  'recursion',
  'sorting',
  'strings',
  'math',
  'arrays',
] as const;

/** LeetCode topic tag slug to our pattern vocabulary. */
const TAG_TO_PATTERN: Record<string, string> = {
  array: 'arrays',
  string: 'strings',
  'hash-table': 'hashing',
  counting: 'hashing',
  'dynamic-programming': 'dynamic-programming',
  memoization: 'dynamic-programming',
  math: 'math',
  'number-theory': 'math',
  combinatorics: 'math',
  geometry: 'math',
  sorting: 'sorting',
  greedy: 'greedy',
  'depth-first-search': 'dfs',
  'breadth-first-search': 'bfs',
  'binary-search': 'binary-search',
  tree: 'trees',
  'binary-tree': 'trees',
  'binary-search-tree': 'bst',
  matrix: 'matrix',
  'bit-manipulation': 'bit-manipulation',
  bitmask: 'bit-manipulation',
  'two-pointers': 'two-pointers',
  'heap-priority-queue': 'heap',
  'prefix-sum': 'prefix-sum',
  stack: 'stack',
  'monotonic-stack': 'monotonic-stack',
  'monotonic-queue': 'queue',
  queue: 'queue',
  graph: 'graphs',
  'shortest-path': 'graphs',
  'strongly-connected-component': 'graphs',
  'eulerian-circuit': 'graphs',
  'minimum-spanning-tree': 'graphs',
  'sliding-window': 'sliding-window',
  backtracking: 'backtracking',
  'union-find': 'union-find',
  'linked-list': 'linked-list',
  'doubly-linked-list': 'linked-list',
  trie: 'trie',
  recursion: 'recursion',
  'divide-and-conquer': 'recursion',
  'topological-sort': 'topological-sort',
  'ordered-set': 'sorting',
  'segment-tree': 'trees',
  'binary-indexed-tree': 'trees',
};

/** Directory names people use for each pattern, matched as a whole segment. */
const FOLDER_ALIASES: Record<string, string> = {
  array: 'arrays',
  arrays: 'arrays',
  string: 'strings',
  strings: 'strings',
  hashing: 'hashing',
  hashmap: 'hashing',
  'hash-map': 'hashing',
  hashtable: 'hashing',
  'hash-table': 'hashing',
  'two-pointer': 'two-pointers',
  'two-pointers': 'two-pointers',
  twopointers: 'two-pointers',
  'sliding-window': 'sliding-window',
  slidingwindow: 'sliding-window',
  'binary-search': 'binary-search',
  binarysearch: 'binary-search',
  bs: 'binary-search',
  'binary-search-on-answer': 'binary-search-on-answer',
  'bs-on-answer': 'binary-search-on-answer',
  'prefix-sum': 'prefix-sum',
  prefixsum: 'prefix-sum',
  stack: 'stack',
  stacks: 'stack',
  'monotonic-stack': 'monotonic-stack',
  queue: 'queue',
  queues: 'queue',
  deque: 'queue',
  'linked-list': 'linked-list',
  linkedlist: 'linked-list',
  ll: 'linked-list',
  recursion: 'recursion',
  backtracking: 'backtracking',
  backtrack: 'backtracking',
  dp: 'dynamic-programming',
  'dynamic-programming': 'dynamic-programming',
  dynamicprogramming: 'dynamic-programming',
  greedy: 'greedy',
  sorting: 'sorting',
  sort: 'sorting',
  interval: 'intervals',
  intervals: 'intervals',
  tree: 'trees',
  trees: 'trees',
  'binary-tree': 'trees',
  bst: 'bst',
  'binary-search-tree': 'bst',
  heap: 'heap',
  heaps: 'heap',
  'priority-queue': 'heap',
  priorityqueue: 'heap',
  trie: 'trie',
  tries: 'trie',
  graph: 'graphs',
  graphs: 'graphs',
  bfs: 'bfs',
  dfs: 'dfs',
  'topological-sort': 'topological-sort',
  toposort: 'topological-sort',
  'union-find': 'union-find',
  unionfind: 'union-find',
  dsu: 'union-find',
  'disjoint-set': 'union-find',
  'bit-manipulation': 'bit-manipulation',
  bitmanipulation: 'bit-manipulation',
  bits: 'bit-manipulation',
  bitwise: 'bit-manipulation',
  math: 'math',
  maths: 'math',
  matrix: 'matrix',
  grid: 'matrix',
};

/** Segments that describe the filing, not the problem. */
const STRUCTURAL_SEGMENTS = new Set([
  'easy', 'medium', 'hard', 'leetcode', 'gfg', 'geeksforgeeks', 'codeforces',
  'codechef', 'atcoder', 'hackerrank', 'src', 'solutions', 'problems', 'dsa',
]);

/** Phrases in a problem slug that name the technique beyond doubt. */
const SLUG_RULES: Array<[RegExp, string]> = [
  [/\b(permutation|permutations|subsets|subset-sum|n-queens|sudoku|generate-parentheses|combination-sum|letter-combinations|palindrome-partitioning|word-search|rat-in-a-maze)\b/, 'backtracking'],
  [/\b(linked-list|reverse-list|nodes-in-pairs|merge-two-sorted-lists)\b/, 'linked-list'],
  [/\b(binary-search-tree|bst)\b/, 'bst'],
  [/\b(binary-tree|tree|subtree)\b/, 'trees'],
  [/\b(topological|course-schedule|alien-dictionary)\b/, 'topological-sort'],
  [/\b(union-find|disjoint-set|number-of-provinces|redundant-connection)\b/, 'union-find'],
  [/\b(trie|prefix-tree)\b/, 'trie'],
  [/\b(monotonic|next-greater|daily-temperatures|largest-rectangle)\b/, 'monotonic-stack'],
  [/\b(sliding-window|longest-substring-without-repeating|minimum-window)\b/, 'sliding-window'],
  [/\b(prefix-sum|subarray-sum|range-sum)\b/, 'prefix-sum'],
  [/\b(knapsack|edit-distance|longest-common-subsequence|longest-increasing-subsequence|coin-change|climbing-stairs|house-robber)\b/, 'dynamic-programming'],
  [/\b(graph|islands|clone-graph|dijkstra|bellman-ford|floyd-warshall|shortest-path)\b/, 'graphs'],
  [/\b(interval|intervals|merge-intervals|meeting-rooms)\b/, 'intervals'],
  [/\b(heap|priority-queue|kth-largest|median-from-data-stream)\b/, 'heap'],
  [/\b(xor|bitwise|single-number|counting-bits|number-of-1-bits)\b/, 'bit-manipulation'],
  [/\b(matrix|spiral|rotate-image|set-matrix-zeroes)\b/, 'matrix'],
  [/\b(binary-search|search-insert-position|first-bad-version)\b/, 'binary-search'],
  [/\b(two-pointers|3sum|three-sum|container-with-most-water|trapping-rain-water)\b/, 'two-pointers'],
  [/\b(valid-parentheses|min-stack|reverse-polish|decode-string)\b/, 'stack'],
  [/\b(anagram|two-sum|group-anagrams|contains-duplicate)\b/, 'hashing'],
  [/\b(palindrome|substring|subsequence)\b/, 'strings'],
];

/**
 * A binary search over a candidate answer rather than over a sorted array.
 * "sorted" or "rotated" in the slug means the search is over real data.
 */
const ANSWER_SEARCH_WORDS =
  /\b(minimum|maximum|smallest|largest|minimize|maximize|minimise|maximise|capacity|threshold|speed|split|allocate|divisor|bouquets|trips)\b/;
const SORTED_DATA_WORDS = /\b(sorted|rotated)\b/;

function byPriority(candidates: Set<string>): string | null {
  for (const pattern of PATTERN_PRIORITY) {
    if (candidates.has(pattern)) return pattern;
  }
  return null;
}

/**
 * The whole path as one dash-delimited token stream. Word boundaries do the
 * protecting: "cheapest" never matches heap, "entries" never matches trie.
 */
function tokenStream(path: string): string {
  return path
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Classifies from the judge's own topic tags. */
export function patternFromTags(tags: string[], slug = ''): string | null {
  const mapped = new Set<string>();
  for (const tag of tags) {
    const pattern = TAG_TO_PATTERN[tag];
    if (pattern) mapped.add(pattern);
  }

  if (mapped.size === 0) return null;

  if (
    mapped.has('binary-search') &&
    !mapped.has('bst') &&
    !SORTED_DATA_WORDS.test(slug) &&
    ANSWER_SEARCH_WORDS.test(slug)
  ) {
    return 'binary-search-on-answer';
  }

  return byPriority(mapped);
}

/** Fallback for problems the judge has no data for. */
export function detectPatternFromPath(path: string): string | null {
  const segments = path.split('/').filter(Boolean);
  segments.pop(); // the filename never names a pattern folder

  // Deepest matching folder wins: it is the most specific filing decision.
  for (let i = segments.length - 1; i >= 0; i--) {
    const key = slugifySegment(segments[i]);
    if (STRUCTURAL_SEGMENTS.has(key)) continue;
    const alias = FOLDER_ALIASES[key];
    if (alias) return alias;
  }

  const stream = tokenStream(path);
  for (const [rule, pattern] of SLUG_RULES) {
    if (rule.test(stream)) return pattern;
  }

  return null;
}

/** Kept for callers that only have a path at hand, such as repo sync. */
export function detectPattern(path: string): string | null {
  return detectPatternFromPath(path);
}

/** The slug to ask the judge about. */
export function leetCodeSlugFor(path: string): string {
  return canonicalProblemKey(path);
}
