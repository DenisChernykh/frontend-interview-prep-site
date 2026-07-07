export type SolutionLevel = "junior" | "middle" | "senior" | "reference";

export type SolutionDoc = {
  level: SolutionLevel;
  label: string;
  language: string;
  sourcePath: string;
  code: string;
  html: string;
};

export type TaskDoc = {
  id: string;
  title: string;
  priority: number;
  category: string;
  level: string;
  frequency: string;
  importance: string;
  slug: string;
  statementHtml: string;
  walkthroughHtml: string;
  solutions: SolutionDoc[];
  relatedTheoryIds: string[];
};

export type TheoryDoc = {
  id: string;
  title: string;
  priority: number;
  category: string;
  level: string;
  questionHtml: string;
  answerHtml: string;
  relatedTaskIds: string[];
};

export type RoadmapDoc = {
  id: string;
  title: string;
  html: string;
};

export type SiteContent = {
  generatedAt: string;
  tasks: TaskDoc[];
  theory: TheoryDoc[];
  roadmaps: RoadmapDoc[];
};