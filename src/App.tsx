import { useEffect, useMemo, useState } from "react";

import { filterTasks, priorityLabel } from "./content";
import generatedContent from "./generated/site-content.json";
import { formatRoute, parseRoute, type AppRoute, type Section } from "./router";
import type { RoadmapDoc, SiteContent, SolutionDoc, TaskDoc, TheoryDoc } from "./types";

const defaultContent = generatedContent as SiteContent;
const priorityFilters = ["all", "very-high", "high", "medium", "focused"];
const navItems: Array<{ section: Section; label: string; icon: string }> = [
  { section: "tasks", label: "Tasks", icon: "list" },
  { section: "theory", label: "Theory", icon: "book" },
  { section: "roadmaps", label: "Roadmaps", icon: "map" },
];

type AppProps = {
  content?: SiteContent;
  initialHash?: string;
};

type DetailTab = "task" | "solution" | "walkthrough";

export function App({ content = defaultContent, initialHash }: AppProps) {
  const [route, setRoute] = useState<AppRoute>(() => parseRoute(initialHash ?? window.location.hash));
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [priority, setPriority] = useState("all");
  const [detailTab, setDetailTab] = useState<DetailTab>("task");
  const [solutionLevel, setSolutionLevel] = useState<string>("junior");

  useEffect(() => {
    if (initialHash !== undefined) return;
    const syncHash = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, [initialHash]);

  const categories = useMemo(
    () => [...new Set(content.tasks.map((task) => task.category))].sort((left, right) => left.localeCompare(right)),
    [content.tasks],
  );
  const visibleTasks = useMemo(
    () => filterTasks(content.tasks, { query, category, priority }),
    [category, content.tasks, priority, query],
  );

  const selectedTask = selectByRoute(content.tasks, route, visibleTasks[0]);
  const selectedTheory = selectByRoute(content.theory, route, content.theory[0]);
  const selectedRoadmap = selectByRoute(content.roadmaps, route, content.roadmaps[0]);

  useEffect(() => {
    setDetailTab("task");
    setSolutionLevel("junior");
  }, [selectedTask?.id]);

  function navigate(nextRoute: AppRoute) {
    setRoute(nextRoute);
    if (initialHash === undefined) window.location.hash = formatRoute(nextRoute);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Content browser">
        <header className="app-header">
          <h1>Frontend Interview Prep</h1>
          <label className="search-field">
            <span className="visually-hidden">Search</span>
            <Icon name="search" />
            <input
              aria-label="Search"
              type="search"
              value={query}
              placeholder="Search"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </header>

        <PrimaryNav route={route} navigate={navigate} />

        {route.section === "tasks" ? (
          <div className="filters" aria-label="Task filters">
            <label>
              <span className="visually-hidden">Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                {priorityFilters.map((item) => (
                  <option key={item} value={item}>
                    {priorityLabel(item)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="visually-hidden">Category</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">Category</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="icon-button"
              type="button"
              aria-label="Clear filters"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setPriority("all");
              }}
            >
              <Icon name="filter" />
            </button>
          </div>
        ) : null}

        <BrowserList
          section={route.section}
          tasks={visibleTasks}
          theory={content.theory}
          roadmaps={content.roadmaps}
          route={route}
          navigate={navigate}
        />
      </aside>

      <main className="detail-pane">
        {route.section === "tasks" && selectedTask ? (
          <TaskDetail
            task={selectedTask}
            tab={detailTab}
            solutionLevel={solutionLevel}
            onTabChange={setDetailTab}
            onSolutionLevelChange={setSolutionLevel}
          />
        ) : null}
        {route.section === "theory" && selectedTheory ? <TheoryDetail theory={selectedTheory} /> : null}
        {route.section === "roadmaps" && selectedRoadmap ? <RoadmapDetail roadmap={selectedRoadmap} /> : null}
      </main>

    </div>
  );
}

function PrimaryNav({ route, navigate }: { route: AppRoute; navigate: (route: AppRoute) => void }) {
  return (
    <nav className="primary-nav" aria-label="Primary">
      {navItems.map((item) => (
        <a
          key={item.section}
          href={formatRoute({ section: item.section })}
          aria-current={route.section === item.section ? "page" : undefined}
          onClick={(event) => {
            event.preventDefault();
            navigate({ section: item.section });
          }}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </a>
      ))}
    </nav>
  );
}

function BrowserList({
  section,
  tasks,
  theory,
  roadmaps,
  route,
  navigate,
}: {
  section: Section;
  tasks: TaskDoc[];
  theory: TheoryDoc[];
  roadmaps: RoadmapDoc[];
  route: AppRoute;
  navigate: (route: AppRoute) => void;
}) {
  if (section === "theory") {
    return (
      <section className="browser-section">
        <h2>Theory</h2>
        <ul className="doc-list" aria-label="Theory">
          {theory.map((item) => (
            <DocListItem
              key={item.id}
              active={route.id === item.id}
              title={item.title}
              badge={String(item.priority).padStart(2, "0")}
              meta={`${item.category}  •  ${item.level}`}
              onClick={() => navigate({ section: "theory", id: item.id })}
            />
          ))}
        </ul>
      </section>
    );
  }

  if (section === "roadmaps") {
    return (
      <section className="browser-section">
        <h2>Roadmaps</h2>
        <ul className="doc-list" aria-label="Roadmaps">
          {roadmaps.map((item, index) => (
            <DocListItem
              key={item.id}
              active={route.id === item.id}
              title={item.title}
              badge={String(index + 1).padStart(2, "0")}
              meta="Study path"
              onClick={() => navigate({ section: "roadmaps", id: item.id })}
            />
          ))}
        </ul>
      </section>
    );
  }

  return (
    <section className="browser-section">
      <h2>Tasks</h2>
      <ul className="doc-list" aria-label="Tasks">
        {tasks.map((task) => (
          <DocListItem
            key={task.id}
            active={route.id === task.id}
            title={task.title}
            badge={String(task.priority).padStart(2, "0")}
            meta={`${task.category}  •  ${task.level}`}
            onClick={() => navigate({ section: "tasks", id: task.id })}
          />
        ))}
      </ul>
    </section>
  );
}

function DocListItem({
  title,
  badge,
  meta,
  active,
  onClick,
}: {
  title: string;
  badge: string;
  meta: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <li>
      <button className={`doc-row${active ? " is-active" : ""}`} type="button" onClick={onClick}>
        <span className="priority-badge">{badge}</span>
        <span className="doc-row-main">
          <strong>{title}</strong>
          <span>{meta}</span>
        </span>
        <Icon name="chevron" />
      </button>
    </li>
  );
}

function TaskDetail({
  task,
  tab,
  solutionLevel,
  onTabChange,
  onSolutionLevelChange,
}: {
  task: TaskDoc;
  tab: DetailTab;
  solutionLevel: string;
  onTabChange: (tab: DetailTab) => void;
  onSolutionLevelChange: (level: string) => void;
}) {
  const selectedSolution =
    task.solutions.find((solution) => solution.level === solutionLevel) ?? task.solutions[0];

  useEffect(() => {
    if (selectedSolution && !task.solutions.some((solution) => solution.level === solutionLevel)) {
      onSolutionLevelChange(selectedSolution.level);
    }
  }, [onSolutionLevelChange, selectedSolution, solutionLevel, task.solutions]);

  return (
    <article className="detail-content task-detail">
      <div className="title-block">
        <h2>{task.title}</h2>
        <p>
          {task.category} <span>•</span> {task.level} <span>•</span> {task.frequency}
        </p>
      </div>

      <div className="tabs" role="tablist" aria-label="Task sections">
        <TabButton active={tab === "task"} onClick={() => onTabChange("task")}>Task</TabButton>
        <TabButton active={tab === "solution"} onClick={() => onTabChange("solution")}>Solution</TabButton>
        <TabButton active={tab === "walkthrough"} onClick={() => onTabChange("walkthrough")}>Walkthrough</TabButton>
      </div>

      {tab === "solution" && task.solutions.length > 0 ? (
        <div className="level-switch" aria-label="Answer level">
          {task.solutions.map((solution) => (
            <button
              key={solution.level}
              type="button"
              aria-pressed={selectedSolution?.level === solution.level}
              onClick={() => onSolutionLevelChange(solution.level)}
            >
              {solution.label}
            </button>
          ))}
        </div>
      ) : null}

      {tab === "task" ? <MarkdownHtml html={task.statementHtml} /> : null}
      {tab === "walkthrough" ? <MarkdownHtml html={task.walkthroughHtml} /> : null}
      {tab === "solution" ? <SolutionPanel solution={selectedSolution} /> : null}
    </article>
  );
}

function TheoryDetail({ theory }: { theory: TheoryDoc }) {
  return (
    <article className="detail-content">
      <div className="title-block">
        <h2>{theory.title}</h2>
        <p>
          {theory.category} <span>•</span> {theory.level}
        </p>
      </div>
      <MarkdownHtml html={theory.questionHtml} />
      <MarkdownHtml html={theory.answerHtml} />
    </article>
  );
}

function RoadmapDetail({ roadmap }: { roadmap: RoadmapDoc }) {
  return (
    <article className="detail-content">
      <MarkdownHtml html={roadmap.html} />
    </article>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: string }) {
  return (
    <button type="button" role="tab" aria-selected={active} onClick={onClick}>
      {children}
    </button>
  );
}

function SolutionPanel({ solution }: { solution?: SolutionDoc }) {
  if (!solution) return <p className="empty-state">No readable solution is available for this task.</p>;
  return (
    <section className="solution-panel" aria-label={`${solution.label} solution`}>
      <div className="source-path">{solution.sourcePath}</div>
      <pre>
        <code>{solution.code}</code>
      </pre>
    </section>
  );
}

function MarkdownHtml({ html }: { html: string }) {
  return <div className="markdown-body" dangerouslySetInnerHTML={{ __html: html }} />;
}

function selectByRoute<T extends { id: string }>(items: T[], route: AppRoute, fallback?: T) {
  return items.find((item) => item.id === route.id) ?? fallback;
}

function Icon({ name }: { name: string }) {
  if (name === "search") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m16.5 16.5 4 4" />
      </svg>
    );
  }
  if (name === "filter") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16l-6 7v5l-4 2v-7z" />
      </svg>
    );
  }
  if (name === "chevron") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m9 6 6 6-6 6" />
      </svg>
    );
  }
  if (name === "book") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z" />
        <path d="M5 5.5v16" />
      </svg>
    );
  }
  if (name === "map") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7v13l5-3 6 3 5-3V4l-5 3-6-3z" />
        <path d="M9 4v13" />
        <path d="M15 7v13" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 6h13" />
      <path d="M8 12h13" />
      <path d="M8 18h13" />
      <path d="M3 6h.01" />
      <path d="M3 12h.01" />
      <path d="M3 18h.01" />
    </svg>
  );
}
