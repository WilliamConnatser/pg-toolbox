import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import formatAndLog from "./formatAndLog";
import getMigrationsExecuted from "./getMigrationsExecuted";
import truncate from "./truncate";

/**
 * Handle the seed operation.
 * @param transactionConnection The transaction connection.
 * @param toolboxFiles The toolbox files.
 */
const seed = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  toolboxFiles: any[],
): Promise<void> => {
  await truncate(pool, transactionConnection, toolboxFiles);
  for (const toolboxFile of toolboxFiles) {
    const { fileName, seed } = toolboxFile;
    const migrationsExecuted = await getMigrationsExecuted(pool, fileName);

    if (migrationsExecuted) {
      if (!seed) {
        formatAndLog(
          `Seed: Toolbox file ${fileName} does not contain a seed script.`,
        );
      } else {
        formatAndLog(`Seed: Executing seed script ${fileName}`, seed);
        await transactionConnection.query(seed);
      }
    } else {
      formatAndLog(`Seed: ${fileName} has not been migrated yet.`);
    }
  }
};
export default seed;
