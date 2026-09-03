import { PATTERNS } from './constants';

/**
 * The practice ladder: the problems to solve NEXT, grouped by the trigger you
 * have to spot. Sourced from "DSA Patterns you need to know" by anubhav0910
 * (leetcode.com/discuss/post/5886397), re-cut into tiers.
 *
 * This is the forward half of the app. Everything under lib/github.ts describes
 * problems already solved; nothing here has been solved yet, so a rung's
 * problems carry no repo, no revision, and no solution to reveal.
 *
 * Tiers, in the order you climb them:
 *   anchor  learn the mechanism here, reading the editorial is allowed
 *   rep     the same mechanism with the details moved, must be unaided
 *   twist   the mechanism disguised, or combined with a second one
 *   boss    the hard variant that proves the rung
 */

export type LadderTier = 'anchor' | 'rep' | 'twist' | 'boss';
export type LadderDifficulty = 'easy' | 'medium' | 'hard';

export const TIER_ORDER: LadderTier[] = ['anchor', 'rep', 'twist', 'boss'];

export const TIER_LABELS: Record<LadderTier, string> = {
  anchor: 'Anchor',
  rep: 'Rep',
  twist: 'Twist',
  boss: 'Boss',
};

/** Minutes an unaided solve should take, by difficulty. Used by the readiness rule. */
export const TIME_BUDGET_MIN: Record<LadderDifficulty, number> = {
  easy: 15,
  medium: 25,
  hard: 40,
};

export interface LadderProblem {
  /** LeetCode title slug: the identity of the problem everywhere in this app. */
  slug: string;
  /** LeetCode's own frontend number, for the "1234." prefix people recognise. */
  number: string;
  title: string;
  difficulty: LadderDifficulty;
  tier: LadderTier;
}

export interface LadderRung {
  id: string;
  name: string;
  /** Heading the rungs are shown under. Purely presentational. */
  group: string;
  /**
   * The lib/constants PATTERNS value this rung trains. Several rungs share one
   * (all seven DP rungs are dynamic-programming), which is what lets a rung's
   * readiness read lapses out of the recall queue and reuse its trigger card.
   */
  corePattern: string;
  /**
   * Rungs to do first. This is a recommended order rather than the minimal
   * set of prerequisites, kept to four rungs a row so the whole ladder fits
   * one screen. A rung unlocks once every dep has its anchor tier solved
   * unaided (lib/ladder-graph.ts); locked rungs stay openable.
   */
  deps: string[];
  problems: LadderProblem[];
}

export const LADDER: LadderRung[] = [
  {
    id: 'fast-slow-pointer',
    deps: ['two-pointers'],
    name: 'Fast and Slow Pointer',
    group: 'Pointers and windows',
    corePattern: 'fast-slow-pointer',
    problems: [
      { slug: 'linked-list-cycle-ii', number: '142', title: 'Linked List Cycle II', difficulty: 'medium', tier: 'anchor' },
      { slug: 'palindrome-linked-list', number: '234', title: 'Palindrome Linked List', difficulty: 'easy', tier: 'anchor' },
      { slug: 'remove-nth-node-from-end-of-list', number: '19', title: 'Remove Nth Node From End of List', difficulty: 'medium', tier: 'rep' },
      { slug: 'find-the-duplicate-number', number: '287', title: 'Find the Duplicate Number', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'overlapping-intervals',
    deps: ['binary-search-on-answer'],
    name: 'Overlapping Intervals',
    group: 'Arrays',
    corePattern: 'intervals',
    problems: [
      { slug: 'merge-intervals', number: '56', title: 'Merge Intervals', difficulty: 'medium', tier: 'anchor' },
      { slug: 'insert-interval', number: '57', title: 'Insert Interval', difficulty: 'medium', tier: 'rep' },
      { slug: 'my-calendar-ii', number: '731', title: 'My Calendar II', difficulty: 'medium', tier: 'rep' },
      { slug: 'minimum-number-of-arrows-to-burst-balloons', number: '452', title: 'Minimum Number of Arrows to Burst Balloons', difficulty: 'medium', tier: 'twist' },
      { slug: 'non-overlapping-intervals', number: '435', title: 'Non-overlapping Intervals', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'prefix-sum',
    deps: [],
    name: 'Prefix Sum',
    group: 'Arrays',
    corePattern: 'prefix-sum',
    problems: [
      { slug: 'find-the-middle-index-in-array', number: '1991', title: 'Find the Middle Index in Array', difficulty: 'easy', tier: 'anchor' },
      { slug: 'product-of-array-except-self', number: '238', title: 'Product of Array Except Self', difficulty: 'medium', tier: 'rep' },
      { slug: 'maximum-product-subarray', number: '152', title: 'Maximum Product Subarray', difficulty: 'medium', tier: 'rep' },
      { slug: 'number-of-ways-to-split-array', number: '2270', title: 'Number of Ways to Split Array', difficulty: 'medium', tier: 'twist' },
      { slug: 'range-sum-query-2d-immutable', number: '304', title: 'Range Sum Query 2D - Immutable', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'sliding-window-fixed',
    deps: ['two-pointers'],
    name: 'Sliding Window: Fixed Size',
    group: 'Pointers and windows',
    corePattern: 'sliding-window',
    problems: [
      { slug: 'maximum-sum-of-distinct-subarrays-with-length-k', number: '2461', title: 'Maximum Sum of Distinct Subarrays With Length K', difficulty: 'medium', tier: 'anchor' },
      { slug: 'number-of-sub-arrays-of-size-k-and-average-greater-than-or-equal-to-threshold', number: '1343', title: 'Number of Sub-arrays of Size K and Average Greater than or Equal to Threshold', difficulty: 'medium', tier: 'rep' },
      { slug: 'repeated-dna-sequences', number: '187', title: 'Repeated DNA Sequences', difficulty: 'medium', tier: 'rep' },
      { slug: 'permutation-in-string', number: '567', title: 'Permutation in String', difficulty: 'medium', tier: 'twist' },
      { slug: 'sliding-subarray-beauty', number: '2653', title: 'Sliding Subarray Beauty', difficulty: 'medium', tier: 'twist' },
      { slug: 'sliding-window-maximum', number: '239', title: 'Sliding Window Maximum', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'sliding-window-variable',
    deps: ['sliding-window-fixed'],
    name: 'Sliding Window: Variable Size',
    group: 'Pointers and windows',
    corePattern: 'sliding-window',
    problems: [
      { slug: 'longest-substring-without-repeating-characters', number: '3', title: 'Longest Substring Without Repeating Characters', difficulty: 'medium', tier: 'anchor' },
      { slug: 'minimum-size-subarray-sum', number: '209', title: 'Minimum Size Subarray Sum', difficulty: 'medium', tier: 'rep' },
      { slug: 'subarray-product-less-than-k', number: '713', title: 'Subarray Product Less Than K', difficulty: 'medium', tier: 'rep' },
      { slug: 'max-consecutive-ones-iii', number: '1004', title: 'Max Consecutive Ones III', difficulty: 'medium', tier: 'rep' },
      { slug: 'fruit-into-baskets', number: '904', title: 'Fruit Into Baskets', difficulty: 'medium', tier: 'twist' },
      { slug: 'count-number-of-nice-subarrays', number: '1248', title: 'Count Number of Nice Subarrays', difficulty: 'medium', tier: 'twist' },
      { slug: 'minimum-window-substring', number: '76', title: 'Minimum Window Substring', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'two-pointers',
    deps: [],
    name: 'Two Pointers',
    group: 'Pointers and windows',
    corePattern: 'two-pointers',
    problems: [
      { slug: 'two-sum-ii-input-array-is-sorted', number: '167', title: 'Two Sum II - Input Array Is Sorted', difficulty: 'medium', tier: 'anchor' },
      { slug: 'sort-colors', number: '75', title: 'Sort Colors', difficulty: 'medium', tier: 'rep' },
      { slug: 'next-permutation', number: '31', title: 'Next Permutation', difficulty: 'medium', tier: 'rep' },
      { slug: 'bag-of-tokens', number: '948', title: 'Bag of Tokens', difficulty: 'medium', tier: 'twist' },
      { slug: 'container-with-most-water', number: '11', title: 'Container With Most Water', difficulty: 'medium', tier: 'twist' },
      { slug: 'trapping-rain-water', number: '42', title: 'Trapping Rain Water', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'cyclic-sort',
    deps: ['prefix-sum'],
    name: 'Cyclic Sort',
    group: 'Arrays',
    corePattern: 'cyclic-sort',
    problems: [
      { slug: 'missing-number', number: '268', title: 'Missing Number', difficulty: 'easy', tier: 'anchor' },
      { slug: 'find-all-numbers-disappeared-in-an-array', number: '448', title: 'Find All Numbers Disappeared in an Array', difficulty: 'easy', tier: 'anchor' },
      { slug: 'set-mismatch', number: '645', title: 'Set Mismatch', difficulty: 'easy', tier: 'anchor' },
      { slug: 'first-missing-positive', number: '41', title: 'First Missing Positive', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'linked-list-reversal',
    deps: ['fast-slow-pointer'],
    name: 'In-place Linked List Reversal',
    group: 'Linked lists',
    corePattern: 'linked-list',
    problems: [
      { slug: 'reverse-linked-list', number: '206', title: 'Reverse Linked List', difficulty: 'easy', tier: 'anchor' },
      { slug: 'swap-nodes-in-pairs', number: '24', title: 'Swap Nodes in Pairs', difficulty: 'medium', tier: 'twist' },
      { slug: 'reverse-nodes-in-k-group', number: '25', title: 'Reverse Nodes in k-Group', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'matrix-manipulation',
    deps: ['cyclic-sort'],
    name: 'Matrix Manipulation',
    group: 'Arrays',
    corePattern: 'matrix',
    problems: [
      { slug: 'rotate-image', number: '48', title: 'Rotate Image', difficulty: 'medium', tier: 'anchor' },
      { slug: 'spiral-matrix', number: '54', title: 'Spiral Matrix', difficulty: 'medium', tier: 'rep' },
      { slug: 'set-matrix-zeroes', number: '73', title: 'Set Matrix Zeroes', difficulty: 'medium', tier: 'twist' },
      { slug: 'game-of-life', number: '289', title: 'Game of Life', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'bfs',
    deps: ['tree-level-order'],
    name: 'Breadth First Search',
    group: 'Graphs',
    corePattern: 'bfs',
    problems: [
      { slug: 'shortest-path-in-binary-matrix', number: '1091', title: 'Shortest Path in Binary Matrix', difficulty: 'medium', tier: 'anchor' },
      { slug: 'rotting-oranges', number: '994', title: 'Rotting Oranges', difficulty: 'medium', tier: 'rep' },
      { slug: 'as-far-from-land-as-possible', number: '1162', title: 'As Far from Land as Possible', difficulty: 'medium', tier: 'twist' },
      { slug: 'word-ladder', number: '127', title: 'Word Ladder', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'dfs',
    deps: ['tree-root-to-leaf'],
    name: 'Depth First Search',
    group: 'Graphs',
    corePattern: 'dfs',
    problems: [
      { slug: 'number-of-closed-islands', number: '1254', title: 'Number of Closed Islands', difficulty: 'medium', tier: 'anchor' },
      { slug: 'coloring-a-border', number: '1034', title: 'Coloring A Border', difficulty: 'medium', tier: 'rep' },
      { slug: 'number-of-enclaves', number: '1020', title: 'Number of Enclaves', difficulty: 'medium', tier: 'rep' },
      { slug: 'time-needed-to-inform-all-employees', number: '1376', title: 'Time Needed to Inform All Employees', difficulty: 'medium', tier: 'twist' },
      { slug: 'find-eventual-safe-states', number: '802', title: 'Find Eventual Safe States', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'backtracking',
    deps: ['dfs'],
    name: 'Backtracking',
    group: 'Recursion',
    corePattern: 'backtracking',
    problems: [
      { slug: 'permutations-ii', number: '47', title: 'Permutations II', difficulty: 'medium', tier: 'anchor' },
      { slug: 'combination-sum', number: '39', title: 'Combination Sum', difficulty: 'medium', tier: 'rep' },
      { slug: 'generate-parentheses', number: '22', title: 'Generate Parentheses', difficulty: 'medium', tier: 'rep' },
      { slug: 'palindrome-partitioning', number: '131', title: 'Palindrome Partitioning', difficulty: 'medium', tier: 'twist' },
      { slug: 'word-search', number: '79', title: 'Word Search', difficulty: 'medium', tier: 'twist' },
      { slug: 'n-queens', number: '51', title: 'N-Queens', difficulty: 'hard', tier: 'boss' },
      { slug: 'sudoku-solver', number: '37', title: 'Sudoku Solver', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'modified-binary-search',
    deps: ['prefix-sum'],
    name: 'Modified Binary Search',
    group: 'Binary search',
    corePattern: 'binary-search',
    problems: [
      { slug: 'search-in-rotated-sorted-array-ii', number: '81', title: 'Search in Rotated Sorted Array II', difficulty: 'medium', tier: 'anchor' },
      { slug: 'find-minimum-in-rotated-sorted-array', number: '153', title: 'Find Minimum in Rotated Sorted Array', difficulty: 'medium', tier: 'rep' },
      { slug: 'find-peak-element', number: '162', title: 'Find Peak Element', difficulty: 'medium', tier: 'rep' },
      { slug: 'single-element-in-a-sorted-array', number: '540', title: 'Single Element in a Sorted Array', difficulty: 'medium', tier: 'twist' },
      { slug: 'find-in-mountain-array', number: '1095', title: 'Find in Mountain Array', difficulty: 'hard', tier: 'boss' },
      { slug: 'median-of-two-sorted-arrays', number: '4', title: 'Median of Two Sorted Arrays', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'binary-search-on-answer',
    deps: ['modified-binary-search'],
    name: 'Binary Search on the Answer',
    group: 'Binary search',
    corePattern: 'binary-search-on-answer',
    problems: [
      { slug: 'minimum-speed-to-arrive-on-time', number: '1870', title: 'Minimum Speed to Arrive on Time', difficulty: 'medium', tier: 'anchor' },
      { slug: 'capacity-to-ship-packages-within-d-days', number: '1011', title: 'Capacity To Ship Packages Within D Days', difficulty: 'medium', tier: 'rep' },
      { slug: 'koko-eating-bananas', number: '875', title: 'Koko Eating Bananas', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'bitwise-xor',
    deps: [],
    name: 'Bitwise XOR',
    group: 'Bit tricks',
    corePattern: 'bit-manipulation',
    problems: [
      { slug: 'missing-number', number: '268', title: 'Missing Number', difficulty: 'easy', tier: 'anchor' },
      { slug: 'single-number-ii', number: '137', title: 'Single Number II', difficulty: 'medium', tier: 'rep' },
      { slug: 'single-number-iii', number: '260', title: 'Single Number III', difficulty: 'medium', tier: 'rep' },
      { slug: 'find-the-original-array-of-prefix-xor', number: '2433', title: 'Find The Original Array of Prefix Xor', difficulty: 'medium', tier: 'twist' },
      { slug: 'xor-queries-of-a-subarray', number: '1310', title: 'XOR Queries of a Subarray', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'top-k-elements',
    deps: ['monotonic-stack'],
    name: 'Top \'K\' Elements',
    group: 'Heaps',
    corePattern: 'heap',
    problems: [
      { slug: 'top-k-frequent-elements', number: '347', title: 'Top K Frequent Elements', difficulty: 'medium', tier: 'anchor' },
      { slug: 'kth-largest-element-in-an-array', number: '215', title: 'Kth Largest Element in an Array', difficulty: 'medium', tier: 'rep' },
      { slug: 'ugly-number-ii', number: '264', title: 'Ugly Number II', difficulty: 'medium', tier: 'twist' },
      { slug: 'k-closest-points-to-origin', number: '973', title: 'K Closest Points to Origin', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'k-way-merge',
    deps: ['top-k-elements'],
    name: 'K-way Merge',
    group: 'Heaps',
    corePattern: 'k-way-merge',
    problems: [
      { slug: 'find-k-pairs-with-smallest-sums', number: '373', title: 'Find K Pairs with Smallest Sums', difficulty: 'medium', tier: 'anchor' },
      { slug: 'kth-smallest-element-in-a-sorted-matrix', number: '378', title: 'Kth Smallest Element in a Sorted Matrix', difficulty: 'medium', tier: 'rep' },
      { slug: 'merge-k-sorted-lists', number: '23', title: 'Merge k Sorted Lists', difficulty: 'hard', tier: 'boss' },
      { slug: 'smallest-range-covering-elements-from-k-lists', number: '632', title: 'Smallest Range Covering Elements from K Lists', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'two-heaps',
    deps: ['top-k-elements'],
    name: 'Two Heaps',
    group: 'Heaps',
    corePattern: 'two-heaps',
    problems: [
      { slug: 'find-median-from-data-stream', number: '295', title: 'Find Median from Data Stream', difficulty: 'hard', tier: 'anchor' },
      { slug: 'sliding-window-median', number: '480', title: 'Sliding Window Median', difficulty: 'hard', tier: 'boss' },
      { slug: 'ipo', number: '502', title: 'IPO', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'monotonic-stack',
    deps: ['sliding-window-variable'],
    name: 'Monotonic Stack',
    group: 'Arrays',
    corePattern: 'monotonic-stack',
    problems: [
      { slug: 'next-greater-element-ii', number: '503', title: 'Next Greater Element II', difficulty: 'medium', tier: 'anchor' },
      { slug: 'next-greater-node-in-linked-list', number: '1019', title: 'Next Greater Node In Linked List', difficulty: 'medium', tier: 'rep' },
      { slug: 'daily-temperatures', number: '739', title: 'Daily Temperatures', difficulty: 'medium', tier: 'rep' },
      { slug: 'online-stock-span', number: '901', title: 'Online Stock Span', difficulty: 'medium', tier: 'twist' },
      { slug: 'maximum-width-ramp', number: '962', title: 'Maximum Width Ramp', difficulty: 'medium', tier: 'twist' },
      { slug: 'largest-rectangle-in-histogram', number: '84', title: 'Largest Rectangle in Histogram', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'tree-level-order',
    deps: ['linked-list-reversal'],
    name: 'Trees: Level Order Traversal',
    group: 'Trees',
    corePattern: 'trees',
    problems: [
      { slug: 'binary-tree-level-order-traversal', number: '102', title: 'Binary Tree Level Order Traversal', difficulty: 'medium', tier: 'anchor' },
      { slug: 'binary-tree-zigzag-level-order-traversal', number: '103', title: 'Binary Tree Zigzag Level Order Traversal', difficulty: 'medium', tier: 'rep' },
      { slug: 'even-odd-tree', number: '1609', title: 'Even Odd Tree', difficulty: 'medium', tier: 'rep' },
      { slug: 'reverse-odd-levels-of-binary-tree', number: '2415', title: 'Reverse Odd Levels of Binary Tree', difficulty: 'medium', tier: 'rep' },
      { slug: 'deepest-leaves-sum', number: '1302', title: 'Deepest Leaves Sum', difficulty: 'medium', tier: 'twist' },
      { slug: 'add-one-row-to-tree', number: '623', title: 'Add One Row to Tree', difficulty: 'medium', tier: 'twist' },
      { slug: 'maximum-width-of-binary-tree', number: '662', title: 'Maximum Width of Binary Tree', difficulty: 'medium', tier: 'twist' },
      { slug: 'all-nodes-distance-k-in-binary-tree', number: '863', title: 'All Nodes Distance K in Binary Tree', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'tree-construction',
    deps: ['tree-height'],
    name: 'Trees: Construction',
    group: 'Trees',
    corePattern: 'trees',
    problems: [
      { slug: 'construct-binary-tree-from-preorder-and-inorder-traversal', number: '105', title: 'Construct Binary Tree from Preorder and Inorder Traversal', difficulty: 'medium', tier: 'anchor' },
      { slug: 'construct-binary-tree-from-inorder-and-postorder-traversal', number: '106', title: 'Construct Binary Tree from Inorder and Postorder Traversal', difficulty: 'medium', tier: 'rep' },
      { slug: 'maximum-binary-tree', number: '654', title: 'Maximum Binary Tree', difficulty: 'medium', tier: 'twist' },
      { slug: 'construct-binary-search-tree-from-preorder-traversal', number: '1008', title: 'Construct Binary Search Tree from Preorder Traversal', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'tree-height',
    deps: ['tree-level-order'],
    name: 'Trees: Height and Depth',
    group: 'Trees',
    corePattern: 'trees',
    problems: [
      { slug: 'maximum-depth-of-binary-tree', number: '104', title: 'Maximum Depth of Binary Tree', difficulty: 'easy', tier: 'anchor' },
      { slug: 'balanced-binary-tree', number: '110', title: 'Balanced Binary Tree', difficulty: 'easy', tier: 'anchor' },
      { slug: 'diameter-of-binary-tree', number: '543', title: 'Diameter of Binary Tree', difficulty: 'easy', tier: 'anchor' },
      { slug: 'minimum-depth-of-binary-tree', number: '111', title: 'Minimum Depth of Binary Tree', difficulty: 'easy', tier: 'anchor' },
    ],
  },
  {
    id: 'tree-root-to-leaf',
    deps: ['tree-height'],
    name: 'Trees: Root-to-leaf Paths',
    group: 'Trees',
    corePattern: 'trees',
    problems: [
      { slug: 'binary-tree-paths', number: '257', title: 'Binary Tree Paths', difficulty: 'easy', tier: 'anchor' },
      { slug: 'path-sum-ii', number: '113', title: 'Path Sum II', difficulty: 'medium', tier: 'rep' },
      { slug: 'sum-root-to-leaf-numbers', number: '129', title: 'Sum Root to Leaf Numbers', difficulty: 'medium', tier: 'rep' },
      { slug: 'smallest-string-starting-from-leaf', number: '988', title: 'Smallest String Starting From Leaf', difficulty: 'medium', tier: 'rep' },
      { slug: 'insufficient-nodes-in-root-to-leaf-paths', number: '1080', title: 'Insufficient Nodes in Root to Leaf Paths', difficulty: 'medium', tier: 'twist' },
      { slug: 'pseudo-palindromic-paths-in-a-binary-tree', number: '1457', title: 'Pseudo-Palindromic Paths in a Binary Tree', difficulty: 'medium', tier: 'twist' },
      { slug: 'binary-tree-maximum-path-sum', number: '124', title: 'Binary Tree Maximum Path Sum', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'tree-ancestor',
    deps: ['tree-root-to-leaf'],
    name: 'Trees: Ancestors',
    group: 'Trees',
    corePattern: 'trees',
    problems: [
      { slug: 'lowest-common-ancestor-of-a-binary-tree', number: '236', title: 'Lowest Common Ancestor of a Binary Tree', difficulty: 'medium', tier: 'anchor' },
      { slug: 'maximum-difference-between-node-and-ancestor', number: '1026', title: 'Maximum Difference Between Node and Ancestor', difficulty: 'medium', tier: 'rep' },
      { slug: 'lowest-common-ancestor-of-deepest-leaves', number: '1123', title: 'Lowest Common Ancestor of Deepest Leaves', difficulty: 'medium', tier: 'twist' },
      { slug: 'kth-ancestor-of-a-tree-node', number: '1483', title: 'Kth Ancestor of a Tree Node', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'bst',
    deps: ['tree-construction'],
    name: 'Binary Search Tree',
    group: 'Trees',
    corePattern: 'bst',
    problems: [
      { slug: 'validate-binary-search-tree', number: '98', title: 'Validate Binary Search Tree', difficulty: 'medium', tier: 'anchor' },
      { slug: 'range-sum-of-bst', number: '938', title: 'Range Sum of BST', difficulty: 'easy', tier: 'anchor' },
      { slug: 'minimum-absolute-difference-in-bst', number: '530', title: 'Minimum Absolute Difference in BST', difficulty: 'easy', tier: 'anchor' },
      { slug: 'insert-into-a-binary-search-tree', number: '701', title: 'Insert into a Binary Search Tree', difficulty: 'medium', tier: 'twist' },
      { slug: 'lowest-common-ancestor-of-a-binary-search-tree', number: '235', title: 'Lowest Common Ancestor of a Binary Search Tree', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'dp-knapsack-01',
    deps: ['backtracking'],
    name: 'DP: Take or Not Take (0/1)',
    group: 'Dynamic programming',
    corePattern: 'dynamic-programming',
    problems: [
      { slug: 'house-robber-ii', number: '213', title: 'House Robber II', difficulty: 'medium', tier: 'anchor' },
      { slug: 'target-sum', number: '494', title: 'Target Sum', difficulty: 'medium', tier: 'rep' },
      { slug: 'partition-equal-subset-sum', number: '416', title: 'Partition Equal Subset Sum', difficulty: 'medium', tier: 'rep' },
      { slug: 'ones-and-zeroes', number: '474', title: 'Ones and Zeroes', difficulty: 'medium', tier: 'twist' },
      { slug: 'last-stone-weight-ii', number: '1049', title: 'Last Stone Weight II', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'dp-knapsack-unbounded',
    deps: ['dp-knapsack-01'],
    name: 'DP: Infinite Supply',
    group: 'Dynamic programming',
    corePattern: 'dynamic-programming',
    problems: [
      { slug: 'coin-change', number: '322', title: 'Coin Change', difficulty: 'medium', tier: 'anchor' },
      { slug: 'coin-change-ii', number: '518', title: 'Coin Change II', difficulty: 'medium', tier: 'rep' },
      { slug: 'perfect-squares', number: '279', title: 'Perfect Squares', difficulty: 'medium', tier: 'twist' },
      { slug: 'minimum-cost-for-tickets', number: '983', title: 'Minimum Cost For Tickets', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'dp-lis',
    deps: ['dp-knapsack-01'],
    name: 'DP: Longest Increasing Subsequence',
    group: 'Dynamic programming',
    corePattern: 'dynamic-programming',
    problems: [
      { slug: 'longest-increasing-subsequence', number: '300', title: 'Longest Increasing Subsequence', difficulty: 'medium', tier: 'anchor' },
      { slug: 'largest-divisible-subset', number: '368', title: 'Largest Divisible Subset', difficulty: 'medium', tier: 'rep' },
      { slug: 'maximum-length-of-pair-chain', number: '646', title: 'Maximum Length of Pair Chain', difficulty: 'medium', tier: 'rep' },
      { slug: 'number-of-longest-increasing-subsequence', number: '673', title: 'Number of Longest Increasing Subsequence', difficulty: 'medium', tier: 'twist' },
      { slug: 'longest-string-chain', number: '1048', title: 'Longest String Chain', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'dp-grids',
    deps: ['dp-knapsack-unbounded', 'matrix-manipulation'],
    name: 'DP on Grids',
    group: 'Dynamic programming',
    corePattern: 'dynamic-programming',
    problems: [
      { slug: 'unique-paths-ii', number: '63', title: 'Unique Paths II', difficulty: 'medium', tier: 'anchor' },
      { slug: 'minimum-path-sum', number: '64', title: 'Minimum Path Sum', difficulty: 'medium', tier: 'rep' },
      { slug: 'triangle', number: '120', title: 'Triangle', difficulty: 'medium', tier: 'rep' },
      { slug: 'minimum-falling-path-sum', number: '931', title: 'Minimum Falling Path Sum', difficulty: 'medium', tier: 'rep' },
      { slug: 'maximal-square', number: '221', title: 'Maximal Square', difficulty: 'medium', tier: 'twist' },
      { slug: 'cherry-pickup', number: '741', title: 'Cherry Pickup', difficulty: 'hard', tier: 'boss' },
      { slug: 'dungeon-game', number: '174', title: 'Dungeon Game', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'dp-strings',
    deps: ['dp-lis'],
    name: 'DP on Strings',
    group: 'Dynamic programming',
    corePattern: 'dynamic-programming',
    problems: [
      { slug: 'longest-common-subsequence', number: '1143', title: 'Longest Common Subsequence', difficulty: 'medium', tier: 'anchor' },
      { slug: 'longest-palindromic-subsequence', number: '516', title: 'Longest Palindromic Subsequence', difficulty: 'medium', tier: 'rep' },
      { slug: 'palindromic-substrings', number: '647', title: 'Palindromic Substrings', difficulty: 'medium', tier: 'rep' },
      { slug: 'longest-palindromic-substring', number: '5', title: 'Longest Palindromic Substring', difficulty: 'medium', tier: 'rep' },
      { slug: 'edit-distance', number: '72', title: 'Edit Distance', difficulty: 'medium', tier: 'rep' },
      { slug: 'minimum-ascii-delete-sum-for-two-strings', number: '712', title: 'Minimum ASCII Delete Sum for Two Strings', difficulty: 'medium', tier: 'twist' },
      { slug: 'distinct-subsequences', number: '115', title: 'Distinct Subsequences', difficulty: 'hard', tier: 'boss' },
      { slug: 'shortest-common-supersequence', number: '1092', title: 'Shortest Common Supersequence ', difficulty: 'hard', tier: 'boss' },
      { slug: 'wildcard-matching', number: '44', title: 'Wildcard Matching', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'dp-stocks',
    deps: ['dp-knapsack-01'],
    name: 'DP on Stocks',
    group: 'Dynamic programming',
    corePattern: 'dynamic-programming',
    problems: [
      { slug: 'best-time-to-buy-and-sell-stock-ii', number: '122', title: 'Best Time to Buy and Sell Stock II', difficulty: 'medium', tier: 'anchor' },
      { slug: 'best-time-to-buy-and-sell-stock-with-cooldown', number: '309', title: 'Best Time to Buy and Sell Stock with Cooldown', difficulty: 'medium', tier: 'twist' },
      { slug: 'best-time-to-buy-and-sell-stock-with-transaction-fee', number: '714', title: 'Best Time to Buy and Sell Stock with Transaction Fee', difficulty: 'medium', tier: 'twist' },
      { slug: 'best-time-to-buy-and-sell-stock-iii', number: '123', title: 'Best Time to Buy and Sell Stock III', difficulty: 'hard', tier: 'boss' },
      { slug: 'best-time-to-buy-and-sell-stock-iv', number: '188', title: 'Best Time to Buy and Sell Stock IV', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'dp-partition',
    deps: ['dp-strings'],
    name: 'Partition DP (MCM)',
    group: 'Dynamic programming',
    corePattern: 'dynamic-programming',
    problems: [
      { slug: 'partition-array-for-maximum-sum', number: '1043', title: 'Partition Array for Maximum Sum', difficulty: 'medium', tier: 'anchor' },
      { slug: 'burst-balloons', number: '312', title: 'Burst Balloons', difficulty: 'hard', tier: 'boss' },
      { slug: 'minimum-cost-to-cut-a-stick', number: '1547', title: 'Minimum Cost to Cut a Stick', difficulty: 'hard', tier: 'boss' },
      { slug: 'palindrome-partitioning-ii', number: '132', title: 'Palindrome Partitioning II', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'topological-sort',
    deps: ['dfs', 'bfs'],
    name: 'Topological Sort',
    group: 'Graphs',
    corePattern: 'topological-sort',
    problems: [
      { slug: 'course-schedule', number: '207', title: 'Course Schedule', difficulty: 'medium', tier: 'anchor' },
      { slug: 'course-schedule-ii', number: '210', title: 'Course Schedule II', difficulty: 'medium', tier: 'rep' },
      { slug: 'sequence-reconstruction', number: '444', title: 'Sequence Reconstruction', difficulty: 'medium', tier: 'twist' },
      { slug: 'strange-printer-ii', number: '1591', title: 'Strange Printer II', difficulty: 'hard', tier: 'boss' },
      { slug: 'alien-dictionary', number: '269', title: 'Alien Dictionary', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'union-find',
    deps: ['dfs'],
    name: 'Union-Find',
    group: 'Graphs',
    corePattern: 'union-find',
    problems: [
      { slug: 'number-of-operations-to-make-network-connected', number: '1319', title: 'Number of Operations to Make Network Connected', difficulty: 'medium', tier: 'anchor' },
      { slug: 'redundant-connection', number: '684', title: 'Redundant Connection', difficulty: 'medium', tier: 'rep' },
      { slug: 'accounts-merge', number: '721', title: 'Accounts Merge', difficulty: 'medium', tier: 'twist' },
      { slug: 'satisfiability-of-equality-equations', number: '990', title: 'Satisfiability of Equality Equations', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'graph-shortest-path',
    deps: ['bfs', 'k-way-merge'],
    name: 'Shortest Paths and MST',
    group: 'Graphs',
    corePattern: 'graphs',
    problems: [
      { slug: 'min-cost-to-connect-all-points', number: '1584', title: 'Min Cost to Connect All Points', difficulty: 'medium', tier: 'anchor' },
      { slug: 'cheapest-flights-within-k-stops', number: '787', title: 'Cheapest Flights Within K Stops', difficulty: 'medium', tier: 'rep' },
      { slug: 'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance', number: '1334', title: 'Find the City With the Smallest Number of Neighbors at a Threshold Distance', difficulty: 'medium', tier: 'twist' },
      { slug: 'network-delay-time', number: '743', title: 'Network Delay Time', difficulty: 'medium', tier: 'twist' },
    ],
  },
  {
    id: 'greedy',
    deps: ['overlapping-intervals'],
    name: 'Greedy',
    group: 'Greedy',
    corePattern: 'greedy',
    problems: [
      { slug: 'jump-game-ii', number: '45', title: 'Jump Game II', difficulty: 'medium', tier: 'anchor' },
      { slug: 'gas-station', number: '134', title: 'Gas Station', difficulty: 'medium', tier: 'rep' },
      { slug: 'bag-of-tokens', number: '948', title: 'Bag of Tokens', difficulty: 'medium', tier: 'rep' },
      { slug: 'boats-to-save-people', number: '881', title: 'Boats to Save People', difficulty: 'medium', tier: 'rep' },
      { slug: 'wiggle-subsequence', number: '376', title: 'Wiggle Subsequence', difficulty: 'medium', tier: 'twist' },
      { slug: 'car-pooling', number: '1094', title: 'Car Pooling', difficulty: 'medium', tier: 'twist' },
      { slug: 'candy', number: '135', title: 'Candy', difficulty: 'hard', tier: 'boss' },
    ],
  },
  {
    id: 'design-data-structure',
    deps: ['linked-list-reversal'],
    name: 'Design a Data Structure',
    group: 'Design',
    corePattern: 'design',
    problems: [
      { slug: 'design-twitter', number: '355', title: 'Design Twitter', difficulty: 'medium', tier: 'anchor' },
      { slug: 'design-browser-history', number: '1472', title: 'Design Browser History', difficulty: 'medium', tier: 'rep' },
      { slug: 'design-circular-deque', number: '641', title: 'Design Circular Deque', difficulty: 'medium', tier: 'rep' },
      { slug: 'snapshot-array', number: '1146', title: 'Snapshot Array', difficulty: 'medium', tier: 'twist' },
      { slug: 'lru-cache', number: '146', title: 'LRU Cache', difficulty: 'medium', tier: 'twist' },
      { slug: 'lfu-cache', number: '460', title: 'LFU Cache', difficulty: 'hard', tier: 'boss' },
    ],
  },
];

const BY_ID = new Map(LADDER.map((rung) => [rung.id, rung]));

export function rungById(id: string): LadderRung | undefined {
  return BY_ID.get(id);
}

/** Every rung a problem appears on. Two rungs share a couple of problems. */
export function rungsForSlug(slug: string): LadderRung[] {
  return LADDER.filter((rung) => rung.problems.some((p) => p.slug === slug));
}

export function ladderProblem(
  slug: string,
): { rung: LadderRung; problem: LadderProblem } | undefined {
  for (const rung of LADDER) {
    const problem = rung.problems.find((p) => p.slug === slug);
    if (problem) return { rung, problem };
  }
  return undefined;
}

/**
 * Rungs under one heading each, in the order the headings first appear. The
 * catalog keeps the source post's ordering, which interleaves groups, so this
 * cannot merge only adjacent rungs.
 */
export function groupedLadder(): Array<{ group: string; rungs: LadderRung[] }> {
  const byGroup = new Map<string, LadderRung[]>();
  for (const rung of LADDER) {
    const rungs = byGroup.get(rung.group);
    if (rungs) rungs.push(rung);
    else byGroup.set(rung.group, [rung]);
  }
  return [...byGroup.entries()].map(([group, rungs]) => ({ group, rungs }));
}

/** Guards the catalog against a corePattern that no longer exists in PATTERNS. */
export function unknownCorePatterns(): string[] {
  const known = new Set<string>(PATTERNS.map((p) => p.value));
  return [...new Set(LADDER.map((r) => r.corePattern))].filter((p) => !known.has(p));
}
