import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import formatAndLog from "./formatAndLog";
import { generateAndVerifyMigrationHash } from "./generateAndVerifyMigrationHash";
import handleMigrationChange from "./handleMigrationChange";
import haveOperationsBeenApplied from "./haveOperationsBeenApplied";
import { ToolBoxFileWithMetaData } from "./types";

/**
 * Handle the migrate operation.
 * - Iterate over the toolbox files to process migrations.
 * - Check if the migration has already been applied.
 * - If not applied, log the action, execute the migration, update the migrations table, and log completion.
 * - If already applied, log that the migration has been skipped.
 *
 * @param {DatabasePoolType} pool - The database pool.
 * @param {DatabaseTransactionConnectionType} transactionConnection - The transaction connection.
 * @param {ToolBoxFileWithMetaData[]} toolboxFiles - The toolbox files containing migration scripts.
 */
const migrate = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  toolBoxFiles: ToolBoxFileWithMetaData[]
): Promise<void> => {
  // Todo: I need to order this by:
  // 1. migrations already ran by ascending timestamp
  // 2. then all new migrations by alphabetical order
  for (const toolBoxFile of toolBoxFiles) {
    const { migrate, fileName } = toolBoxFile;

    // Check if the migration script has already been applied
    const { operationApplied, existingHash } = await haveOperationsBeenApplied(
      pool,
      fileName,
      "migrate"
    );

    // If the migration query or script has not been ran yet, and it exists then we run it
    if (!operationApplied && migrate) {
      // Generate and verify the hash of the migration
      const currentHash = generateAndVerifyMigrationHash(
        toolBoxFile,
        existingHash
      );

      let migrationQueries = Array.isArray(migrate) ? migrate : [migrate];
      for (let query of migrationQueries) {
        // Execute the migration script
        formatAndLog(
          `Migrate: Executing migration script in ${fileName}`,
          query
        );
        await transactionConnection.query(query);

        // Update the migrations table to indicate the script has been applied
        await handleMigrationChange(
          pool,
          transactionConnection,
          fileName,
          true,
          currentHash
        );

        formatAndLog(`Migrate: Migration script completed: ${fileName}`);
      }
    } else if (migrate && operationApplied) {
      formatAndLog(
        `Migrate: Migration file ${fileName} has already been applied.`
      );
    } else if (!migrate) {
      formatAndLog(`Migrate: No migration query (or script) in ${fileName}.`);
    }
  }
};

export default migrate;
