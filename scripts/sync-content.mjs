import fs from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import MarkdownIt from "markdown-it";
import { createHighlighter } from "shiki";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const defaultSourceDir = path.resolve(projectRoot, "..", "interview");
const generatedDir = path.join(projectRoot, "src", "generated");
const outputPath = path.join(generatedDir, "site-content.json");

const highlightTheme = "github-dark";
const highlightedLanguages = ["bash", "css", "diff", "html", "js", "jsx", "json", "markdown", "text", "ts", "tsx"];
const highlightedLanguageSet = new Set(highlightedLanguages);
const languageAliases = new Map([
  ["cjs", "js"],
  ["javascript", "js"],
  ["md", "markdown"],
  ["mjs", "js"],
  ["plain", "text"],
  ["plaintext", "text"],
  ["sh", "bash"],
  ["shell", "bash"],
  ["shellscript", "bash"],
  ["txt", "text"],
  ["typescript", "ts"],
]);

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
});

const originalFence = md.renderer.rules.fence;

md.renderer.rules.fence = (tokens, index, options, env, self) => {
  const token = tokens[index];
  if (!env?.highlighter) return renderPlainFence(token);
  return highlightCode(env.highlighter, token.content, token.info);
};

const originalLinkOpen =
  md.renderer.rules.link_open ??
  ((tokens, index, options, env, self) => self.renderToken(tokens, index, options));

md.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index];
  const hrefIndex = token.attrIndex("href");

  if (hrefIndex >= 0) {
    const href = token.attrs[hrefIndex][1];
    const rewritten = rewriteLocalHref(href, env?.sourcePath, env?.routeMap);
    if (rewritten) token.attrs[hrefIndex][1] = rewritten;
  }

  return originalLinkOpen(tokens, index, options, env, self);
};

export async function collectPublicContent({
  sourceDir = process.env.INTERVIEW_SOURCE_DIR ?? defaultSourceDir,
  generatedAt = new Date().toISOString(),
} = {}) {
  const normalizedSourceDir = path.resolve(sourceDir);
  const [taskSources, theorySources, roadmapSources] = await Promise.all([
    collectTaskSources(normalizedSourceDir),
    collectTheorySources(normalizedSourceDir),
    collectRoadmapSources(normalizedSourceDir),
  ]);

  const routeMap = buildRouteMap({
    sourceDir: normalizedSourceDir,
    tasks: taskSources,
    theory: theorySources,
    roadmaps: roadmapSources,
  });

  const highlighter = await createSiteHighlighter();
  const tasks = taskSources.map((source) => renderTaskSource(source, routeMap, highlighter));
  const theory = theorySources.map((source) => renderTheorySource(source, routeMap, highlighter));
  const roadmaps = roadmapSources.map((source) => renderRoadmapSource(source, routeMap, highlighter));

  return { generatedAt, tasks, theory, roadmaps };
}

async function collectTaskSources(sourceDir) {
  const taskRoot = path.join(sourceDir, "tasks", "by-priority");
  const dirs = await sortedDirectories(taskRoot);

  return Promise.all(
    dirs.map(async (dir) => {
      const dirPath = path.join(taskRoot, dir);
      const readmePath = path.join(dirPath, "README.md");
      const walkthroughPath = path.join(dirPath, "walkthrough.md");
      const markdown = await fs.readFile(readmePath, "utf8");
      const walkthroughMarkdown = existsSync(walkthroughPath)
        ? await fs.readFile(walkthroughPath, "utf8")
        : "";
      const meta = parseMetadata(markdown);
      const solutionSources = await collectSolutions(dirPath);

      return {
        id: dir,
        dirPath,
        readmePath,
        walkthroughPath,
        markdown,
        walkthroughMarkdown,
        meta,
        solutionSources,
      };
    }),
  );
}

async function collectTheorySources(sourceDir) {
  const theoryRoot = path.join(sourceDir, "theory", "by-priority");
  const dirs = await sortedDirectories(theoryRoot);

  return Promise.all(
    dirs.map(async (dir) => {
      const readmePath = path.join(theoryRoot, dir, "README.md");
      const markdown = await fs.readFile(readmePath, "utf8");
      return {
        id: dir,
        dirPath: path.dirname(readmePath),
        readmePath,
        markdown,
        meta: parseMetadata(markdown),
      };
    }),
  );
}

async function collectRoadmapSources(sourceDir) {
  const roadmapRoot = path.join(sourceDir, "roadmaps");
  const entries = await fs.readdir(roadmapRoot, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));

  return Promise.all(
    files.map(async (file) => {
      const absolutePath = path.join(roadmapRoot, file);
      const markdown = await fs.readFile(absolutePath, "utf8");
      return {
        id: path.basename(file, ".md"),
        absolutePath,
        markdown,
      };
    }),
  );
}

async function collectSolutions(taskDir) {
  const solutionFiles = [
    ["junior", "Junior", "solution.junior"],
    ["middle", "Middle", "solution.middle"],
    ["senior", "Senior", "solution.senior"],
    ["reference", "Reference", "solution"],
  ];
  const results = [];

  for (const [level, label, basename] of solutionFiles) {
    const file = await findFirstExisting(taskDir, basename, ["tsx", "ts", "jsx", "js"]);
    if (!file) continue;
    results.push({
      level,
      label,
      language: path.extname(file).slice(1),
      sourcePath: toPosix(path.relative(projectRoot, file).replace(/^\.\.\/interview\//, "")),
      code: await fs.readFile(file, "utf8"),
    });
  }

  return results;
}

function renderTaskSource(source, routeMap, highlighter) {
  const title = getTitle(source.markdown) ?? titleFromId(source.id);
  const statementMarkdown = extractSection(source.markdown, "Задача");
  const walkthroughMarkdown =
    extractFromSection(source.walkthroughMarkdown, "Контракт задачи") || source.walkthroughMarkdown;

  return {
    id: source.id,
    title,
    priority: parsePriority(source.id),
    category: source.meta.get("Category") ?? "Other",
    level: source.meta.get("Level") ?? "",
    frequency: source.meta.get("Frequency") ?? "",
    importance: source.meta.get("Importance") ?? "",
    slug: source.meta.get("Slug")?.replace(/^`|`$/g, "") ?? slugWithoutPriority(source.id),
    statementHtml: renderMarkdown(statementMarkdown || source.markdown, source.readmePath, routeMap, highlighter),
    walkthroughHtml: renderMarkdown(walkthroughMarkdown, source.walkthroughPath, routeMap, highlighter),
    solutions: source.solutionSources.map((solution) => ({
      ...solution,
      html: highlightCode(highlighter, solution.code, solution.language),
    })),
    relatedTheoryIds: extractLinkedIds(source.markdown, "theory/by-priority"),
  };
}

function renderTheorySource(source, routeMap, highlighter) {
  const title = getTitle(source.markdown) ?? titleFromId(source.id);
  const answerMarkdown = [
    extractSection(source.markdown, "Ответы по уровням"),
    extractSection(source.markdown, "Example"),
    extractSection(source.markdown, "Interviewer signal"),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    id: source.id,
    title,
    priority: parsePriority(source.id),
    category: source.meta.get("Category") ?? "Other",
    level: source.meta.get("Level") ?? "",
    questionHtml: renderMarkdown(extractSection(source.markdown, "Question") || source.markdown, source.readmePath, routeMap, highlighter),
    answerHtml: renderMarkdown(answerMarkdown || source.markdown, source.readmePath, routeMap, highlighter),
    relatedTaskIds: extractLinkedIds(source.markdown, "tasks/by-priority"),
  };
}

function renderRoadmapSource(source, routeMap, highlighter) {
  return {
    id: source.id,
    title: getTitle(source.markdown) ?? titleFromId(source.id),
    html: renderMarkdown(source.markdown, source.absolutePath, routeMap, highlighter),
  };
}

function buildRouteMap({ sourceDir, tasks, theory, roadmaps }) {
  const map = new Map();
  for (const task of tasks) {
    addPathRoute(map, task.dirPath, `#/tasks/${task.id}`);
    addPathRoute(map, task.readmePath, `#/tasks/${task.id}`);
    addPathRoute(map, task.walkthroughPath, `#/tasks/${task.id}`);
  }
  for (const item of theory) {
    addPathRoute(map, item.dirPath, `#/theory/${item.id}`);
    addPathRoute(map, item.readmePath, `#/theory/${item.id}`);
  }
  for (const roadmap of roadmaps) {
    addPathRoute(map, roadmap.absolutePath, `#/roadmaps/${roadmap.id}`);
  }
  addPathRoute(map, path.join(sourceDir, "tasks", "by-priority", "index.md"), "#/tasks");
  addPathRoute(map, path.join(sourceDir, "theory", "by-priority", "index.md"), "#/theory");
  return map;
}

function addPathRoute(map, absolutePath, route) {
  if (!absolutePath) return;
  const normalized = normalizePathKey(absolutePath);
  map.set(normalized, route);
  map.set(normalized.replace(/\/README\.md$/, ""), route);
}

function renderMarkdown(markdown, sourcePath, routeMap, highlighter) {
  if (!markdown.trim()) return "";
  return md.render(markdown, { sourcePath, routeMap, highlighter });
}

async function createSiteHighlighter() {
  return createHighlighter({
    themes: [highlightTheme],
    langs: highlightedLanguages,
  });
}

function highlightCode(highlighter, code, language) {
  return highlighter.codeToHtml(code.trimEnd(), {
    theme: highlightTheme,
    lang: normalizeLanguage(language),
  });
}

function normalizeLanguage(language) {
  const raw = String(language || "text")
    .trim()
    .split(/\s+/)[0]
    .replace(/^language-/, "")
    .toLowerCase();
  const aliased = languageAliases.get(raw) ?? raw;
  return highlightedLanguageSet.has(aliased) ? aliased : "text";
}

function renderPlainFence(token) {
  if (originalFence) return originalFence([token], 0, {}, {}, md.renderer);
  const language = normalizeLanguage(token.info);
  const className = language === "text" ? "" : ` class="language-${md.utils.escapeHtml(language)}"`;
  return `<pre><code${className}>${md.utils.escapeHtml(token.content)}</code></pre>\n`;
}

function rewriteLocalHref(href, sourcePath, routeMap) {
  if (!sourcePath || !routeMap || !href || href.startsWith("#")) return null;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return null;

  const [hrefPath, hash = ""] = href.split("#");
  const resolved = normalizePathKey(path.resolve(path.dirname(sourcePath), hrefPath || "."));
  const route = routeMap.get(resolved) ?? routeMap.get(resolved.replace(/\/README\.md$/, ""));
  if (!route) return null;
  return hash ? `${route}#${hash}` : route;
}

function parseMetadata(markdown) {
  const meta = new Map();
  for (const line of markdown.split("\n")) {
    if (line.startsWith("## ")) break;
    const match = line.match(/^- ([^:]+):\s*(.+)$/);
    if (match) meta.set(match[1].trim(), match[2].trim());
  }
  return meta;
}

function getTitle(markdown) {
  return markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
}

function extractSection(markdown, title) {
  const pattern = new RegExp(`^##\\s+${escapeRegExp(title)}\\s*$`, "m");
  const match = pattern.exec(markdown);
  if (!match) return "";
  const start = match.index;
  const rest = markdown.slice(start + match[0].length);
  const next = rest.search(/^##\s+/m);
  return `${match[0]}${next >= 0 ? rest.slice(0, next) : rest}`.trim();
}

function extractFromSection(markdown, title) {
  const section = extractSection(markdown, title);
  if (!section) return "";
  return markdown.slice(markdown.indexOf(section)).trim();
}

function extractLinkedIds(markdown, rootSegment) {
  const ids = new Set();
  const escaped = escapeRegExp(rootSegment);
  const regex = new RegExp(`${escaped}/([^/)#\\s]+)`, "g");
  let match;
  while ((match = regex.exec(markdown))) ids.add(match[1].replace(/\/$/, ""));
  return [...ids].sort((left, right) => left.localeCompare(right, "en"));
}

async function sortedDirectories(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right, "en"));
}

async function findFirstExisting(dir, basename, extensions) {
  for (const extension of extensions) {
    const candidate = path.join(dir, `${basename}.${extension}`);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function parsePriority(id) {
  return Number(id.match(/^(\d+)/)?.[1] ?? 0);
}

function slugWithoutPriority(id) {
  return id.replace(/^\d+-/, "").replace(/^(react-ui|react-hooks|js-core|async|typescript|browser-performance|mini-features)-/, "");
}

function titleFromId(id) {
  return id
    .replace(/^\d+-/, "")
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizePathKey(file) {
  return path.resolve(file).replace(/\\/g, "/").replace(/\/$/, "");
}

function toPosix(file) {
  return file.replace(/\\/g, "/");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  const content = await collectPublicContent();
  await fs.mkdir(generatedDir, { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
  console.log(`Synced ${content.tasks.length} tasks, ${content.theory.length} theory pages, ${content.roadmaps.length} roadmaps`);
  console.log(path.relative(projectRoot, outputPath));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
