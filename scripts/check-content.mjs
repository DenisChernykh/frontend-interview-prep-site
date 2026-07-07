import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const contentPath = path.join(projectRoot, "src", "generated", "site-content.json");
const forbidden = [
  "attempts/",
  "starter.ts",
  "starter.tsx",
  "practice.test",
  "solution.test",
  "tmp/pdfs",
  "output/pdf",
  "output/anki",
  "frontend-interview-theory-tasks",
];

async function main() {
  const raw = await fs.readFile(contentPath, "utf8");
  const content = JSON.parse(raw);
  assert(content.tasks.length === 57, `Expected 57 tasks, found ${content.tasks.length}`);
  assert(content.theory.length === 81, `Expected 81 theory pages, found ${content.theory.length}`);
  assert(content.roadmaps.length >= 1, "Expected at least one roadmap");

  const serialized = JSON.stringify(content);
  for (const token of forbidden) {
    assert(!serialized.includes(token), `Forbidden public token leaked: ${token}`);
  }

  const taskIds = new Set(content.tasks.map((task) => task.id));
  const theoryIds = new Set(content.theory.map((item) => item.id));

  for (const task of content.tasks) {
    assert(task.statementHtml, `Task ${task.id} is missing statementHtml`);
    assert(task.walkthroughHtml, `Task ${task.id} is missing walkthroughHtml`);
    assert(task.solutions.length >= 1, `Task ${task.id} has no readable solution`);
    for (const solution of task.solutions) {
      assert(solution.code, `Task ${task.id} solution ${solution.level} is missing code`);
      assert(solution.html?.includes('class="shiki'), `Task ${task.id} solution ${solution.level} is missing highlighted HTML`);
    }
    for (const id of task.relatedTheoryIds) {
      assert(theoryIds.has(id), `Task ${task.id} links missing theory ${id}`);
    }
  }

  for (const item of content.theory) {
    assert(item.questionHtml, `Theory ${item.id} is missing questionHtml`);
    assert(item.answerHtml, `Theory ${item.id} is missing answerHtml`);
    for (const id of item.relatedTaskIds) {
      assert(taskIds.has(id), `Theory ${item.id} links missing task ${id}`);
    }
  }

  console.log(`Verified public content: ${content.tasks.length} tasks, ${content.theory.length} theory pages, ${content.roadmaps.length} roadmaps`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
