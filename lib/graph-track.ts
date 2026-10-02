/**
 * The graph track: what to know before touching graph problems, then every
 * pattern LeetCode actually tests, each with the trigger that gives it away,
 * a template, and a short climb of problems. Slugs were checked against
 * LeetCode's GraphQL API on 2026-09-28; `premium` marks the subscriber-only ones.
 */

export type GraphDifficulty = 'easy' | 'medium' | 'hard';

export interface GraphProblem {
  slug: string;
  number: string;
  title: string;
  difficulty: GraphDifficulty;
  /** Why this problem is on the list: the twist it adds over the one before. */
  note: string;
  premium?: boolean;
}

export interface Prerequisite {
  id: string;
  name: string;
  /** What you should be able to do without looking anything up. */
  mustKnow: string[];
  warmups: GraphProblem[];
}

export interface GraphPattern {
  id: string;
  name: string;
  /** One line under the name. */
  tagline: string;
  deps: string[];
  /** Phrases or shapes in a problem statement that point at this pattern. */
  spotIt: string[];
  idea: string;
  /** Python. */
  template: string;
  cppTemplate: string;
  complexity: string;
  pitfalls: string[];
  problems: GraphProblem[];
  /** Optional stretch patterns interviews rarely ask. */
  stretch?: boolean;
}

export const PREREQUISITES: Prerequisite[] = [
  {
    id: 'vocabulary',
    name: 'Graph vocabulary',
    mustKnow: [
      'Vertex, edge, directed vs undirected, weighted vs unweighted.',
      'Degree, in-degree and out-degree. A node with in-degree 0 has nothing pointing at it.',
      'Path, cycle, connected component, and why a DAG is a directed graph with no cycle.',
      'A tree is a connected graph with no cycle, which forces exactly V - 1 edges.',
    ],
    warmups: [
      { slug: 'find-center-of-star-graph', number: '1791', title: 'Find Center of Star Graph', difficulty: 'easy', note: 'Degree counting in one line.' },
      { slug: 'find-the-town-judge', number: '997', title: 'Find the Town Judge', difficulty: 'easy', note: 'In-degree vs out-degree on a directed graph.' },
    ],
  },
  {
    id: 'representation',
    name: 'Building the graph',
    mustKnow: [
      'Turn an edge list into an adjacency list with a dict of lists. This is step one of most problems.',
      'Know when an adjacency matrix is given instead (isConnected[i][j]) and that it costs O(V^2) to scan.',
      'Treat a grid as a graph: each cell is a node, the 4 directions are its edges. Keep a dirs array.',
      'Some graphs are never built. Words one letter apart or lock states one turn apart are implicit edges.',
    ],
    warmups: [
      { slug: 'find-if-path-exists-in-graph', number: '1971', title: 'Find if Path Exists in Graph', difficulty: 'easy', note: 'Build the adjacency list, then any traversal works.' },
      { slug: 'flood-fill', number: '733', title: 'Flood Fill', difficulty: 'easy', note: 'Your first grid-as-graph walk.' },
    ],
  },
  {
    id: 'recursion',
    name: 'Recursion and tree traversal',
    mustKnow: [
      'Write a recursive function with a base case and trust the recursive call.',
      'Preorder, inorder and postorder on a binary tree. Postorder is the one graph DFS leans on most.',
      'Know that Python recursion caps near 1000 frames, so deep grids need sys.setrecursionlimit or a stack.',
    ],
    warmups: [
      { slug: 'maximum-depth-of-binary-tree', number: '104', title: 'Maximum Depth of Binary Tree', difficulty: 'easy', note: 'Return values flowing up from children.' },
      { slug: 'binary-tree-inorder-traversal', number: '94', title: 'Binary Tree Inorder Traversal', difficulty: 'easy', note: 'Do it recursively, then again with an explicit stack.' },
    ],
  },
  {
    id: 'queues',
    name: 'Stacks, queues and deques',
    mustKnow: [
      'A queue (collections.deque) gives BFS its level order. popleft is O(1), list.pop(0) is not.',
      'A stack turns recursive DFS into an iterative one.',
      'A deque with appendleft is what makes 0-1 BFS work later.',
    ],
    warmups: [
      { slug: 'implement-queue-using-stacks', number: '232', title: 'Implement Queue using Stacks', difficulty: 'easy', note: 'Feel the difference between LIFO and FIFO.' },
      { slug: 'binary-tree-level-order-traversal', number: '102', title: 'Binary Tree Level Order Traversal', difficulty: 'medium', note: 'BFS on a tree. Graph BFS is this plus a visited set.' },
    ],
  },
  {
    id: 'heaps',
    name: 'Heaps and priority queues',
    mustKnow: [
      'heapq is a min-heap. Push (cost, node) tuples so the cheapest pops first.',
      'Push and pop are O(log n). There is no decrease-key, so you push duplicates and skip stale ones.',
    ],
    warmups: [
      { slug: 'last-stone-weight', number: '1046', title: 'Last Stone Weight', difficulty: 'easy', note: 'Max-heap by negating values.' },
      { slug: 'kth-largest-element-in-a-stream', number: '703', title: 'Kth Largest Element in a Stream', difficulty: 'easy', note: 'Keep a heap of fixed size.' },
    ],
  },
  {
    id: 'complexity',
    name: 'Reading the constraints',
    mustKnow: [
      'Any single traversal is O(V + E). If V is 10^5, you get one or two passes, nothing quadratic.',
      'V up to about 100 means O(V^3) is fine, which is the hint for Floyd-Warshall.',
      'V up to about 12 to 15 means a bitmask over visited nodes is expected.',
      'Hash sets for visited: add when you push, not when you pop, or BFS can queue a node many times.',
    ],
    warmups: [],
  },
];

export const GRAPH_PATTERNS: GraphPattern[] = [
  {
    id: 'dfs',
    name: 'DFS and connected components',
    tagline: 'Go as deep as you can, mark what you touched, count the fresh starts.',
    deps: [],
    spotIt: [
      '"How many groups / provinces / networks"',
      '"Can every node be reached from X"',
      'Anything that asks to visit, copy or explore everything connected',
    ],
    idea:
      'Run DFS from every unvisited node. Each fresh start is a new connected component, and everything the call reaches belongs to it. Directed problems usually need the direction of each edge remembered too.',
    template: `graph = defaultdict(list)
for u, v in edges:
    graph[u].append(v)
    graph[v].append(u)          # drop for a directed graph

seen = set()
def dfs(u):
    seen.add(u)
    for v in graph[u]:
        if v not in seen:
            dfs(v)

components = 0
for u in range(n):
    if u not in seen:
        dfs(u)
        components += 1`,
    cppTemplate: `vector<vector<int>> graph(n);
for (auto& e : edges) {
    graph[e[0]].push_back(e[1]);
    graph[e[1]].push_back(e[0]);  // drop for a directed graph
}

vector<bool> seen(n, false);
function<void(int)> dfs = [&](int u) {
    seen[u] = true;
    for (int v : graph[u])
        if (!seen[v]) dfs(v);
};

int components = 0;
for (int u = 0; u < n; u++) {
    if (!seen[u]) {
        dfs(u);
        components++;
    }
}`,
    complexity: 'O(V + E) time, O(V) for the visited set and the call stack.',
    pitfalls: [
      'Marking visited after the loop instead of on entry, which revisits nodes through cycles.',
      'Forgetting nodes with no edges. Loop over range(n), not over the graph dict keys.',
    ],
    problems: [
      { slug: 'number-of-provinces', number: '547', title: 'Number of Provinces', difficulty: 'medium', note: 'Count components from an adjacency matrix.' },
      { slug: 'keys-and-rooms', number: '841', title: 'Keys and Rooms', difficulty: 'medium', note: 'Reachability from one source on a directed graph.' },
      { slug: 'clone-graph', number: '133', title: 'Clone Graph', difficulty: 'medium', note: 'The visited map doubles as old-node to new-node.' },
      { slug: 'reorder-routes-to-make-all-paths-lead-to-the-city-zero', number: '1466', title: 'Reorder Routes to Make All Paths Lead to the City Zero', difficulty: 'medium', note: 'Store each edge both ways with a flag for its real direction.' },
      { slug: 'count-unreachable-pairs-of-nodes-in-an-undirected-graph', number: '2316', title: 'Count Unreachable Pairs of Nodes in an Undirected Graph', difficulty: 'medium', note: 'Component sizes, then a counting trick.' },
    ],
  },
  {
    id: 'grid',
    name: 'Grids as graphs',
    tagline: 'Cells are nodes, the four neighbours are edges.',
    deps: ['dfs'],
    spotIt: [
      'A 2D board of 0/1, land/water, X/O',
      '"Islands", "regions", "enclosed", "surrounded"',
      'Anything touching the border is treated differently',
    ],
    idea:
      'Same DFS, but neighbours come from a dirs array and a bounds check. When cells touching the edge are special, start the search from the border and mark what it reaches, then look at what is left.',
    template: `R, C = len(grid), len(grid[0])
DIRS = [(1, 0), (-1, 0), (0, 1), (0, -1)]

def dfs(r, c):
    if r < 0 or r >= R or c < 0 or c >= C or grid[r][c] != 1:
        return 0
    grid[r][c] = 0              # sink it: the grid is the visited set
    return 1 + sum(dfs(r + dr, c + dc) for dr, dc in DIRS)`,
    cppTemplate: `int R = grid.size(), C = grid[0].size();
int dirs[4][2] = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

function<int(int, int)> dfs = [&](int r, int c) {
    if (r < 0 || r >= R || c < 0 || c >= C || grid[r][c] != 1)
        return 0;
    grid[r][c] = 0;               // sink it: the grid is the visited set
    int area = 1;
    for (auto& d : dirs) area += dfs(r + d[0], c + d[1]);
    return area;
};`,
    complexity: 'O(R * C) time. Recursion can go R * C deep on a snake-shaped island.',
    pitfalls: [
      'Mutating the input when the problem needs it back. Use a separate seen set then.',
      'Python recursion limit on a 300 x 300 grid. Raise it or switch to an explicit stack.',
    ],
    problems: [
      { slug: 'number-of-islands', number: '200', title: 'Number of Islands', difficulty: 'medium', note: 'The anchor. Components on a grid.' },
      { slug: 'max-area-of-island', number: '695', title: 'Max Area of Island', difficulty: 'medium', note: 'Return a size from the DFS instead of nothing.' },
      { slug: 'number-of-enclaves', number: '1020', title: 'Number of Enclaves', difficulty: 'medium', note: 'Flood from the border first, count what is left.' },
      { slug: 'surrounded-regions', number: '130', title: 'Surrounded Regions', difficulty: 'medium', note: 'Same border trick, then flip in place.' },
      { slug: 'count-sub-islands', number: '1905', title: 'Count Sub Islands', difficulty: 'medium', note: 'DFS on one grid while checking another.' },
    ],
  },
  {
    id: 'bfs',
    name: 'BFS and shortest path (unweighted)',
    tagline: 'Level by level. The first time you reach a node is the shortest way there.',
    deps: ['grid'],
    spotIt: [
      '"Minimum number of steps / moves / minutes"',
      'Every edge costs the same',
      'Several things spread at once (rot, fire, distance from any 0): multi-source BFS',
    ],
    idea:
      'Push the start into a queue with distance 0 and process one layer at a time. Because every edge costs 1, a node is final the first time it is seen. For multi-source BFS, put every source in the queue before the loop starts.',
    template: `q = deque([start])           # or every source at once
seen = {start}
steps = 0
while q:
    for _ in range(len(q)):  # one layer
        u = q.popleft()
        if u == target:
            return steps
        for v in neighbours(u):
            if v not in seen:
                seen.add(v)  # mark on push
                q.append(v)
    steps += 1
return -1`,
    cppTemplate: `queue<int> q;
q.push(start);                    // or every source at once
unordered_set<int> seen{start};
int steps = 0;
while (!q.empty()) {
    for (int sz = q.size(); sz > 0; sz--) {  // one layer
        int u = q.front(); q.pop();
        if (u == target) return steps;
        for (int v : neighbours(u)) {
            if (!seen.count(v)) {
                seen.insert(v);   // mark on push
                q.push(v);
            }
        }
    }
    steps++;
}
return -1;`,
    complexity: 'O(V + E) time and space.',
    pitfalls: [
      'Marking visited on pop, which lets the same node be queued many times.',
      'Running BFS once per source in a multi-source problem. Seed them all together.',
    ],
    problems: [
      { slug: 'nearest-exit-from-entrance-in-maze', number: '1926', title: 'Nearest Exit from Entrance in Maze', difficulty: 'medium', note: 'Plain single-source BFS on a grid.' },
      { slug: 'shortest-path-in-binary-matrix', number: '1091', title: 'Shortest Path in Binary Matrix', difficulty: 'medium', note: 'Eight directions instead of four.' },
      { slug: 'rotting-oranges', number: '994', title: 'Rotting Oranges', difficulty: 'medium', note: 'Multi-source BFS, the layer count is the answer.' },
      { slug: '01-matrix', number: '542', title: '01 Matrix', difficulty: 'medium', note: 'Run it backwards: start from every 0.' },
      { slug: 'word-ladder', number: '127', title: 'Word Ladder', difficulty: 'hard', note: 'Implicit graph. Generate neighbours by changing one letter.' },
    ],
  },
  {
    id: 'cycle',
    name: 'Cycle detection',
    tagline: 'Undirected: a seen node that is not your parent. Directed: a node still on the stack.',
    deps: ['dfs'],
    spotIt: [
      '"Is there a cycle", "is this a valid tree", "deadlock"',
      '"Safe" or "terminal" nodes that can never loop',
      'Each node has exactly one outgoing edge (a functional graph)',
    ],
    idea:
      'In an undirected graph, reaching an already visited node that is not the one you came from closes a cycle. In a directed graph that is not enough, so colour nodes white, grey (on the current path) and black (finished). Reaching a grey node is a back edge, which is a cycle.',
    template: `WHITE, GREY, BLACK = 0, 1, 2
color = [WHITE] * n

def has_cycle(u):            # directed
    color[u] = GREY
    for v in graph[u]:
        if color[v] == GREY:
            return True
        if color[v] == WHITE and has_cycle(v):
            return True
    color[u] = BLACK
    return False`,
    cppTemplate: `enum { WHITE, GREY, BLACK };
vector<int> color(n, WHITE);

function<bool(int)> hasCycle = [&](int u) {  // directed
    color[u] = GREY;
    for (int v : graph[u]) {
        if (color[v] == GREY) return true;
        if (color[v] == WHITE && hasCycle(v)) return true;
    }
    color[u] = BLACK;
    return false;
};`,
    complexity: 'O(V + E).',
    pitfalls: [
      'Using the undirected parent check on a directed graph. A -> B and C -> B is not a cycle.',
      'Resetting colours between starts. Black nodes stay black; that is what keeps it linear.',
    ],
    problems: [
      { slug: 'detect-cycles-in-2d-grid', number: '1559', title: 'Detect Cycles in 2D Grid', difficulty: 'medium', note: 'Undirected cycle with a parent cell.' },
      { slug: 'find-eventual-safe-states', number: '802', title: 'Find Eventual Safe States', difficulty: 'medium', note: 'The black nodes are the answer.' },
      { slug: 'graph-valid-tree', number: '261', title: 'Graph Valid Tree', difficulty: 'medium', premium: true, note: 'Connected and acyclic. Free alternative: 684.' },
      { slug: 'longest-cycle-in-a-graph', number: '2360', title: 'Longest Cycle in a Graph', difficulty: 'hard', note: 'One out-edge per node. Timestamps give the cycle length.' },
      { slug: 'shortest-cycle-in-a-graph', number: '2608', title: 'Shortest Cycle in a Graph', difficulty: 'hard', note: 'BFS from every node, V is small enough.' },
    ],
  },
  {
    id: 'bipartite',
    name: 'Bipartite and 2-colouring',
    tagline: 'Colour neighbours opposite. A clash means it cannot be split in two.',
    deps: ['bfs'],
    spotIt: [
      '"Split into two groups so no pair in the same group dislikes each other"',
      '"Is the graph bipartite"',
      'Odd-length cycles are the only thing that breaks it',
    ],
    idea:
      'BFS or DFS from each uncoloured node, giving each neighbour the opposite colour. If a neighbour already has your colour, the graph is not bipartite. Run it per component, because the graph may be disconnected.',
    template: `color = [-1] * n
for s in range(n):
    if color[s] != -1:
        continue
    color[s] = 0
    q = deque([s])
    while q:
        u = q.popleft()
        for v in graph[u]:
            if color[v] == -1:
                color[v] = color[u] ^ 1
                q.append(v)
            elif color[v] == color[u]:
                return False
return True`,
    cppTemplate: `vector<int> color(n, -1);
for (int s = 0; s < n; s++) {
    if (color[s] != -1) continue;
    color[s] = 0;
    queue<int> q;
    q.push(s);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : graph[u]) {
            if (color[v] == -1) {
                color[v] = color[u] ^ 1;
                q.push(v);
            } else if (color[v] == color[u]) {
                return false;
            }
        }
    }
}
return true;`,
    complexity: 'O(V + E).',
    pitfalls: [
      'Starting only from node 0 and missing other components.',
      '1-indexed node labels in the input. Size arrays n + 1.',
    ],
    problems: [
      { slug: 'is-graph-bipartite', number: '785', title: 'Is Graph Bipartite?', difficulty: 'medium', note: 'The anchor, graph given as adjacency list.' },
      { slug: 'possible-bipartition', number: '886', title: 'Possible Bipartition', difficulty: 'medium', note: 'Build the graph from dislikes first.' },
      { slug: 'flower-planting-with-no-adjacent', number: '1042', title: 'Flower Planting With No Adjacent', difficulty: 'medium', note: 'Greedy colouring with 4 colours, degree at most 3.' },
      { slug: 'divide-nodes-into-the-maximum-number-of-groups', number: '2493', title: 'Divide Nodes Into the Maximum Number of Groups', difficulty: 'hard', note: 'Bipartite check, then BFS depth per component.' },
    ],
  },
  {
    id: 'topological-sort',
    name: 'Topological sort',
    tagline: 'Order a DAG so every edge points forward.',
    deps: ['cycle', 'bfs'],
    spotIt: [
      '"Prerequisites", "dependencies", "must come before"',
      '"Find an order" or "is it possible to finish all"',
      'Longest path or DP over a directed graph with no cycles',
    ],
    idea:
      "Kahn's algorithm: count in-degrees, queue every node with in-degree 0, and each time you pop one, decrement its neighbours and queue any that hit 0. If fewer than V nodes come out, there was a cycle. The pop order is a valid ordering, and it is also the order to run DP on a DAG.",
    template: `indeg = [0] * n
for u, v in edges:           # u must come before v
    graph[u].append(v)
    indeg[v] += 1

q = deque(i for i in range(n) if indeg[i] == 0)
order = []
while q:
    u = q.popleft()
    order.append(u)
    for v in graph[u]:
        indeg[v] -= 1
        if indeg[v] == 0:
            q.append(v)

return order if len(order) == n else []   # [] means a cycle`,
    cppTemplate: `vector<vector<int>> graph(n);
vector<int> indeg(n, 0);
for (auto& e : edges) {           // e[0] must come before e[1]
    graph[e[0]].push_back(e[1]);
    indeg[e[1]]++;
}

queue<int> q;
for (int i = 0; i < n; i++)
    if (indeg[i] == 0) q.push(i);

vector<int> order;
while (!q.empty()) {
    int u = q.front(); q.pop();
    order.push_back(u);
    for (int v : graph[u])
        if (--indeg[v] == 0) q.push(v);
}

return order.size() == n ? order : vector<int>{};  // {} means a cycle`,
    complexity: 'O(V + E).',
    pitfalls: [
      'Getting the edge direction backwards. [a, b] in Course Schedule means b before a.',
      'Forgetting that a leftover node count is the cycle check.',
    ],
    problems: [
      { slug: 'course-schedule', number: '207', title: 'Course Schedule', difficulty: 'medium', note: 'Can it be ordered at all.' },
      { slug: 'course-schedule-ii', number: '210', title: 'Course Schedule II', difficulty: 'medium', note: 'Return the order itself.' },
      { slug: 'find-all-possible-recipes-from-given-supplies', number: '2115', title: 'Find All Possible Recipes from Given Supplies', difficulty: 'medium', note: 'Nodes are strings, supplies are the sources.' },
      { slug: 'parallel-courses-iii', number: '2050', title: 'Parallel Courses III', difficulty: 'hard', note: 'Longest path in a DAG: DP in topological order.' },
      { slug: 'largest-color-value-in-a-directed-graph', number: '1857', title: 'Largest Color Value in a Directed Graph', difficulty: 'hard', note: 'DP with 26 counters per node, plus the cycle check.' },
    ],
  },
  {
    id: 'union-find',
    name: 'Union-Find (DSU)',
    tagline: 'Merge groups and ask "same group?" in almost O(1).',
    deps: ['dfs'],
    spotIt: [
      'Edges arrive one at a time and you need connectivity after each',
      '"Are these equivalent", "merge accounts", "group by shared item"',
      'Counting components while edges are added or picked',
    ],
    idea:
      'Every node points to a parent; the root names the group. find follows parents to the root and flattens the path on the way back. union attaches the smaller root under the larger. A union that finds both ends already in the same group is an edge that closes a cycle.',
    template: `parent = list(range(n))
size = [1] * n

def find(x):
    while parent[x] != x:
        parent[x] = parent[parent[x]]   # path halving
        x = parent[x]
    return x

def union(a, b):
    ra, rb = find(a), find(b)
    if ra == rb:
        return False                    # already connected
    if size[ra] < size[rb]:
        ra, rb = rb, ra
    parent[rb] = ra
    size[ra] += size[rb]
    return True`,
    cppTemplate: `vector<int> parent(n), sz(n, 1);
iota(parent.begin(), parent.end(), 0);

auto find = [&](int x) {
    while (parent[x] != x) {
        parent[x] = parent[parent[x]];  // path halving
        x = parent[x];
    }
    return x;
};

auto unite = [&](int a, int b) {
    int ra = find(a), rb = find(b);
    if (ra == rb) return false;         // already connected
    if (sz[ra] < sz[rb]) swap(ra, rb);
    parent[rb] = ra;
    sz[ra] += sz[rb];
    return true;
};`,
    complexity: 'Near O(1) per operation (inverse Ackermann) with both optimisations.',
    pitfalls: [
      'Comparing parent[a] == parent[b] instead of find(a) == find(b).',
      'Skipping union by size. Without it a chain can make find linear.',
    ],
    problems: [
      { slug: 'number-of-operations-to-make-network-connected', number: '1319', title: 'Number of Operations to Make Network Connected', difficulty: 'medium', note: 'Components minus one, if there are enough spare edges.' },
      { slug: 'satisfiability-of-equality-equations', number: '990', title: 'Satisfiability of Equality Equations', difficulty: 'medium', note: 'Union all ==, then check every !=.' },
      { slug: 'accounts-merge', number: '721', title: 'Accounts Merge', difficulty: 'medium', note: 'Union through a shared email.' },
      { slug: 'most-stones-removed-with-same-row-or-column', number: '947', title: 'Most Stones Removed with Same Row or Column', difficulty: 'medium', note: 'Union rows with columns. Answer is stones minus components.' },
      { slug: 'remove-max-number-of-edges-to-keep-graph-fully-traversable', number: '1579', title: 'Remove Max Number of Edges to Keep Graph Fully Traversable', difficulty: 'hard', note: 'Two DSUs, shared edges first.' },
    ],
  },
  {
    id: 'spanning-tree',
    name: 'Spanning trees',
    tagline: 'V nodes, V - 1 edges, all connected, no cycle.',
    deps: ['union-find', 'cycle'],
    spotIt: [
      '"Which edge can be removed so it becomes a tree"',
      'Exactly n nodes and n edges: a tree plus one extra edge',
      '"Root the tree so its height is minimal"',
    ],
    idea:
      'A spanning tree keeps every node connected with the fewest edges. Any extra edge closes exactly one cycle, which DSU finds the moment it sees both ends already joined. For centre-of-tree questions, peel leaves layer by layer like a topological sort on an undirected graph.',
    template: `# the edge that turns a tree into a graph with a cycle
for u, v in edges:
    if not union(u, v):
        return [u, v]

# centre of a tree: peel leaves
leaves = [u for u in range(n) if len(graph[u]) == 1]
remaining = n
while remaining > 2:
    remaining -= len(leaves)
    nxt = []
    for leaf in leaves:
        nb = graph[leaf].pop()
        graph[nb].remove(leaf)
        if len(graph[nb]) == 1:
            nxt.append(nb)
    leaves = nxt`,
    cppTemplate: `// the edge that turns a tree into a graph with a cycle
for (auto& e : edges)
    if (!unite(e[0], e[1])) return e;

// centre of a tree: peel leaves (graph as vector<unordered_set<int>>)
vector<int> leaves;
for (int u = 0; u < n; u++)
    if (graph[u].size() == 1) leaves.push_back(u);
int remaining = n;
while (remaining > 2) {
    remaining -= leaves.size();
    vector<int> nxt;
    for (int leaf : leaves) {
        int nb = *graph[leaf].begin();
        graph[nb].erase(leaf);
        if (graph[nb].size() == 1) nxt.push_back(nb);
    }
    leaves = nxt;
}`,
    complexity: 'O(E * alpha(V)) for the DSU part, O(V) for leaf peeling.',
    pitfalls: [
      'Returning the first cycle edge when the problem wants the last one in input order.',
      'n == 1 in leaf peeling. The single node is the answer.',
    ],
    problems: [
      { slug: 'redundant-connection', number: '684', title: 'Redundant Connection', difficulty: 'medium', note: 'A tree plus one edge. DSU spots it.' },
      { slug: 'minimum-height-trees', number: '310', title: 'Minimum Height Trees', difficulty: 'medium', note: 'Leaf peeling to the centre.' },
      { slug: 'graph-valid-tree', number: '261', title: 'Graph Valid Tree', difficulty: 'medium', premium: true, note: 'Check E == V - 1 and one component.' },
      { slug: 'redundant-connection-ii', number: '685', title: 'Redundant Connection II', difficulty: 'hard', note: 'Directed version. A node with two parents changes the cases.' },
    ],
  },
  {
    id: 'mst',
    name: 'Minimum spanning tree',
    tagline: 'Connect everything for the least total weight.',
    deps: ['spanning-tree'],
    spotIt: [
      '"Minimum cost to connect all"',
      'Weighted undirected graph, and the answer is a set of edges',
      '"Minimise the maximum edge on a path" is secretly Kruskal too',
    ],
    idea:
      'Kruskal: sort edges by weight and add each one that joins two different DSU groups, stopping at V - 1 edges. Prim: grow one tree from a start node with a min-heap of edges leaving it. Kruskal is simpler with an edge list; Prim wins on a dense graph where every pair is an edge.',
    template: `# Kruskal
edges.sort(key=lambda e: e[2])
total = used = 0
for u, v, w in edges:
    if union(u, v):
        total += w
        used += 1
        if used == n - 1:
            break
return total if used == n - 1 else -1

# Prim (dense graphs)
seen, heap, total = set(), [(0, 0)], 0
while len(seen) < n:
    w, u = heappop(heap)
    if u in seen:
        continue
    seen.add(u)
    total += w
    for v, wv in graph[u]:
        if v not in seen:
            heappush(heap, (wv, v))`,
    cppTemplate: `// Kruskal
sort(edges.begin(), edges.end(),
     [](auto& a, auto& b) { return a[2] < b[2]; });
int total = 0, used = 0;
for (auto& e : edges) {
    if (unite(e[0], e[1])) {
        total += e[2];
        if (++used == n - 1) break;
    }
}
return used == n - 1 ? total : -1;

// Prim (dense graphs)
vector<bool> seen(n, false);
priority_queue<pair<int, int>, vector<pair<int, int>>, greater<>> pq;
pq.push({0, 0});
int total = 0, taken = 0;
while (taken < n) {
    auto [w, u] = pq.top(); pq.pop();
    if (seen[u]) continue;
    seen[u] = true;
    total += w;
    taken++;
    for (auto [v, wv] : graph[u])
        if (!seen[v]) pq.push({wv, v});
}`,
    complexity: 'Kruskal O(E log E). Prim O(E log V), or O(V^2) with an array on a complete graph.',
    pitfalls: [
      'Building all V^2 edges for Kruskal when Prim over the implicit complete graph is lighter.',
      'Forgetting to check that the result actually spans every node.',
    ],
    problems: [
      { slug: 'min-cost-to-connect-all-points', number: '1584', title: 'Min Cost to Connect All Points', difficulty: 'medium', note: 'The anchor. Complete graph, Prim fits best.' },
      { slug: 'connecting-cities-with-minimum-cost', number: '1135', title: 'Connecting Cities With Minimum Cost', difficulty: 'medium', premium: true, note: 'Textbook Kruskal on an edge list.' },
      { slug: 'swim-in-rising-water', number: '778', title: 'Swim in Rising Water', difficulty: 'hard', note: 'Add cells by height until start and end join.' },
      { slug: 'optimize-water-distribution-in-a-village', number: '1168', title: 'Optimize Water Distribution in a Village', difficulty: 'hard', premium: true, note: 'Add a virtual node 0 for the wells.' },
      { slug: 'find-critical-and-pseudo-critical-edges-in-minimum-spanning-tree', number: '1489', title: 'Find Critical and Pseudo-Critical Edges in MST', difficulty: 'hard', note: 'Rerun Kruskal with each edge forced in or banned.' },
    ],
  },
  {
    id: 'dijkstra',
    name: "Dijkstra's shortest path",
    tagline: 'BFS with a heap, for non-negative weights.',
    deps: ['bfs'],
    spotIt: [
      '"Minimum cost / time / effort" with different edge weights',
      'All weights are non-negative',
      'Counting the number of shortest paths, or the best of a product or max',
    ],
    idea:
      'Keep a best-known distance per node and a min-heap of (distance, node). Pop the smallest, skip it if a better distance was already recorded, and relax each neighbour. A popped node is final. The same loop works for "maximise probability" or "minimise the largest step" by changing how a path is scored.',
    template: `dist = [inf] * n
dist[src] = 0
heap = [(0, src)]
while heap:
    d, u = heappop(heap)
    if d > dist[u]:
        continue             # stale entry
    for v, w in graph[u]:
        nd = d + w
        if nd < dist[v]:
            dist[v] = nd
            heappush(heap, (nd, v))`,
    cppTemplate: `vector<long long> dist(n, LLONG_MAX);
dist[src] = 0;
priority_queue<pair<long long, int>, vector<pair<long long, int>>, greater<>> pq;
pq.push({0, src});
while (!pq.empty()) {
    auto [d, u] = pq.top(); pq.pop();
    if (d > dist[u]) continue;    // stale entry
    for (auto [v, w] : graph[u]) {
        long long nd = d + w;
        if (nd < dist[v]) {
            dist[v] = nd;
            pq.push({nd, v});
        }
    }
}`,
    complexity: 'O((V + E) log V).',
    pitfalls: [
      'Negative edge weights. Dijkstra is wrong there, use Bellman-Ford.',
      'Leaving out the stale-entry check, which can turn it quadratic.',
    ],
    problems: [
      { slug: 'network-delay-time', number: '743', title: 'Network Delay Time', difficulty: 'medium', note: 'The anchor. The answer is the largest dist.' },
      { slug: 'path-with-maximum-probability', number: '1514', title: 'Path with Maximum Probability', difficulty: 'medium', note: 'Multiply instead of add, max-heap instead of min.' },
      { slug: 'path-with-minimum-effort', number: '1631', title: 'Path With Minimum Effort', difficulty: 'medium', note: 'Path cost is the max step, not the sum.' },
      { slug: 'number-of-ways-to-arrive-at-destination', number: '1976', title: 'Number of Ways to Arrive at Destination', difficulty: 'medium', note: 'Count ties while relaxing.' },
      { slug: 'minimum-cost-to-make-at-least-one-valid-path-in-a-grid', number: '1368', title: 'Minimum Cost to Make at Least One Valid Path in a Grid', difficulty: 'hard', note: 'Weights are 0 or 1, so 0-1 BFS also works.' },
    ],
  },
  {
    id: 'state-bfs',
    name: 'BFS over states and 0-1 BFS',
    tagline: 'When position alone is not enough, the node is (position, extra state).',
    deps: ['bfs'],
    spotIt: [
      '"You can remove up to k obstacles", "with alternating colours", "keys you hold"',
      'Small n with "visit every node": a bitmask of visited nodes',
      'Edge costs are only 0 or 1',
    ],
    idea:
      'Put the extra information into the node itself: (row, col, k_left) or (node, mask). The visited set is then over those tuples. When edges cost 0 or 1, use a deque and push 0-cost moves to the front and 1-cost moves to the back, which gives Dijkstra results in O(V + E).',
    template: `# state BFS
start = (0, 0, k)
q, seen, steps = deque([start]), {start}, 0

# 0-1 BFS
dist = {src: 0}
dq = deque([src])
while dq:
    u = dq.popleft()
    for v, w in neighbours(u):      # w is 0 or 1
        if dist[u] + w < dist.get(v, inf):
            dist[v] = dist[u] + w
            if w == 0:
                dq.appendleft(v)
            else:
                dq.append(v)`,
    cppTemplate: `// state BFS: pack (r, c, k) into one struct or tuple
using State = tuple<int, int, int>;
queue<State> q;
q.push({0, 0, k});
set<State> seen{{0, 0, k}};
int steps = 0;

// 0-1 BFS
vector<int> dist(n, INT_MAX);
dist[src] = 0;
deque<int> dq{src};
while (!dq.empty()) {
    int u = dq.front(); dq.pop_front();
    for (auto [v, w] : neighbours(u)) {   // w is 0 or 1
        if (dist[u] + w < dist[v]) {
            dist[v] = dist[u] + w;
            if (w == 0) dq.push_front(v);
            else dq.push_back(v);
        }
    }
}`,
    complexity: 'O(states + transitions). With a bitmask that is O(2^n * n).',
    pitfalls: [
      'Keeping visited by position only, which throws away states that carry more budget.',
      'A state space too large to fit. Check it against the constraints before coding.',
    ],
    problems: [
      { slug: 'open-the-lock', number: '752', title: 'Open the Lock', difficulty: 'medium', note: 'The states are 4-digit strings.' },
      { slug: 'shortest-path-with-alternating-colors', number: '1129', title: 'Shortest Path with Alternating Colors', difficulty: 'medium', note: 'State is (node, colour of last edge).' },
      { slug: 'shortest-path-in-a-grid-with-obstacles-elimination', number: '1293', title: 'Shortest Path in a Grid with Obstacles Elimination', difficulty: 'hard', note: 'State is (r, c, removals left).' },
      { slug: 'minimum-obstacle-removal-to-reach-corner', number: '2290', title: 'Minimum Obstacle Removal to Reach Corner', difficulty: 'hard', note: 'Textbook 0-1 BFS.' },
      { slug: 'shortest-path-visiting-all-nodes', number: '847', title: 'Shortest Path Visiting All Nodes', difficulty: 'hard', note: 'Multi-source BFS over (node, mask).' },
    ],
  },
  {
    id: 'bellman-floyd',
    name: 'Bellman-Ford and Floyd-Warshall',
    tagline: 'Limited edges, negative weights, or every pair at once.',
    deps: ['dijkstra'],
    spotIt: [
      '"At most k stops / edges"',
      'Distances between every pair, with n around 100',
      'Ratios or conversions chained through middle nodes',
    ],
    idea:
      'Bellman-Ford relaxes every edge V - 1 times; running only k + 1 rounds, each from a copy of the last round, bounds the number of edges. Floyd-Warshall tries every node k as a middle stop: dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]). k has to be the outer loop.',
    template: `# Bellman-Ford with at most k stops
dist = [inf] * n
dist[src] = 0
for _ in range(k + 1):
    nxt = dist[:]            # copy, or you use this round's updates
    for u, v, w in flights:
        if dist[u] + w < nxt[v]:
            nxt[v] = dist[u] + w
    dist = nxt

# Floyd-Warshall
for k in range(n):
    for i in range(n):
        for j in range(n):
            if d[i][k] + d[k][j] < d[i][j]:
                d[i][j] = d[i][k] + d[k][j]`,
    cppTemplate: `// Bellman-Ford with at most k stops
const int INF = 1e9;
vector<int> dist(n, INF);
dist[src] = 0;
for (int i = 0; i <= k; i++) {
    vector<int> nxt = dist;       // copy, or you use this round's updates
    for (auto& f : flights) {
        int u = f[0], v = f[1], w = f[2];
        if (dist[u] != INF && dist[u] + w < nxt[v])
            nxt[v] = dist[u] + w;
    }
    dist = nxt;
}

// Floyd-Warshall
for (int k = 0; k < n; k++)
    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++)
            if (d[i][k] < INF && d[k][j] < INF && d[i][k] + d[k][j] < d[i][j])
                d[i][j] = d[i][k] + d[k][j];`,
    complexity: 'Bellman-Ford O(k * E). Floyd-Warshall O(V^3).',
    pitfalls: [
      'Updating dist in place during a Bellman-Ford round, which lets one round use many edges.',
      'Putting k on the inside loop in Floyd-Warshall.',
    ],
    problems: [
      { slug: 'cheapest-flights-within-k-stops', number: '787', title: 'Cheapest Flights Within K Stops', difficulty: 'medium', note: 'The anchor for bounded Bellman-Ford.' },
      { slug: 'find-the-city-with-the-smallest-number-of-neighbors-at-a-threshold-distance', number: '1334', title: 'Find the City With the Smallest Number of Neighbors at a Threshold Distance', difficulty: 'medium', note: 'Plain Floyd-Warshall, then count.' },
      { slug: 'course-schedule-iv', number: '1462', title: 'Course Schedule IV', difficulty: 'medium', note: 'Floyd-Warshall over booleans: reachability.' },
      { slug: 'evaluate-division', number: '399', title: 'Evaluate Division', difficulty: 'medium', note: 'Multiply ratios along a path. DFS or Floyd.' },
      { slug: 'minimum-cost-to-convert-string-i', number: '2976', title: 'Minimum Cost to Convert String I', difficulty: 'medium', note: '26 letters as nodes, all pairs once, then sum.' },
    ],
  },
  {
    id: 'advanced',
    name: 'Bridges and Euler paths',
    tagline: "Tarjan's low-link and Hierholzer's walk. Rare, but they show up.",
    deps: ['cycle', 'topological-sort'],
    stretch: true,
    spotIt: [
      '"Critical connection", an edge whose removal disconnects the graph',
      '"Use every edge exactly once", "reconstruct the itinerary"',
      'Build a sequence where each piece chains to the next',
    ],
    idea:
      "Bridges: during DFS record each node's discovery time and the lowest time reachable from its subtree. Edge u-v is a bridge when low[v] > tin[u]. Euler path: start at the node with out-degree one more than in-degree, walk edges and delete them as you go, and append a node to the answer only when it has no edges left. Reverse at the end.",
    template: `# Bridges (Tarjan)
timer = 0
def dfs(u, parent):
    global timer
    tin[u] = low[u] = timer; timer += 1
    for v in graph[u]:
        if v == parent:
            continue
        if tin[v] == -1:
            dfs(v, u)
            low[u] = min(low[u], low[v])
            if low[v] > tin[u]:
                bridges.append([u, v])
        else:
            low[u] = min(low[u], tin[v])

# Euler path (Hierholzer)
def walk(u):
    while graph[u]:
        walk(graph[u].pop())
    path.append(u)
walk(start); path.reverse()`,
    cppTemplate: `// Bridges (Tarjan)
vector<int> tin(n, -1), low(n);
vector<vector<int>> bridges;
int timer = 0;
function<void(int, int)> dfs = [&](int u, int parent) {
    tin[u] = low[u] = timer++;
    for (int v : graph[u]) {
        if (v == parent) continue;
        if (tin[v] == -1) {
            dfs(v, u);
            low[u] = min(low[u], low[v]);
            if (low[v] > tin[u]) bridges.push_back({u, v});
        } else {
            low[u] = min(low[u], tin[v]);
        }
    }
};

// Euler path (Hierholzer)
vector<int> path;
function<void(int)> walk = [&](int u) {
    while (!graph[u].empty()) {
        int v = graph[u].back();
        graph[u].pop_back();
        walk(v);
    }
    path.push_back(u);
};
walk(start);
reverse(path.begin(), path.end());`,
    complexity: 'Both O(V + E).',
    pitfalls: [
      'Skipping the parent by node instead of by edge when there are parallel edges.',
      'Appending in Euler paths before the edges run out. Post-order is the whole trick.',
    ],
    problems: [
      { slug: 'critical-connections-in-a-network', number: '1192', title: 'Critical Connections in a Network', difficulty: 'hard', note: 'Bridges, straight from the template.' },
      { slug: 'minimum-number-of-days-to-disconnect-island', number: '1568', title: 'Minimum Number of Days to Disconnect Island', difficulty: 'hard', note: 'The answer is 0, 1 or 2. Articulation points decide 1.' },
      { slug: 'reconstruct-itinerary', number: '332', title: 'Reconstruct Itinerary', difficulty: 'hard', note: 'Euler path with lexical order: sort, pop from the end.' },
      { slug: 'valid-arrangement-of-pairs', number: '2097', title: 'Valid Arrangement of Pairs', difficulty: 'hard', note: 'Find the start node from degrees, then Hierholzer.' },
      { slug: 'cracking-the-safe', number: '753', title: 'Cracking the Safe', difficulty: 'hard', note: 'De Bruijn sequence as an Euler circuit.' },
    ],
  },
];

/** Problem-statement signal to the pattern that usually answers it. */
export const SIGNALS: Array<{ signal: string; pattern: string; why: string }> = [
  { signal: 'Count groups, islands, provinces', pattern: 'dfs', why: 'Each fresh DFS start is a component.' },
  { signal: 'Cells on the border behave differently', pattern: 'grid', why: 'Flood from the border, then read what is left.' },
  { signal: 'Fewest steps, every move costs the same', pattern: 'bfs', why: 'The first visit in BFS is the shortest.' },
  { signal: 'Many things spread at the same time', pattern: 'bfs', why: 'Multi-source BFS: seed every source.' },
  { signal: 'Split into two teams with no conflict inside', pattern: 'bipartite', why: 'Two-colour it.' },
  { signal: 'Prerequisites, "must come before", build order', pattern: 'topological-sort', why: "Kahn's queue gives the order and the cycle check." },
  { signal: 'Deadlock, safe states, "can it loop forever"', pattern: 'cycle', why: 'Three-colour DFS finds back edges.' },
  { signal: 'Edges arrive over time, "are these connected now"', pattern: 'union-find', why: 'Unions are cheap and never need a rebuild.' },
  { signal: 'Remove one edge to make it a tree', pattern: 'spanning-tree', why: 'The edge DSU refuses is the extra one.' },
  { signal: 'Cheapest way to connect everything', pattern: 'mst', why: 'Kruskal or Prim.' },
  { signal: 'Minimise the largest step along a path', pattern: 'dijkstra', why: 'Dijkstra with max instead of sum, or Kruskal.' },
  { signal: 'Minimum cost, weights differ and are non-negative', pattern: 'dijkstra', why: 'Heap-ordered relaxation.' },
  { signal: 'Grid moves cost 0 or 1', pattern: 'state-bfs', why: '0-1 BFS with a deque.' },
  { signal: 'Remove k obstacles, hold keys, alternate colours', pattern: 'state-bfs', why: 'The node becomes (position, extra state).' },
  { signal: 'Visit all nodes with n up to 12', pattern: 'state-bfs', why: 'BFS over (node, bitmask).' },
  { signal: 'At most k stops, or negative weights', pattern: 'bellman-floyd', why: 'Bellman-Ford rounds cap the edge count.' },
  { signal: 'Every pair of nodes, n around 100', pattern: 'bellman-floyd', why: 'Floyd-Warshall in O(n^3).' },
  { signal: 'Edge whose removal disconnects the graph', pattern: 'advanced', why: 'Tarjan bridges.' },
  { signal: 'Use every edge exactly once', pattern: 'advanced', why: "Hierholzer's Euler path." },
];

const BY_ID = new Map(GRAPH_PATTERNS.map((p) => [p.id, p]));

export function graphPatternById(id: string): GraphPattern | undefined {
  return BY_ID.get(id);
}

/** Every slug the track lists, prerequisites included. Some appear twice. */
export function allGraphSlugs(): Set<string> {
  const slugs = new Set<string>();
  for (const p of PREREQUISITES) for (const w of p.warmups) slugs.add(w.slug);
  for (const p of GRAPH_PATTERNS) for (const q of p.problems) slugs.add(q.slug);
  return slugs;
}

export type PatternState = 'locked' | 'next' | 'active' | 'done';

/**
 * A pattern is done once every problem is ticked. It opens once each
 * prerequisite pattern has at least half its problems ticked.
 */
export function patternStates(done: Record<string, true>): Map<string, PatternState> {
  const solved = (p: GraphPattern) => p.problems.filter((q) => done[q.slug]).length;
  const states = new Map<string, PatternState>();
  for (const p of GRAPH_PATTERNS) {
    const n = solved(p);
    if (n === p.problems.length) states.set(p.id, 'done');
    else if (n > 0) states.set(p.id, 'active');
    else {
      const open = p.deps.every((d) => {
        const dep = BY_ID.get(d);
        return dep ? solved(dep) * 2 >= dep.problems.length : true;
      });
      states.set(p.id, open ? 'next' : 'locked');
    }
  }
  return states;
}

/** Drops anything that is not a known slug mapped to true. */
export function sanitizeGraphDone(raw: unknown): Record<string, true> {
  const out: Record<string, true> = {};
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return out;
  const known = allGraphSlugs();
  for (const [slug, val] of Object.entries(raw)) if (val === true && known.has(slug)) out[slug] = true;
  return out;
}
