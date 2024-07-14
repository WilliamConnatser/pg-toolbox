import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import { ToolBoxFileWithMetaData } from "../dist/types";
import formatAndLog from "./formatAndLog";
import handleMigrationChange from "./handleMigrationChange";
import haveOperationsBeenApplied from "./haveOperationsBeenApplied";

/**
 * Handle the rollback operation.
 * - Iterate over the toolbox files in reverse order to process rollbacks.
 * - Check if the migration has already been applied.
 * - If applied, log the action, execute the rollback, update the migrations table, and log completion.
 * - If not applied, log that the rollback has been skipped.
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

    // Check if the migration script has already been applied
    const { operationApplied, existingHash } = await haveOperationsBeenApplied(
      pool,
      fileName,
      "migrate"
    );

    if (operationApplied && existingHash) {
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
        existingHash
      );
    } else {
      formatAndLog(`Rollback: ${fileName} has not been migrated yet.`);
    }
  }
};

export default rollback;
