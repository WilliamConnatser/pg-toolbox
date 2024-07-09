import { DatabasePoolType, DatabaseTransactionConnectionType } from 'slonik'
import formatAndConsoleLog from './formatAndConsoleLog'
import getMigrationsExecuted from './getMigrationsExecuted'
import handleMigrationChange from './handleMigrationChange'

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
    const { migrate, fileName } = toolboxFile
    const migrationsExecuted = await getMigrationsExecuted(pool, fileName)

    if (!migrationsExecuted) {
      formatAndConsoleLog(
        `Migrate: Executing migration script in ${fileName}`,
        migrate,
      )
      await transactionConnection.query(migrate)
      await handleMigrationChange(pool, transactionConnection, fileName, true)
    } else {
      formatAndConsoleLog(
        `Migrate: Migration file ${fileName} has already been executed.`,
      )
    }
  }
}

export default migrate
