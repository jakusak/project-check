// Project taxonomy types based on specification

export type ProjectType =
  | "Business"
  | "Dashboard / Analytics"
  | "Internal Tool"
  | "System / Process";

export type ProjectRole =
  | "Founder"
  | "Lead"
  | "Builder";

export type ProjectMaturity =
  | "Live"
  | "Shipped"
  | "Prototype"
  | "Archived";

export type ProjectScope =
  | "Personal"
  | "Small team"
  | "Organization-wide";

export interface ProjectArtifact {
  type: "image" | "diagram" | "link";
  url: string;
  alt?: string;
  caption?: string;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  role: ProjectRole;
  maturity: ProjectMaturity;
  scope: ProjectScope;

  // Signal line: max 8 words
  signalLine: string;

  // Detail page content (each section: 1-2 lines max)
  context: string;
  constraint: string;
  action: string;
  outcome: string;

  // Artifacts
  artifacts: ProjectArtifact[];

  // Optional metrics
  metrics?: string[];

  // Order for display
  order: number;
}

export interface JourneyPhase {
  id: string;
  period: string;
  title: string;
  description: string; // 1-2 lines max
  order: number;
}

export interface LearnItem {
  id: string;
  title: string;
  description: string; // 1-2 lines max
  url?: string;
  date?: string;
  order: number;
}
