import { main as createObserverNotesTable } from "./createObserverNotesTable.js";
import { main as createBehaviorNotesTable } from "./createBehaviorNotesTable.js";
import { main as createPetCompatibilityTable } from "./createPetCompatibilityTable.js";
import { main as createMergedNotesTable } from "./createMergedNotesTable.js";
import { main as createUsersTable } from "./createUsersTable.js";
import { main as createRefreshTokensTable } from "./createRefreshTokensTable.js";
import { main as createActivityLogTable } from "./createActivityLogTable.js";

export const main = async () => {
  await createPetCompatibilityTable();
  await createMergedNotesTable();
  await createObserverNotesTable();
  await createBehaviorNotesTable();
  await createUsersTable();
  await createRefreshTokensTable();
  await createActivityLogTable();
};

main()
  .then(() => {
    console.log("All tables created successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Failed to create DynamoDB tables:", error);
    process.exit(1);
  });
