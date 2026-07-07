import type { TaskDoc } from "./types";

export type TaskFilters = {
  query: string;
  category: string;
  priority: string;
};

export function buildFilters(tasks: TaskDoc[]) {
  return {
    categories: [...new Set(tasks.map((task) => task.category))].sort((left, right) => left.localeCompare(right)),
    priorities: [...new Set(tasks.map((task) => task.priority))].sort((left, right) => left - right),
  };
}

export function filterTasks(tasks: TaskDoc[], filters: TaskFilters) {
  const query = normalize(filters.query);
  return tasks
    .filter((task) => {
      if (filters.category && filters.category !== "all" && task.category !== filters.category) return false;
      if (filters.priority && filters.priority !== "all") {
        const normalizedPriority = normalize(filters.priority);
        const matchesPriority =
          String(task.priority) === normalizedPriority ||
          normalize(task.frequency) === normalizedPriority ||
          normalize(task.importance) === normalizedPriority;
        if (!matchesPriority) return false;
      }
      return !query || rankTaskMatch(task, query) > 0;
    })
    .sort((left, right) => {
      const rankDelta = rankTaskMatch(right, query) - rankTaskMatch(left, query);
      return rankDelta || left.priority - right.priority;
    });
}

export function rankTaskMatch(task: TaskDoc, rawQuery: string) {
  const query = normalize(rawQuery);
  if (!query) return 1;
  if (normalize(task.title).includes(query)) return 100;
  if (normalize(task.slug).includes(query)) return 85;
  if (String(task.priority) === query) return 70;
  if (normalize(task.category).includes(query)) return 45;
  if (normalize(task.level).includes(query)) return 35;
  if (normalize(task.frequency).includes(query)) return 25;
  return 0;
}

export function priorityLabel(value: string) {
  if (!value || value === "all") return "Priority";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalize(value: string | number) {
  return String(value).trim().toLowerCase();
}
