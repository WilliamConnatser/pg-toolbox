import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import formatAndLog from "./formatAndLog";
import getMigrationsExecuted from "./getMigrationsExecuted";
import handleMigrationChange from "./handleMigrationChange";

/**
 * Handle the rollback operation.
 * @param transactionConnection The transaction connection.
 * @param toolboxFiles The toolbox files.
 */
const rollback = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  toolboxFiles: any[],
): Promise<void> => {
  const toolboxFilesReversed = toolboxFiles.reverse();

  for (const toolboxFile of toolboxFilesReversed) {
    const { rollback, fileName } = toolboxFile;
    const migrationsExecuted = await getMigrationsExecuted(pool, fileName);

    if (migrationsExecuted) {
      formatAndLog(
        `[pg-toolbox] Rollback: Executing rollback script in ${fileName}`,
        rollback,
      );
      await transactionConnection.query(rollback);
      await handleMigrationChange(pool, transactionConnection, fileName, false);
      formatAndLog(`Rollback: Rollback query successful: ${fileName}`);
    } else {
      formatAndLog(`Rollback: ${fileName} has not been migrated yet.`);
    }
  }
};

export default rollback;
