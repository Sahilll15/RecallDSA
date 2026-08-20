/**
 * One problem can land in a repo under several paths: two extensions commit
 * different folder namings, the same solution gets rewritten in a second
 * language, or a problem number changes. Revision scheduling keys off this
 * identity rather than the path so a problem is queued once, not once per file.
 */

/** Filenames that name the file, not the problem: the directory names it instead. */
const GENERIC_FILENAMES = new Set([
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

export function slugifySegment(segment: string): string {
  return segment
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/^\d+[-_.\s]+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function namesAProblem(slug: string): boolean {
  return slug.length > 0 && !GENERIC_FILENAMES.has(slug);
}

/**
 * Identity of a problem regardless of which extension or layout wrote it.
 * The filename wins when it names the problem; only when it is generic
 * (Solution.java) does the directory name it, because a directory is just as
 * often a topic folder shared by many problems.
 */
export function canonicalProblemKey(path: string): string {
  const segments = path.split('/').filter(Boolean);
  const filename = segments.pop() ?? path;
  const directory = segments.pop();

  const fileKey = slugifySegment(filename);
  const dirKey = directory ? slugifySegment(directory) : '';

  if (namesAProblem(fileKey)) return fileKey;
  if (namesAProblem(dirKey)) return dirKey;

  return fileKey || dirKey || slugifySegment(path);
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
