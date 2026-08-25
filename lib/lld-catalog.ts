export interface LLDConcept {
  title: string;
  body: string;
}

export interface LLDPattern {
  name: string;
  category: 'Creational' | 'Structural' | 'Behavioral';
  summary: string;
}

export interface LLDResourceLink {
  label: string;
  href: string;
  note: string;
}

export interface LLDProblem {
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  patterns: string[];
  summary: string;
}

/** The OOP fundamentals every LLD problem below assumes you already have. */
export const CORE_CONCEPTS: LLDConcept[] = [
  {
    title: 'Encapsulation',
    body: "Bundle an object's data with the methods that operate on it, and hide the data behind those methods. Callers change state through behavior, never by reaching into fields directly.",
  },
  {
    title: 'Abstraction',
    body: 'Expose what an object does, not how. An interface or abstract class names the operations; the concrete class is free to change its internals without breaking callers.',
  },
  {
    title: 'Inheritance',
    body: 'Model an "is-a" relationship so a subtype can be used wherever its parent is expected. Reach for it far less often than composition — it locks in a relationship at compile time.',
  },
  {
    title: 'Polymorphism',
    body: 'The same call resolves to different behavior depending on the concrete object behind an interface. This is the mechanism that makes most design patterns possible.',
  },
];

/** SOLID: the five principles almost every LLD interview rubric checks for. */
export const SOLID_PRINCIPLES: LLDConcept[] = [
  {
    title: 'S — Single Responsibility',
    body: 'A class should have exactly one reason to change. If describing a class needs "and", it is probably two classes.',
  },
  {
    title: 'O — Open/Closed',
    body: 'Open for extension, closed for modification. Add a new payment method by adding a new class, not by editing an existing switch statement.',
  },
  {
    title: 'L — Liskov Substitution',
    body: 'A subclass must be usable anywhere its parent is, without the caller needing to know the difference. A Square that breaks Rectangle.setWidth() violates this.',
  },
  {
    title: 'I — Interface Segregation',
    body: 'Prefer several small, specific interfaces over one large one. A class should never be forced to implement a method it has no use for.',
  },
  {
    title: 'D — Dependency Inversion',
    body: 'Depend on abstractions, not concrete classes. A NotificationService should depend on a Sender interface, not directly on EmailSender.',
  },
];

/** The design patterns that keep showing up across the problems below. */
export const COMMON_PATTERNS: LLDPattern[] = [
  { name: 'Singleton', category: 'Creational', summary: 'Exactly one instance, globally accessible — a connection pool, a config store.' },
  { name: 'Factory', category: 'Creational', summary: 'Centralize object creation so callers ask for "a vehicle" without knowing the concrete class.' },
  { name: 'Builder', category: 'Creational', summary: 'Construct a complex object step by step; useful when a constructor would need a dozen optional parameters.' },
  { name: 'Strategy', category: 'Behavioral', summary: 'Swap an algorithm at runtime — different fare calculations, different sort orders — behind one interface.' },
  { name: 'Observer', category: 'Behavioral', summary: 'One-to-many: when the subject changes, every registered observer is notified. Notifications, event buses.' },
  { name: 'State', category: 'Behavioral', summary: "An object's behavior changes with its internal state, and each state is its own class instead of a pile of if-statements." },
  { name: 'Decorator', category: 'Structural', summary: 'Attach new behavior to an object at runtime by wrapping it, without touching its class — toppings on a pizza.' },
  { name: 'Command', category: 'Behavioral', summary: 'Wrap a request as an object so it can be queued, logged, or undone — undo/redo stacks, job queues.' },
  { name: 'Composite', category: 'Structural', summary: 'Treat a single object and a group of objects through the same interface — a file and a folder full of files.' },
  { name: 'Adapter', category: 'Structural', summary: "Translate one interface into another the client expects, without changing either side's source." },
];

/** Confident, stable, external entry points — everything else is written in-app above. */
export const EXTERNAL_RESOURCES: LLDResourceLink[] = [
  {
    label: 'Refactoring.Guru — Design Patterns',
    href: 'https://refactoring.guru/design-patterns',
    note: 'The clearest illustrated catalog of the classic Gang of Four patterns, in any language.',
  },
  {
    label: 'awesome-low-level-design (GitHub)',
    href: 'https://github.com/ashishps1/awesome-low-level-design',
    note: 'A large, community-maintained list of LLD interview problems with reference solutions.',
  },
  {
    label: 'take U forward — YouTube',
    href: 'https://www.youtube.com/@takeUforward',
    note: "Striver's channel; search it for the LLD playlist alongside the DSA sheet content.",
  },
];

/**
 * The standard LLD interview problem set — the same ~15 problems that show
 * up across most sheets, including Striver's, roughly ordered easy to hard.
 * Not scraped from any single source: this is the well-established common
 * core of "machine coding round" practice.
 */
export const LLD_PROBLEMS: LLDProblem[] = [
  { title: 'Design a Parking Lot', difficulty: 'easy', patterns: ['Strategy', 'Factory'], summary: 'Multiple spot sizes, multiple vehicle types, and a pricing strategy that varies by duration.' },
  { title: 'Design a Vending Machine', difficulty: 'easy', patterns: ['State'], summary: 'Idle, has-money, dispensing, out-of-stock — a textbook state machine.' },
  { title: 'Design Tic-Tac-Toe', difficulty: 'easy', patterns: ['Strategy'], summary: 'A pluggable win-checking strategy so the board size can change without touching game logic.' },
  { title: 'Design Snake and Ladder', difficulty: 'easy', patterns: ['Strategy', 'Observer'], summary: 'Board setup, dice rolling, and player turns as separate, testable responsibilities.' },
  { title: 'Design a Library Management System', difficulty: 'medium', patterns: ['Factory', 'Observer'], summary: 'Books, members, holds, and fines, with due-date notifications as observers.' },
  { title: 'Design an Elevator System', difficulty: 'medium', patterns: ['State', 'Strategy'], summary: 'Multiple elevators, a dispatch strategy, and each car modeled as its own state machine.' },
  { title: 'Design a Logging Framework', difficulty: 'medium', patterns: ['Singleton', 'Decorator', 'Strategy'], summary: 'Log levels, multiple output sinks, and formatting layered on with decorators.' },
  { title: 'Design an LRU Cache', difficulty: 'medium', patterns: ['Strategy'], summary: 'A hash map plus a doubly linked list — more a data-structure design than an OOP one, and still asked constantly.' },
  { title: 'Design a Rate Limiter', difficulty: 'medium', patterns: ['Strategy'], summary: 'Token bucket vs. sliding window as interchangeable strategies behind one interface.' },
  { title: 'Design Splitwise', difficulty: 'hard', patterns: ['Strategy', 'Observer'], summary: 'Equal, exact, and percentage splits as strategies; balances update as an observed side effect of each expense.' },
  { title: 'Design a Chess Game', difficulty: 'hard', patterns: ['Strategy', 'Factory', 'Command'], summary: 'Per-piece movement rules as strategies, and moves as commands so undo comes for free.' },
  { title: 'Design BookMyShow (Movie Ticket Booking)', difficulty: 'hard', patterns: ['Singleton', 'Factory', 'Observer'], summary: 'Seat locking under concurrency is the real problem here, not the class diagram.' },
  { title: 'Design a Notification System', difficulty: 'medium', patterns: ['Observer', 'Strategy', 'Decorator'], summary: 'Email, SMS, and push as interchangeable senders, with retry and formatting layered on.' },
  { title: 'Design a Food Delivery App', difficulty: 'hard', patterns: ['Strategy', 'Observer', 'State'], summary: 'Order state machine, delivery-partner assignment strategy, and live status as observed events.' },
  { title: 'Design a Car Rental System', difficulty: 'medium', patterns: ['Factory', 'Strategy'], summary: 'Vehicle categories, availability search, and a pricing strategy that varies by rental duration.' },
];
