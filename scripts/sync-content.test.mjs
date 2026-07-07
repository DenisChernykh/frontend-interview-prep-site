import { existsSync } from "node:fs";

import { describe, expect, it } from "vitest";
import { collectPublicContent } from "./sync-content.mjs";

const localSourceAvailable = existsSync("/Users/denischernykh/Documents/interview/tasks/by-priority");

describe.skipIf(!localSourceAvailable)("sync-content", () => {
  it("collects public reader content without local practice files", async () => {
    const content = await collectPublicContent({
      sourceDir: "/Users/denischernykh/Documents/interview",
      generatedAt: "2026-07-07T00:00:00.000Z",
    });

    expect(content.theory).toHaveLength(81);
    expect(content.tasks).toHaveLength(57);
    expect(content.roadmaps.length).toBeGreaterThan(0);
    expect(content.tasks[0].solutions.map((solution) => solution.level)).toEqual([
      "junior",
      "middle",
      "senior",
      "reference",
    ]);
    const serialized = JSON.stringify(content);
    expect(serialized).not.toContain("attempts/");
    expect(serialized).not.toContain("practice.test");
    expect(serialized).not.toContain("solution.test");
    expect(serialized).not.toContain("frontend-interview-theory-tasks-mobile.pdf");
  });
});