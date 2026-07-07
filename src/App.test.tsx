import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { sampleContent } from "./test/sampleContent";

describe("App", () => {
  it("renders a mobile reader with searchable tasks and detail tabs", async () => {
    const user = userEvent.setup();
    render(<App content={sampleContent} initialHash="#/tasks/03-react-ui-autocomplete" />);

    expect(screen.getByRole("heading", { name: "Frontend Interview Prep" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Search" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Autocomplete" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Solution" }));
    expect(screen.getByRole("tab", { name: "Solution", selected: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Junior" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/export function Autocomplete/)).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Walkthrough" }));
    expect(screen.getByText("Explain stale response guard.")).toBeInTheDocument();
  });

  it("filters visible tasks from the search box", async () => {
    const user = userEvent.setup();
    render(<App content={sampleContent} initialHash="#/tasks" />);

    await user.type(screen.getByRole("searchbox", { name: "Search" }), "virtual");

    const list = screen.getByRole("list", { name: "Tasks" });
    expect(within(list).queryByText("Autocomplete")).not.toBeInTheDocument();
    expect(within(list).getByText("Virtual List Fixed Height")).toBeInTheDocument();
  });

  it("switches between Tasks, Theory, and Roadmaps sections", async () => {
    const user = userEvent.setup();
    render(<App content={sampleContent} initialHash="#/tasks" />);

    await user.click(screen.getByRole("link", { name: "Theory" }));
    expect(screen.getByRole("heading", { name: "Forms, Controlled and Uncontrolled Inputs" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Roadmaps" }));
    expect(screen.getByRole("heading", { name: "Livecoding" })).toBeInTheDocument();
  });
});