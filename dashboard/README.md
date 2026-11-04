# FrontendEval dashboard

React + TypeScript + Vite UI for inspecting **saved** FrontendEval benchmark results.

The dashboard does not call Gemini and does not rerun evaluations. A Vite plugin serves allowlisted files from the parent project (`results/`, `dataset/tasks.json`, and `README.md`) at `/eval-data/`.

```bash
npm install
npm run dev
```

Typecheck and production build:

```bash
npm run build
```
