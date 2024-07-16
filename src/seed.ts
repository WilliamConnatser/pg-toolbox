import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import formatAndLog from "./formatAndLog";
import getMigrationsApplied from "./haveOperationsBeenApplied";
import truncate from "./truncate";
import { ToolBoxFileWithMetaData } from "./types";

/**
 * Handle the seed operation.
 * - Truncate the database tables before seeding.
 * - Iterate over the toolbox files to process seeds.
 * - Check if the migration has already been applied.
 * - If applied and seed script exists, execute the seed script.
 * - If applied but no seed script exists, log that the seed is skipped.
 * - If not applied, log that the seed has been skipped.
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

  // Todo: get this in order of previous seed script runs, falling back on alphabetical order
  for (const toolboxFile of toolboxFiles) {
    const { fileName, seed } = toolboxFile;

    // Check if the migration script has already been applied
    const { operationApplied } = await getMigrationsApplied(
      pool,
      fileName,
      "migrate"
    );

    if (!seed) {
      formatAndLog(
        `Seed: Toolbox file ${fileName} does not contain a seed script.`
      );
    } else if (!operationApplied) {
      formatAndLog(`Seed: ${fileName} has not been migrated yet.`);
    } else if (seed && operationApplied) {
      let seedQueries = Array.isArray(seed) ? seed : [seed];
      for (let query of seedQueries) {
        formatAndLog(`Seed: Executing seed script ${fileName}`, query);

        // Execute the seed script
        await transactionConnection.query(query);
      }
      formatAndLog(`Seed: Seed script completed: ${fileName}`);
    }
  }
};

export default seed;
