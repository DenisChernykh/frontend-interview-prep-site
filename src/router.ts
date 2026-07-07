export type Section = "tasks" | "theory" | "roadmaps";

export type AppRoute = {
  section: Section;
  id?: string;
};

const sections = new Set<Section>(["tasks", "theory", "roadmaps"]);

export function parseRoute(hash: string): AppRoute {
  const clean = hash.replace(/^#\/?/, "").split(/[?#]/)[0];
  const [sectionCandidate, id] = clean.split("/").filter(Boolean);
  if (!sections.has(sectionCandidate as Section)) return { section: "tasks" };
  return id ? { section: sectionCandidate as Section, id } : { section: sectionCandidate as Section };
}

export function formatRoute(route: AppRoute) {
  return route.id ? `#/${route.section}/${route.id}` : `#/${route.section}`;
}
