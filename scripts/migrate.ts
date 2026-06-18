import { migrate } from "../lib/db";

async function main() {
  console.log("Running database migration...");
  await migrate();
  console.log("Migration complete.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
