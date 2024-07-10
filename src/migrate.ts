import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import formatAndLog from "./formatAndLog";
import getMigrationsExecuted from "./getMigrationsExecuted";
import handleMigrationChange from "./handleMigrationChange";

/**
 * Handle the migrate operation.
 * @param transactionConnection The transaction connection.
 * @param toolboxFiles The toolbox files.
 */
const migrate = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  toolboxFiles: any[],
): Promise<void> => {
  for (const toolboxFile of toolboxFiles) {
    const { migrate, fileName } = toolboxFile;
    const migrationsExecuted = await getMigrationsExecuted(pool, fileName);

    if (!migrationsExecuted) {
      formatAndLog(
        `Migrate: Executing migration script in ${fileName}`,
        migrate,
      );
      await transactionConnection.query(migrate);
      await handleMigrationChange(pool, transactionConnection, fileName, true);
      formatAndLog(`Migrate: Migration script completed: ${fileName}`);
    } else {
      formatAndLog(
        `Migrate: Migration file ${fileName} has already been executed.`,
      );
    }
  }
};

export default migrate;
