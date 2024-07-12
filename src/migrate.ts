import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import formatAndLog from "./formatAndLog";
import getMigrationsExecuted from "./getMigrationsExecuted";
import handleMigrationChange from "./handleMigrationChange";
import { ToolBoxFileWithMetaData } from "./types";

/**
 * Handle the migrate operation.
 * - Iterate over the toolbox files to process migrations.
 * - Check if the migration has already been executed.
 * - If not executed, log the action, execute the migration, update the migrations table, and log completion.
 * - If already executed, log that the migration has been skipped.
 *
 * @param pool - The database pool.
 * @param transactionConnection - The transaction connection.
 * @param toolboxFiles - The toolbox files containing migration scripts.
 */
const migrate = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  toolboxFiles: ToolBoxFileWithMetaData[]
): Promise<void> => {
  for (const toolboxFile of toolboxFiles) {
    const { migrate, fileName } = toolboxFile;

    // Check if the migration script has already been executed
    const migrationsExecuted = await getMigrationsExecuted(pool, fileName);

    if (!migrationsExecuted) {
      formatAndLog(
        `Migrate: Executing migration script in ${fileName}`,
        migrate
      );

      // Execute the migration script
      await transactionConnection.query(migrate);

      // Update the migrations table to indicate the script has been executed
      await handleMigrationChange(pool, transactionConnection, fileName, true);

      formatAndLog(`Migrate: Migration script completed: ${fileName}`);
    } else {
      formatAndLog(
        `Migrate: Migration file ${fileName} has already been executed.`
      );
    }
  }
};

export default migrate;
