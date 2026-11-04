import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import type { Plugin, PreviewServer, ViteDevServer } from "vite";

const TASK_FILE = /^FE-\d{3}(?:-error)?\.json$/;
const CANDIDATE_FILE = /^FE-\d{3}-candidate\.ts$/;
const SUMMARY_FILE = "benchmark-summary.json";

function isInside(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function send(
  res: ServerResponse,
  status: number,
  contentType: string,
  body: string | Buffer,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.end(body);
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  send(res, status, "application/json; charset=utf-8", JSON.stringify(body));
}

async function readAllowedFile(root: string, relativePath: string): Promise<Buffer> {
  const resolved = path.resolve(root, relativePath);
  if (!isInside(root, resolved) || !existsSync(resolved)) {
    throw Object.assign(new Error("File not found"), { status: 404 });
  }
  return readFile(resolved);
}

async function listResultFiles(root: string): Promise<string[]> {
  const resultsDir = path.resolve(root, "results");
  if (!existsSync(resultsDir)) {
    return [];
  }

  const names = await readdir(resultsDir);
  return names.filter(
    (name) =>
      name === SUMMARY_FILE || TASK_FILE.test(name) || CANDIDATE_FILE.test(name),
  );
}

async function parseJsonFile(root: string, relativePath: string): Promise<unknown> {
  const buffer = await readAllowedFile(root, relativePath);
  try {
    return JSON.parse(buffer.toString("utf8"));
  } catch {
    throw Object.assign(new Error(`Invalid JSON in ${relativePath}`), {
      status: 500,
    });
  }
}

async function buildBundle(root: string): Promise<unknown> {
  const tasks = (await parseJsonFile(root, path.join("dataset", "tasks.json"))) as unknown;
  if (!Array.isArray(tasks)) {
    throw Object.assign(new Error("dataset/tasks.json must be an array"), {
      status: 500,
    });
  }

  let summary: unknown = null;
  let summaryError: string | null = null;
  try {
    summary = await parseJsonFile(root, path.join("results", SUMMARY_FILE));
  } catch (error) {
    summaryError =
      error instanceof Error ? error.message : "Unable to read benchmark summary";
  }

  const results: Record<string, { ok: true; data: unknown } | { ok: false; error: string }> =
    {};
  const candidates: Record<string, string | null> = {};

  for (const task of tasks) {
    if (typeof task !== "object" || task === null || !("id" in task)) {
      continue;
    }

    const taskId = (task as { id: unknown }).id;
    if (typeof taskId !== "string" || !/^FE-\d{3}$/.test(taskId)) {
      continue;
    }

    const resultRelative = path.join("results", `${taskId}.json`);
    const candidateRelative = path.join("results", `${taskId}-candidate.ts`);

    try {
      const data = await parseJsonFile(root, resultRelative);
      results[taskId] = { ok: true, data };
    } catch (error) {
      results[taskId] = {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : `Unable to read ${resultRelative}`,
      };
    }

    try {
      const source = await readAllowedFile(root, candidateRelative);
      candidates[taskId] = source.toString("utf8");
    } catch {
      candidates[taskId] = null;
    }
  }

  const readme = await readAllowedFile(root, "README.md")
  .then((buffer) => buffer.toString("utf8"))
  .catch(() => "");

  return {
    summary,
    summaryError,
    tasks,
    results,
    candidates,
    readme,
  };
}

async function serveEvalData(
  pathname: string,
  root: string,
  res: ServerResponse,
): Promise<void> {
  if (pathname === "/eval-data/bundle.json") {
    sendJson(res, 200, await buildBundle(root));
    return;
  }

  if (pathname === "/eval-data/README.md") {
    const body = await readAllowedFile(root, "README.md");
    send(res, 200, "text/markdown; charset=utf-8", body);
    return;
  }

  if (pathname === "/eval-data/dataset/tasks.json") {
    const body = await readAllowedFile(root, path.join("dataset", "tasks.json"));
    send(res, 200, "application/json; charset=utf-8", body);
    return;
  }

  const resultMatch = pathname.match(/^\/eval-data\/results\/([^/]+)$/);
  if (resultMatch) {
    const fileName = resultMatch[1];
    if (
      fileName !== SUMMARY_FILE &&
      !TASK_FILE.test(fileName) &&
      !CANDIDATE_FILE.test(fileName)
    ) {
      sendJson(res, 404, { error: "File is not part of the allowlisted results" });
      return;
    }

    const body = await readAllowedFile(root, path.join("results", fileName));
    const contentType = fileName.endsWith(".ts")
      ? "text/plain; charset=utf-8"
      : "application/json; charset=utf-8";
    send(res, 200, contentType, body);
    return;
  }

  sendJson(res, 404, { error: "Unknown eval-data path" });
}

function attachMiddleware(
  server: ViteDevServer | PreviewServer,
  root: string,
): void {
  server.middlewares.use(
    (req: IncomingMessage, res: ServerResponse, next: () => void) => {
      const pathname = (req.url ?? "").split("?")[0] ?? "";
      if (!pathname.startsWith("/eval-data/")) {
        next();
        return;
      }

      void serveEvalData(pathname, root, res).catch((error: unknown) => {
        const status =
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          typeof error.status === "number"
            ? error.status
            : 500;
        const message =
          error instanceof Error ? error.message : "Failed to read evaluation data";
        sendJson(res, status, { error: message });
      });
    },
  );
}

async function writeStaticMirror(root: string, outDir: string): Promise<void> {
  const dest = path.resolve(outDir, "eval-data");
  await mkdir(path.join(dest, "dataset"), { recursive: true });
  await mkdir(path.join(dest, "results"), { recursive: true });

  const bundle = await buildBundle(root);
  await writeFile(
    path.join(dest, "bundle.json"),
    JSON.stringify(bundle),
    "utf8",
  );

  if (existsSync(path.resolve(root, "README.md"))) {
    await writeFile(
      path.join(dest, "README.md"),
      await readFile(path.resolve(root, "README.md")),
    );
  }

  const tasksPath = path.resolve(root, "dataset", "tasks.json");
  if (existsSync(tasksPath)) {
    await writeFile(path.join(dest, "dataset", "tasks.json"), await readFile(tasksPath));
  }

  for (const name of await listResultFiles(root)) {
    await writeFile(
      path.join(dest, "results", name),
      await readFile(path.resolve(root, "results", name)),
    );
  }
}

export function evalDataPlugin(dashboardDir: string): Plugin {
  const root = path.resolve(dashboardDir, "..");
  let outDir = path.resolve(dashboardDir, "dist");

  return {
    name: "frontend-eval-data",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    configureServer(server) {
      attachMiddleware(server, root);
    },
    configurePreviewServer(server) {
      attachMiddleware(server, root);
    },
    async writeBundle() {
      await writeStaticMirror(root, outDir);
    },
  };
}
