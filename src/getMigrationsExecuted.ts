import { DatabasePoolType, sql } from "slonik";

/**
 * Check if migrations for a given file have been executed.
 * - Execute a query to check if the file name exists in the `pg_toolbox_migrations` table.
 * - Return true if the file name exists.
 * - If the table does not exist (error code '42P01'), return false.
 *
 * @param pool - The database pool.
 * @param fileName - The name of the migration file.
 * @returns A promise that resolves to a boolean indicating if the migrations were executed.
 */
const getMigrationsExecuted = async (
  pool: DatabasePoolType,
  fileName: string,
): Promise<boolean> => {
  try {
    const rowExists = await pool.exists(
      sql`SELECT true FROM pg_toolbox_migrations WHERE file_name = ${fileName} FETCH FIRST 1 ROWS ONLY`,
    );
    return rowExists;
  } catch (err: any) {
    // If no migrations have run then you will get an error: relation "pg_toolbox_migrations" does not exist
    if (err.code === "42P01") return false;
    else throw err;
  }
};

export default getMigrationsExecuted;
