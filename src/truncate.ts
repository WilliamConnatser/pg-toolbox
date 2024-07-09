import { DatabasePoolType, DatabaseTransactionConnectionType } from 'slonik'
import formatAndConsoleLog from './formatAndConsoleLog'
import getMigrationsExecuted from './getMigrationsExecuted'
import { ParsedToolboxFile } from './types'

/**
 * Truncate tables based on the toolbox files.
 * - Iterate over migration files in descending alphabetical order.
 * - Check if the toolbox file migration script was already executed before truncating.
 * - If the migration was executed and a truncate script exists, execute the truncate script.
 * - Log the process of truncation for each file.
 *
 * @param pool - The database pool.
 * @param transactionConnection - The transaction connection.
 * @param toolboxFiles - The toolbox files containing truncate scripts.
 */
const truncate = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  toolboxFiles: ParsedToolboxFile[],
): Promise<void> => {
  // Iterate over migration files in descending alphabetical order
  const toolboxFilesReversed = toolboxFiles.slice().reverse()
  for (const toolboxFile of toolboxFilesReversed) {
    const { truncate, fileName } = toolboxFile

    // Check if the toolbox file migration script was already executed before truncating
    const migrationsExecuted = await getMigrationsExecuted(pool, fileName)
    if (migrationsExecuted) {
      if (truncate) {
        const query = await truncate()
        formatAndConsoleLog(
          `Truncate: Running truncate script in ${fileName}`,
          query,
        )
        await transactionConnection.query(query)
      } else {
        formatAndConsoleLog(
          `Truncate: ${fileName} does not have a truncate script.`,
        )
      }
    } else {
      formatAndConsoleLog(`Truncate: ${fileName} has not been migrated yet.`)
    }
  }
}

export default truncate
