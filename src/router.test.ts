import { describe, expect, it } from "vitest";
import { formatRoute, parseRoute } from "./router";

describe("hash router", () => {
  it("parses task routes from GitHub Pages hash URLs", () => {
    expect(parseRoute("#/tasks/03-react-ui-autocomplete")).toEqual({
      section: "tasks",
      id: "03-react-ui-autocomplete",
    });
  });

  it("falls back to tasks for missing or unknown hashes", () => {
    expect(parseRoute("")).toEqual({ section: "tasks" });
    expect(parseRoute("#/unknown/path")).toEqual({ section: "tasks" });
  });

  it("formats stable hash routes", () => {
    expect(formatRoute({ section: "theory", id: "14-react-forms" })).toBe(
      "#/theory/14-react-forms",
    );
  });
});