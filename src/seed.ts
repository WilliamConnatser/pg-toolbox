import { DatabasePoolType, DatabaseTransactionConnectionType } from 'slonik'
import formatAndConsoleLog from './formatAndConsoleLog'
import getMigrationsExecuted from './getMigrationsExecuted'
import truncate from './truncate'

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
  await truncate(pool, transactionConnection, toolboxFiles)
  for (const toolboxFile of toolboxFiles) {
    const { fileName, seed } = toolboxFile
    const migrationsExecuted = await getMigrationsExecuted(pool, fileName)

    if (migrationsExecuted) {
      if (!seed) {
        formatAndConsoleLog(
          `Seed: Toolbox file ${fileName} does not contain a seed script.`,
        )
      } else {
        formatAndConsoleLog(`Seed: Executing seed script ${fileName}`, seed)
        await transactionConnection.query(seed)
      }
    } else {
      formatAndConsoleLog(`Seed: ${fileName} has not been migrated yet.`)
    }
  }
}
export default seed
