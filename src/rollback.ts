import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import { ToolBoxFileWithMetaData } from "../dist/types";
import formatAndLog from "./formatAndLog";
import { generateAndVerifyMigrationHash } from "./generateAndVerifyMigrationHash";
import getMigrationsExecuted from "./getMigrationsExecuted";
import handleMigrationChange from "./handleMigrationChange";

/**
 * Handle the rollback operation.
 * - Iterate over the toolbox files in reverse order to process rollbacks.
 * - Check if the migration has already been executed.
 * - If executed, log the action, execute the rollback, update the migrations table, and log completion.
 * - If not executed, log that the rollback has been skipped.
 *
 * @param {DatabasePoolType} pool - The database pool.
 * @param {DatabaseTransactionConnectionType} transactionConnection - The transaction connection.
 * @param {ToolBoxFileWithMetaData[]} toolboxFiles - The toolbox files containing rollback scripts.
 */
const rollback = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  toolBoxFiles: ToolBoxFileWithMetaData[]
): Promise<void> => {
  // Iterate over migration files in descending alphabetical order
  const toolboxFilesReversed = toolBoxFiles.reverse();

  for (const toolBoxFile of toolboxFilesReversed) {
    const { rollback, fileName } = toolBoxFile;

    // Check if the migration script has already been executed
    const { migrationExecuted, existingHash } = await getMigrationsExecuted(
      pool,
      fileName
    );

    if (migrationExecuted) {
      // Generate and verify the hash of the migration
      const currentHash = generateAndVerifyMigrationHash(
        toolBoxFile,
        existingHash
      );

      formatAndLog(
        `[pg-toolbox] Rollback: Executing rollback script in ${fileName}`,
        rollback
      );

      // Execute the rollback script
      await transactionConnection.query(rollback);

      // Update the migrations table to indicate the script has been rolled back
      await handleMigrationChange(
        pool,
        transactionConnection,
        fileName,
        false,
        currentHash
      );
    } else {
      formatAndLog(`Rollback: ${fileName} has not been migrated yet.`);
    }
  }
};

export default rollback;
