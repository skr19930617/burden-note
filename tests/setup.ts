// Per-test-file setup. Runs before each test file's imports trigger evaluation
// of route modules / db client. Forces tests to use an isolated SQLite file and
// the deterministic template LLM adapter.

process.env.BURDEN_DATABASE_URL = "file:./prisma/test.db";
process.env.LLM_PROVIDER = "template";
process.env.XAI_API_KEY = "";
