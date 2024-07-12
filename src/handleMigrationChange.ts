import {
  DatabasePoolType,
  DatabaseTransactionConnectionType,
  sql,
} from "slonik";

/**
 * Handle changes to the migration table after executing a migration or rollback.
 * - If migrating, create a new row for this file in the `pg_toolbox_migrations` table.
 * - If rolling back, remove the row for this file from the `pg_toolbox_migrations` table.
 * - If there are no more rows in the `pg_toolbox_migrations` table after rollback, drop the table.
 * - If the table does not exist yet, create it and recursively execute the function.
 *
 * @param pool - The database pool.
 * @param transactionConnection - The transaction connection.
 * @param fileName - The name of the migration file.
 * @param migrating - Whether the migration was executed (true) or rolled back (false).
 * @returns A promise that resolves when the operation is complete.
 */
const handleMigrationChange = async (
  pool: DatabasePoolType,
  transactionConnection: DatabaseTransactionConnectionType,
  fileName: string,
  migrating: boolean
): Promise<void> => {
  await pool
    .exists(sql`SELECT true FROM pg_toolbox_migrations FETCH FIRST 1 ROWS ONLY`)
    .then(() => {
      // The table exists already so we need to update it
      if (migrating) {
        // If migrating then create a new row for this table in the database
        return transactionConnection.query(
          sql`INSERT INTO pg_toolbox_migrations(name)
            VALUES(${fileName})`
        );
      } else {
        // Else when rolling back remove the row from the database
        return transactionConnection
          .query(
            sql`DELETE FROM pg_toolbox_migrations
            WHERE name = ${fileName}`
          )
          .then(() => {
            // Check if there are any more rows in pg_toolbox_migrations
            return transactionConnection.exists(
              sql`SELECT true FROM pg_toolbox_migrations FETCH FIRST 1 ROWS ONLY`
            );
          })
          .then((rowExists) => {
            if (!rowExists) {
              // If there are no more tables to rollback, then drop the pg_toolbox_migrations table
              return transactionConnection.query(
                sql`DROP TABLE IF EXISTS pg_toolbox_migrations`
              );
            }
          });
      }
    })
    .catch(async (err) => {
      if (err.code === "42P01") {
        // If the table does not exist yet, meaning no migrations have run at all
        if (migrating) {
          // If migrating and the table does not exist, then create the table, and recursively execute handleMigrationChange
          await pool.query(
            sql`CREATE TABLE pg_toolbox_migrations (
              name VARCHAR(50) PRIMARY KEY
            )`
          );
          return handleMigrationChange(
            pool,
            transactionConnection,
            fileName,
            migrating
          );
        } else {
          return;
        }
      } else {
        throw err;
      }
    });
};

export default handleMigrationChange;
