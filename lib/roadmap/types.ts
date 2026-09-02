export type Level = 'F' | 'C' | 'A';
export type TrackId = 'scratch' | 'swe' | 'prod' | 'hld' | 'lld' | 'dsa';
export type PlanId = 'scratch30' | 'agentic30';
export type ProjectTier = 'starter' | 'core' | 'flagship';
export type ProjectStatus = 'building' | 'done';

export interface ResourceLink {
  t: string;
  u: string;
}

export interface TrackNode {
  id: string;
  t: string;
  x: number;
  y: number;
  lv: Level;
  h: number;
  s: string;
  learn: string[];
  tools: string[];
  proj: string;
  res: ResourceLink[];
  deps: string[];
}

export interface Track {
  id: TrackId;
  name: string;
  emoji: string;
  blurb: string;
  nodes: TrackNode[];
}

export interface PlanDay {
  d: number;
  title: string;
  focus: string;
  hours: number;
  tasks: string[];
  res?: ResourceLink[];
}

export interface Plan {
  id: PlanId;
  name: string;
  emoji: string;
  blurb: string;
  days: PlanDay[];
}

export interface Project {
  id: string;
  name: string;
  tier: ProjectTier;
  tracks: TrackId[];
  hours: number;
  pitch: string;
  proves: string[];
  stack: string[];
  milestones: string[];
  stretch: string;
  res: ResourceLink[];
}
