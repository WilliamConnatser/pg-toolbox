import { DatabasePoolType, DatabaseTransactionConnectionType } from 'slonik'
import formatAndConsoleLog from './formatAndConsoleLog'
import getMigrationsExecuted from './getMigrationsExecuted'
import handleMigrationChange from './handleMigrationChange'

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
  const toolboxFilesReversed = toolboxFiles.reverse()

  for (const toolboxFile of toolboxFilesReversed) {
    const { rollback, fileName } = toolboxFile
    const migrationsExecuted = await getMigrationsExecuted(pool, fileName)

    if (migrationsExecuted) {
      formatAndConsoleLog(
        `[pg-toolbox] Rollback: Executing rollback script in ${fileName}`,
        rollback,
      )
      await transactionConnection.query(rollback)
      await handleMigrationChange(pool, transactionConnection, fileName, false)
    } else {
      formatAndConsoleLog(`Rollback: ${fileName} has not been migrated yet.`)
    }
  }
}

export default rollback
