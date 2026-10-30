
import { readFile } from "node:fs/promises";
import { loadTasks } from "./dataset.js";
import { buildReviewPrompt } from "./prompt.js";

async function main() {
  const tasks = await loadTasks();
  const taskId = process.argv[2] ?? "FE-001";

  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const source = await readFile(task.sourceFile, "utf8");
  const prompt = buildReviewPrompt(task, source);

  console.log(`\nBenchmark: ${task.id} — ${task.title}\n`);
  console.log("----- MODEL PROMPT -----\n");
  console.log(prompt);
  console.log("\n----- END PROMPT -----\n");
}

main().catch((error: unknown) => {
  console.error("Evaluation failed:", error);
  process.exitCode = 1;
});
