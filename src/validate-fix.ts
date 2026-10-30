
import { validateSearchFix } from "./fix-validator.js";

async function main() {
  const result = await validateSearchFix();

  console.log(JSON.stringify(result, null, 2));

  if (!result.fixValidation.passed) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(
    "Fix validation failed:",
    error instanceof Error ? error.message : "Unknown error"
  );
  process.exitCode = 1;
});
