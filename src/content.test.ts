import { describe, expect, it } from "vitest";
import { buildFilters, filterTasks, rankTaskMatch } from "./content";
import { sampleContent } from "./test/sampleContent";

describe("content helpers", () => {
  it("builds stable category and priority filters from content", () => {
    expect(buildFilters(sampleContent.tasks)).toEqual({
      categories: ["Browser/Performance", "React UI"],
      priorities: [3, 27],
    });
  });

  it("filters tasks by query, category, and priority", () => {
    const filtered = filterTasks(sampleContent.tasks, {
      query: "auto",
      category: "React UI",
      priority: "very-high",
    });

    expect(filtered.map((task) => task.id)).toEqual(["03-react-ui-autocomplete"]);
  });

  it("ranks title matches above category-only matches", () => {
    expect(rankTaskMatch(sampleContent.tasks[0], "autocomplete")).toBeGreaterThan(
      rankTaskMatch(sampleContent.tasks[1], "performance"),
    );
  });
});