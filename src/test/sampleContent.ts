import type { SiteContent } from "../types";

export const sampleContent: SiteContent = {
  generatedAt: "2026-07-07T00:00:00.000Z",
  tasks: [
    {
      id: "03-react-ui-autocomplete",
      title: "Autocomplete",
      priority: 3,
      category: "React UI",
      level: "middle-senior",
      frequency: "very-high",
      importance: "core",
      slug: "autocomplete",
      statementHtml: "<h2>Task</h2><p>Build autocomplete.</p>",
      walkthroughHtml: "<h2>Walkthrough</h2><p>Explain stale response guard.</p>",
      relatedTheoryIds: ["14-react-forms-controlled-and-uncontrolled-inputs"],
      solutions: [
        {
          level: "junior",
          label: "Junior",
          language: "tsx",
          sourcePath: "tasks/by-priority/03-react-ui-autocomplete/solution.junior.tsx",
          code: "export function Autocomplete() { return null; }",
        },
        {
          level: "middle",
          label: "Middle",
          language: "tsx",
          sourcePath: "tasks/by-priority/03-react-ui-autocomplete/solution.middle.tsx",
          code: "export function Autocomplete() { return <div />; }",
        },
      ],
    },
    {
      id: "27-browser-performance-virtual-list-fixed-height",
      title: "Virtual List Fixed Height",
      priority: 27,
      category: "Browser/Performance",
      level: "middle",
      frequency: "high",
      importance: "core",
      slug: "virtual-list-fixed-height",
      statementHtml: "<h2>Task</h2><p>Render visible rows.</p>",
      walkthroughHtml: "<h2>Walkthrough</h2><p>Use scroll math.</p>",
      relatedTheoryIds: [],
      solutions: [],
    },
  ],
  theory: [
    {
      id: "14-react-forms-controlled-and-uncontrolled-inputs",
      title: "Forms, Controlled and Uncontrolled Inputs",
      priority: 14,
      category: "React",
      level: "middle",
      questionHtml: "<h2>Question</h2><p>What is a controlled input?</p>",
      answerHtml: "<h2>Answers</h2><p>State owns value.</p>",
      relatedTaskIds: ["03-react-ui-autocomplete"],
    },
  ],
  roadmaps: [
    {
      id: "livecoding",
      title: "Livecoding",
      html: "<h1>Livecoding</h1><p>Explain first.</p>",
    },
  ],
};