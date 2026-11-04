import { ListChecks, Search, X } from "lucide-react";
import { TaskTable } from "../components/TaskTable";
import type { TaskView } from "../types";

export function TasksPage({
  tasks,
  filteredTasks,
  search,
  onSearch,
  onSelect,
}: {
  tasks: TaskView[];
  filteredTasks: TaskView[];
  search: string;
  onSearch: (value: string) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">
            <ListChecks size={14} />
            EVALUATION DATASET
          </div>
          <h1>Benchmark tasks</h1>
          <p className="page-description">
            Task definitions from dataset/tasks.json combined with the recorded
            result files.
          </p>
        </div>
        <span className="subtle-chip">{tasks.length} total tasks</span>
      </section>

      <div className="search-bar">
        <Search size={18} />
        <input
          aria-label="Search benchmark tasks"
          placeholder="Search by task, ID, or category..."
          value={search}
          onChange={(event) => onSearch(event.target.value)}
        />
        {search && (
          <button
            className="icon-button"
            onClick={() => onSearch("")}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <section className="panel tasks-panel">
        <div className="panel-header">
          <div>
            <h3>Task inventory</h3>
            <p>{filteredTasks.length} matching tasks</p>
          </div>
        </div>
        <TaskTable tasks={filteredTasks} onSelect={onSelect} />
      </section>
    </>
  );
}
