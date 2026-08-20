/**
 * One problem can land in a repo under several paths: two extensions commit
 * different folder namings, the same solution gets rewritten in a second
 * language, or a problem number changes. Revision scheduling keys off this
 * identity rather than the path so a problem is queued once, not once per file.
 */

/** Filename stems that name the file, not the problem: the directory names it instead. */
const GENERIC_STEMS = new Set([
  'solution',
  'solutions',
  'sol',
  'main',
  'index',
  'answer',
  'code',
  'program',
  'app',
  'test',
  'untitled',
  'attempt',
  'try',
  'a',
  'b',
  'c',
  // Bare language names (cpp.cpp, python.py) carry no problem information.
  'cpp',
  'cc',
  'cxx',
  'python',
  'py',
  'java',
  'javascript',
  'js',
  'typescript',
  'ts',
  'go',
  'rust',
  'rs',
  'ruby',
  'rb',
  'php',
  'csharp',
  'cs',
  'kotlin',
  'kt',
  'swift',
]);

/**
 * Directory names that describe the filing, not the problem: a difficulty
 * tier or a judge name is shared by every problem stored under it, so if the
 * filename is also generic, the directory must not be trusted as identity
 * either.
 */
const STRUCTURAL_DIRECTORIES = new Set([
  'easy',
  'medium',
  'hard',
  'src',
  'lib',
  'solution',
  'solutions',
  'problem',
  'problems',
  'dsa',
  'leetcode',
  'gfg',
  'geeksforgeeks',
  'codeforces',
  'codechef',
  'atcoder',
  'hackerrank',
]);

export function slugifySegment(segment: string): string {
  return segment
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/^\d+[-_.\s]+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * A generic stem stays generic with a trailing attempt number (sol1, try2),
 * and a bare number never names anything on its own.
 */
function isGenericStem(slug: string): boolean {
  if (/^\d+$/.test(slug)) return true;
  return GENERIC_STEMS.has(slug.replace(/\d+$/, ''));
}

function namesAProblem(slug: string, isDirectory = false): boolean {
  if (slug.length === 0 || isGenericStem(slug)) return false;
  if (isDirectory && STRUCTURAL_DIRECTORIES.has(slug)) return false;
  return true;
}

/**
 * Identity of a problem regardless of which extension or layout wrote it.
 * The filename wins when it names the problem. Otherwise every ancestor
 * directory is checked outward from the file, not just the immediate parent,
 * since a generic filename is often nested two levels under the real name
 * (two-sum/Easy/Solution.java) with a difficulty tier or judge name in between.
 */
export function canonicalProblemKey(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length === 0) return '';

  const filename = segments[segments.length - 1];
  const fileKey = slugifySegment(filename);
  if (namesAProblem(fileKey)) return fileKey;

  for (let i = segments.length - 2; i >= 0; i--) {
    const dirKey = slugifySegment(segments[i]);
    if (namesAProblem(dirKey, true)) return dirKey;
  }

  return fileKey || slugifySegment(path);
}

/** Groups items by the problem they belong to, preserving input order. */
export function groupByCanonicalKey<T>(
  items: T[],
  getPath: (item: T) => string,
): Map<string, T[]> {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = canonicalProblemKey(getPath(item));
    const group = groups.get(key);
    if (group) group.push(item);
    else groups.set(key, [item]);
  }

  return groups;
}

/**
 * One item per problem. `pickBest` decides which copy survives a collision;
 * without it the first one wins.
 */
export function dedupeByCanonicalKey<T>(
  items: T[],
  getPath: (item: T) => string,
  pickBest?: (a: T, b: T) => T,
): T[] {
  const winners = new Map<string, T>();

  for (const item of items) {
    const key = canonicalProblemKey(getPath(item));
    const existing = winners.get(key);
    if (!existing) winners.set(key, item);
    else if (pickBest) winners.set(key, pickBest(existing, item));
  }

  return [...winners.values()];
}

/** How many distinct problems a set of file paths represents. */
export function countCanonicalProblems(paths: string[]): number {
  return new Set(paths.map(canonicalProblemKey)).size;
}
