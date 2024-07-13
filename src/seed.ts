import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import formatAndLog from "./formatAndLog";
import getMigrationsExecuted from "./getMigrationsExecuted";
import truncate from "./truncate";
import { ToolBoxFileWithMetaData } from "./types";

/**
 * Handle the seed operation.
 * - Truncate the database tables before seeding.
 * - Iterate over the toolbox files to process seeds.
 * - Check if the migration has already been executed.
 * - If executed and seed script exists, execute the seed script.
 * - If executed but no seed script exists, log that the seed is skipped.
 * - If not executed, log that the seed has been skipped.
 *
 * @param {DatabasePoolType} pool - The database pool.
 * @param {DatabaseTransactionConnectionType} transactionConnection - The transaction connection.
 * @param {ToolBoxFileWithMetaData[]} toolboxFiles - The toolbox files containing seed scripts.
 */
const seed = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  toolboxFiles: ToolBoxFileWithMetaData[]
): Promise<void> => {
  // Truncate the database tables before seeding
  await truncate(pool, transactionConnection, toolboxFiles);

  for (const toolboxFile of toolboxFiles) {
    const { fileName, seed } = toolboxFile;

    // Check if the migration script has already been executed
    const migrationsExecuted = await getMigrationsExecuted(pool, fileName);

    if (migrationsExecuted) {
      if (!seed) {
        formatAndLog(
          `Seed: Toolbox file ${fileName} does not contain a seed script.`
        );
      } else {
        formatAndLog(`Seed: Executing seed script ${fileName}`, seed);

        // Execute the seed script
        await transactionConnection.query(seed);

        formatAndLog(`Seed: Seed script completed: ${fileName}`);
      }
    } else {
      formatAndLog(`Seed: ${fileName} has not been migrated yet.`);
    }
  }
};

export default seed;
