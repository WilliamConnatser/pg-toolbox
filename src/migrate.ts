import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import formatAndLog from "./formatAndLog";
import { generateAndVerifyMigrationHash } from "./generateAndVerifyMigrationHash";
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
 * @param {DatabasePoolType} pool - The database pool.
 * @param {DatabaseTransactionConnectionType} transactionConnection - The transaction connection.
 * @param {ToolBoxFileWithMetaData[]} toolboxFiles - The toolbox files containing migration scripts.
 */
const migrate = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  toolBoxFiles: ToolBoxFileWithMetaData[]
): Promise<void> => {
  for (const toolBoxFile of toolBoxFiles) {
    const { migrate, fileName } = toolBoxFile;

    // Check if the migration script has already been executed
    const { migrationExecuted, existingHash } = await getMigrationsExecuted(
      pool,
      fileName
    );

    if (!migrationExecuted) {
      // Generate and verify the hash of the migration
      const currentHash = generateAndVerifyMigrationHash(
        toolBoxFile,
        existingHash
      );

      // Execute the migration script
      formatAndLog(
        `Migrate: Executing migration script in ${fileName}`,
        migrate
      );
      await transactionConnection.query(migrate);

      // Update the migrations table to indicate the script has been executed
      await handleMigrationChange(
        pool,
        transactionConnection,
        fileName,
        true,
        currentHash
      );

      formatAndLog(`Migrate: Migration script completed: ${fileName}`);
    } else {
      formatAndLog(
        `Migrate: Migration file ${fileName} has already been executed.`
      );
    }
  }
};

export default migrate;
