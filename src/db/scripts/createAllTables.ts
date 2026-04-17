import { main as createObserverNotesTable } from "./createObserverNotesTable.js";
import { main as createBehaviorNotesTable } from "./createBehaviorNotesTable.js";
import { main as createPetCompatibilityTable } from "./createPetCompatibilityTable.js";
import { main as createMergedNotesTable } from "./createMergedNotesTable.js";

export const main = async () => {
  await createObserverNotesTable();
  await createBehaviorNotesTable();
  await createPetCompatibilityTable();
  await createMergedNotesTable();
};

main().catch((error) => {
  console.error("Failed to create DynamoDB tables:", error);
  process.exitCode = 1;
});
