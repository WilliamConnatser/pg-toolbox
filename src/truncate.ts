import { DatabasePoolType, DatabaseTransactionConnectionType } from "slonik";
import formatAndLog from "./formatAndLog";
import haveOperationsBeenApplied from "./haveOperationsBeenApplied";
import { ToolBoxFileWithMetaData } from "./types";

/**
 * Truncate tables based on the toolbox files.
 * - Iterate over migration files in descending alphabetical order.
 * - Check if the toolbox file migration script was already applied before truncating.
 * - If the migration was applied and a truncate script exists, execute the truncate script.
 * - Log the process of truncation for each file.
 *
 * @param {DatabasePoolType} pool - The database pool.
 * @param {DatabaseTransactionConnectionType} transactionConnection - The transaction connection.
 * @param {ToolBoxFileWithMetaData[]} toolboxFiles - The toolbox files containing truncate scripts.
 */
const truncate = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  toolboxFiles: ToolBoxFileWithMetaData[]
): Promise<void> => {
  // Todo: do these in reverse order they were seeded
  // Iterate over toolbox files containing the truncate scrips in descending alphabetical order
  const toolboxFilesReversed = toolboxFiles.slice().reverse();
  for (const toolboxFile of toolboxFilesReversed) {
    const { truncate, fileName } = toolboxFile;

    // Check if the toolbox file seed script was already applied before truncating
    const { operationApplied } = await haveOperationsBeenApplied(
      pool,
      fileName,
      "truncate"
    );
    if (!truncate) {
      formatAndLog(
        `Seed: Toolbox file ${fileName} does not contain a seed script.`
      );
    } else if (truncate && !operationApplied) {
      let truncateQueries = Array.isArray(truncate) ? truncate : [truncate];
      for (let query of truncateQueries) {
        formatAndLog(`Truncate: Running truncate script in ${fileName}`, query);
        await transactionConnection.query(query);
        formatAndLog(`Truncate: Running truncate script in ${fileName}`, query);
      }
    } else if (truncate && operationApplied) {
      formatAndLog(`Truncate: ${fileName} has already been ran.`);
    }
  }
};

export default truncate;
