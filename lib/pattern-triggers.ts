/**
 * The identification trigger for each pattern: the structural features in a
 * problem statement that say which technique applies.
 *
 * This is the unit worth reviewing. Re-reading a solution rehearses code you
 * will not be asked to reproduce; rehearsing the trigger rehearses the decision
 * you actually have to make in an interview. One card per pattern, no code, no
 * edge cases, so the whole deck stays a few minutes of work.
 */

export interface PatternTrigger {
  pattern: string;
  /** What you notice in the statement. Deliberately phrased as features. */
  features: string;
  /** The mechanism in one sentence, so recall lands on why, not just what. */
  mechanism: string;
}

export const PATTERN_TRIGGERS: PatternTrigger[] = [
  {
    pattern: 'binary-search-on-answer',
    features:
      'Minimise the maximum (or maximise the minimum) of something, the value you must return is a single number inside a known range, and testing whether one candidate value works is cheap while trying every value is not.',
    mechanism:
      'Binary search the answer itself; feasibility is monotonic, so a predicate splits the range into no and yes.',
  },
  {
    pattern: 'binary-search',
    features:
      'Input is sorted, or rotated-sorted, and you need a position, a boundary, or a first or last occurrence.',
    mechanism: 'Halve the interval on each comparison against the midpoint.',
  },
  {
    pattern: 'sliding-window',
    features:
      'Contiguous subarray or substring, a constraint on what the span may contain, and you want the longest, the shortest, or a count of them.',
    mechanism:
      'Grow the right edge, and pull the left edge in only while the window is invalid.',
  },
  {
    pattern: 'two-pointers',
    features:
      'A sorted array or a string read from both ends, pairs or triples that meet a target, or in-place partitioning.',
    mechanism:
      'Move the pointer that can improve the answer; sortedness makes the other direction pointless.',
  },
  {
    pattern: 'prefix-sum',
    features:
      'Many range-sum queries, or counting subarrays whose sum hits a target, with no negatives constraint that would allow a window.',
    mechanism:
      'Store cumulative sums and look up the complement, so a range becomes one subtraction.',
  },
  {
    pattern: 'monotonic-stack',
    features:
      'The next or previous element that is greater or smaller, spans, or a histogram or skyline of widths.',
    mechanism:
      'Keep a stack ordered so popping resolves the element it was waiting for.',
  },
  {
    pattern: 'hashing',
    features:
      'Membership, counting, grouping by a key, or a complement lookup, with no ordering requirement.',
    mechanism: 'Trade memory for a constant-time lookup of what you have already seen.',
  },
  {
    pattern: 'backtracking',
    features:
      'Enumerate all arrangements, subsets, combinations, or placements, often with a validity rule and a hint that the answer count is exponential.',
    mechanism:
      'Choose, recurse, undo the choice; prune the moment the partial candidate becomes invalid.',
  },
  {
    pattern: 'dynamic-programming',
    features:
      'Count the ways, or optimise a total, where a choice at each step and overlapping subproblems make greedy wrong.',
    mechanism:
      'Define a state that makes the future independent of the path taken, then build up from base cases.',
  },
  {
    pattern: 'greedy',
    features:
      'Optimise a total where a local rule provably cannot be beaten, often after sorting by one key.',
    mechanism: 'Take the locally best option and prove an exchange argument keeps it optimal.',
  },
  {
    pattern: 'intervals',
    features: 'Pairs of start and end, asking about overlap, merging, or how many fit.',
    mechanism: 'Sort by start or end, then sweep, comparing each interval to the last kept one.',
  },
  {
    pattern: 'heap',
    features:
      'The k largest, k smallest, or a running median, or repeatedly taking the current extreme.',
    mechanism: 'Keep only what matters in a size-k heap so each step costs log k, not n.',
  },
  {
    pattern: 'fast-slow-pointer',
    features:
      'A linked list or an implicit successor function, and the question is about a cycle, a midpoint, or the nth node from the end, with no extra space allowed.',
    mechanism:
      'Two pointers one step and two steps per tick meet inside a cycle, and land the slow one at the midpoint when the fast one runs out.',
  },
  {
    pattern: 'cyclic-sort',
    features:
      'n numbers drawn from a range close to 1..n, and you want the missing one, the duplicate, or both, in place and in linear time.',
    mechanism:
      'Every value has one rightful index, so swap each value home and read off whichever index disagrees.',
  },
  {
    pattern: 'k-way-merge',
    features:
      'Several already-sorted lists, rows, or streams, and you want one ordered sequence out of all of them, or the kth smallest across them.',
    mechanism:
      'A heap of one candidate per list always holds the global next element, so each pop advances only its own list.',
  },
  {
    pattern: 'two-heaps',
    features:
      'A running median, or a stream you keep splitting into a cheap half and an expensive half as values arrive.',
    mechanism:
      'A max-heap of the lower half against a min-heap of the upper half, rebalanced by one, keeps the middle at both tops.',
  },
  {
    pattern: 'design',
    features:
      'The problem names a class and its methods rather than a return value, and states a complexity target per operation.',
    mechanism:
      'Pick the structure each operation needs and keep them in sync; the answer is usually a hash map paired with a list, heap, or linked list.',
  },
  {
    pattern: 'linked-list',
    features:
      'Nodes and pointers, reversal in place, cycle detection, or finding a position from the end.',
    mechanism:
      'Rewire pointers with a dummy head, and use fast and slow pointers for position and cycles.',
  },
  {
    pattern: 'trees',
    features:
      'A hierarchy where the answer at a node is built from its children, or a traversal order is asked for.',
    mechanism: 'Recurse, and decide whether the work happens before or after the child calls.',
  },
  {
    pattern: 'bst',
    features:
      'A binary tree plus an ordering guarantee, and you need a kth element, a range, validation, or a search.',
    mechanism: 'The in-order traversal is sorted, so comparisons let you skip a whole subtree.',
  },
  {
    pattern: 'graphs',
    features:
      'Entities with connections, reachability, components, or a shortest route through a network.',
    mechanism:
      'Model as nodes and edges, then pick the traversal the weights demand: BFS unweighted, Dijkstra weighted.',
  },
  {
    pattern: 'bfs',
    features:
      'Fewest steps, shortest path on an unweighted grid or graph, or a level-by-level answer.',
    mechanism: 'A queue visits everything at distance d before anything at d plus one.',
  },
  {
    pattern: 'dfs',
    features:
      'Explore or fill a region, count components, or answer a question about a whole branch.',
    mechanism: 'Recurse deep, marking visited, and let the call stack carry the path.',
  },
  {
    pattern: 'topological-sort',
    features:
      'Prerequisites, ordering with dependencies, or asking whether a valid order exists at all.',
    mechanism:
      'Repeatedly take nodes of in-degree zero; leftover nodes mean a cycle, so no order exists.',
  },
  {
    pattern: 'union-find',
    features:
      'Connectivity questions asked while edges are being added, or counting groups after merges.',
    mechanism: 'Keep a representative per set, and merge by pointing one root at the other.',
  },
  {
    pattern: 'trie',
    features: 'Many prefix queries over a fixed dictionary, autocomplete, or word search on a board.',
    mechanism: 'A tree keyed by character so a shared prefix is stored and walked once.',
  },
  {
    pattern: 'bit-manipulation',
    features:
      'Small fixed-size integers, pairing or cancelling duplicates, subsets encoded as masks, or a constant-space demand.',
    mechanism: 'XOR cancels pairs and a mask enumerates subsets in one integer.',
  },
  {
    pattern: 'matrix',
    features: 'A two-dimensional grid traversed in place, rotated, or spiralled.',
    mechanism: 'Work in layers or transpose plus reverse, keeping the index arithmetic explicit.',
  },
  {
    pattern: 'stack',
    features: 'Nesting, matching pairs, or undo behaviour where the most recent thing resolves first.',
    mechanism: 'Push the open thing, pop when its partner arrives.',
  },
  {
    pattern: 'recursion',
    features:
      'The problem is literally a smaller copy of itself, and halving the input halves the work.',
    mechanism: 'Solve the base case, then combine the results of the smaller calls.',
  },
  {
    pattern: 'sorting',
    features:
      'The answer only depends on relative order, or a custom comparator makes the rest trivial.',
    mechanism: 'Sort by the key the question really cares about, then read off the answer.',
  },
  {
    pattern: 'strings',
    features:
      'Character-level structure: palindromes, anagrams, parsing, or matching within a single string.',
    mechanism: 'Count characters or expand around a centre, depending on whether order matters.',
  },
  {
    pattern: 'math',
    features:
      'Digits, divisors, primes, overflow, or a closed-form answer that makes iteration unnecessary.',
    mechanism: 'Find the arithmetic property, then compute rather than enumerate.',
  },
];

export function triggerFor(pattern: string): PatternTrigger | undefined {
  return PATTERN_TRIGGERS.find((t) => t.pattern === pattern);
}

/**
 * Drill order: the patterns you have been getting wrong come first. A struggle
 * rate needs a couple of attempts before it means anything, so untested
 * patterns sit in the middle rather than at either extreme.
 */
export function drillOrder(
  triggers: PatternTrigger[],
  weakness: Map<string, { attempts: number; struggles: number }>,
): PatternTrigger[] {
  const score = (t: PatternTrigger) => {
    const stat = weakness.get(t.pattern);
    // Measured scores run from -1 (missed every time) to 0 (never missed), so
    // an untested pattern sits halfway rather than at either end.
    if (!stat || stat.attempts < 2) return -0.5;
    return -(stat.struggles / stat.attempts);
  };

  return [...triggers].sort((a, b) => score(a) - score(b));
}
