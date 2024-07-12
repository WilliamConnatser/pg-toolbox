import {
  DatabasePoolType,
  DatabaseTransactionConnectionType,
  sql,
} from "slonik";

/**
 * Handle changes to the migration table after executing a migration or rollback.
 * - Create the metadata table if it does not exist yet
 * - If migrating, create a new row for this file in the `pg_toolbox` table.
 * - If rolling back, update the existing row for this file from the `pg_toolbox` table.
 *
 * @param {DatabasePoolType} pool The database pool.
 * @param {DatabaseTransactionConnectionType} transactionConnection The transaction connection.
 * @param {string} fileName The name of the migration file.
 * @param {boolean} migrating Indicates whether we're migrating or rolling back
 * @param {string} hash The hash of the migrate and rollback queries
 * @returns {void} A promise that resolves when the operation is complete.
 */
const handleMigrationChange = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  fileName: string,
  migrating: boolean,
  hash: string
): Promise<void> => {
  await pool
    .query(
      sql`
        CREATE TABLE IF NOT EXISTS pg_toolbox (
          name TEXT PRIMARY KEY, -- The name of the toolbox file
          hash TEXT NOT NULL, -- Hash of the toolbox migrate and rollback scripts concatenated
          migrate DATE DEFAULT NULL, -- Date when the migrate operation was completed
          rollback DATE DEFAULT NULL, -- Date when the rollback operation was completed
          truncate DATE DEFAULT NULL, -- Date when the truncate operation was completed
          seed DATE DEFAULT NULL -- Date when the seed operation was completed
        );
      )`
    )
    .then(async () => {
      // The metadata table exists already so we need to update it
      if (migrating) {
        if (hash) {
          // If migrating then create a new row for this table in the database
          return transactionConnection.query(
            sql`INSERT INTO pg_toolbox(name, hash, migrate)
            VALUES(${fileName}, ${hash}, CURRENT_DATE)`
          );
        } else {
          throw new Error(
            "A hash of the migrate and rollback queries must be provided (they are immutable)"
          );
        }
      } else {
        // Else when rolling back update the applicable row in the database
        return transactionConnection
          .query(
            sql`UPDATE pg_toolbox
              SET migrate = NULL,
                  rollback = CURRENT_DATE
              WHERE name = ${fileName}`
          )
          .then(() => {
            // Todo: Since we're not deleting the rows anymore
            // We need to see if there were any migrations done before the one we're currently rolling back
            // If so, then we need to continue (do this before setting migrate to null)
            // Write a join query where the name is the same but the date stored in migrate is before the current file's date

            // Check if there are any more rows in pg_toolbox_migrations
            return transactionConnection.exists(
              sql`SELECT true FROM pg_toolbox FETCH FIRST 1 ROWS ONLY`
            );
          });
      }
    })
    .catch(async (err) => {
      // An unexpected error occurred
      throw err;
    });
};

export default handleMigrationChange;
