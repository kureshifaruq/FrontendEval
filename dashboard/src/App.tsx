import {
  ChevronDown,
  ClipboardCheck,
  Code2,
  LayoutDashboard,
  ListChecks,
  Menu,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { EvalDataError, loadDashboardBundle } from "./data/evalApi";
import { buildTaskViews, pad2 } from "./data/format";
import { CodeReviewPage } from "./pages/CodeReviewPage";
import { MethodologyPage } from "./pages/MethodologyPage";
import { OverviewPage } from "./pages/OverviewPage";
import { TasksPage } from "./pages/TasksPage";
import type { DashboardBundle } from "./types";

type Page = "Overview" | "Benchmark Tasks" | "Code Review" | "Methodology";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardBundle };

function App() {
  const [activePage, setActivePage] = useState<Page>("Overview");
  const [search, setSearch] = useState("");
  const [selectedTask, setSelectedTask] = useState("FE-001");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();

    loadDashboardBundle(controller.signal)
      .then((data) => {
        setLoadState({ status: "ready", data });
        if (data.tasks.length > 0) {
          setSelectedTask((current) =>
            data.tasks.some((task) => task.id === current)
              ? current
              : data.tasks[0].id,
          );
        }
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        const message =
          error instanceof EvalDataError
            ? error.message
            : error instanceof Error
              ? error.message
              : "Failed to load evaluation data";
        setLoadState({ status: "error", message });
      });

    return () => controller.abort();
  }, []);

  const taskViews = useMemo(
    () => (loadState.status === "ready" ? buildTaskViews(loadState.data) : []),
    [loadState],
  );

  const filteredTasks = taskViews.filter((task) =>
    `${task.definition.id} ${task.definition.title} ${task.definition.category}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  const navigation: {
    label: Page;
    icon: typeof LayoutDashboard;
  }[] = [
    { label: "Overview", icon: LayoutDashboard },
    { label: "Benchmark Tasks", icon: ListChecks },
    { label: "Code Review", icon: Code2 },
    { label: "Methodology", icon: ClipboardCheck },
  ];

  const openReview = (id: string) => {
    setSelectedTask(id);
    setActivePage("Code Review");
    setSidebarOpen(false);
  };

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="mobile-overlay"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <Sparkles size={21} />
          </div>
          <div>
            <div className="brand-name">FrontendEval</div>
            <div className="brand-caption">AI evaluation platform</div>
          </div>
          <button
            className="icon-button mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <div className="workspace-card">
          <div className="workspace-avatar">FE</div>
          <div className="workspace-info">
            <strong>Frontend Evaluation</strong>
            <span>Personal workspace</span>
          </div>
          <ChevronDown size={16} className="muted-icon" />
        </div>

        <div className="nav-label">ANALYSIS</div>

        <nav className="navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-item ${activePage === label ? "active" : ""}`}
              onClick={() => {
                setActivePage(label);
                setSidebarOpen(false);
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
              {label === "Benchmark Tasks" && (
                <span className="nav-count">
                  {pad2(taskViews.length || 0)}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-spacer" />

        <div className="sidebar-status">
          <div className="status-heading">
            <span className="status-dot" />
            Evaluation data
            <span className="status-online">
              {loadState.status === "ready" ? "Loaded" : loadState.status === "error" ? "Error" : "Loading"}
            </span>
          </div>
          <p>
            Saved JSON from the local results directory. The dashboard does not
            rerun Gemini evaluations.
          </p>
        </div>

        <div className="sidebar-footer">
          <div className="profile-avatar">FE</div>
          <div className="profile-info">
            <strong>FrontendEval</strong>
            <span>Benchmark workspace</span>
          </div>
          <Settings2 size={18} className="muted-icon" />
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb-muted">Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <span className="breadcrumb-current">{activePage}</span>
          </div>

          <div className="topbar-right">
            <div className="run-indicator">
              <span className="status-dot" />
              Recorded run
            </div>
            <div className="topbar-avatar">FE</div>
          </div>
        </header>

        <div className="page-content">
          {loadState.status === "loading" && (
            <section className="panel loading-panel">
              <div className="loading-spinner" aria-hidden="true" />
              <strong>Loading recorded evaluation data</strong>
              <p>
                Reading benchmark-summary.json, task definitions, and saved
                result files through the local dashboard server.
              </p>
            </section>
          )}

          {loadState.status === "error" && (
            <section className="panel error-panel">
              <strong>Unable to load evaluation data</strong>
              <p>{loadState.message}</p>
              <p>
                Start the dashboard with <code>npm run dev</code> from the
                dashboard directory so saved results can be served from the
                project, not from a browser-relative path.
              </p>
            </section>
          )}

          {loadState.status === "ready" && activePage === "Overview" && (
            <OverviewPage
              summary={loadState.data.summary}
              summaryError={loadState.data.summaryError}
              tasks={taskViews}
              onOpenTasks={() => setActivePage("Benchmark Tasks")}
              onOpenReview={openReview}
            />
          )}

          {loadState.status === "ready" && activePage === "Benchmark Tasks" && (
            <TasksPage
              tasks={taskViews}
              filteredTasks={filteredTasks}
              search={search}
              onSearch={setSearch}
              onSelect={openReview}
            />
          )}

          {loadState.status === "ready" && activePage === "Code Review" && (
            <CodeReviewPage
              tasks={taskViews}
              selectedId={selectedTask}
              onSelect={setSelectedTask}
            />
          )}

          {loadState.status === "ready" && activePage === "Methodology" && (
            <MethodologyPage
              readme={loadState.data.readme}
              summary={loadState.data.summary}
            />
          )}

          <footer className="page-footer">
            <span>
              <Sparkles size={14} /> FrontendEval
            </span>
            <span>AI Frontend Code Review Evaluation</span>
            <span>Micro1 Eval Hackathon 2026</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default App;
