import { DatabasePoolType, sql } from "slonik";

/**
 * Check if migrations for a given file have been executed.
 * - Execute a query to check if the file name exists in the `pg_toolbox_migrations` table.
 * - Return true if the file name exists.
 * - If the table does not exist (error code '42P01'), return false.
 *
 * @param {DatabasePoolType} pool - The database pool.
 * @param {string} fileName - The name of the migration file.
 * @returns A promise that resolves to a boolean indicating if the migrations were executed.
 */
const getMigrationsExecuted = async (
  pool: DatabasePoolType,
  fileName: string
): Promise<{ migrationExecuted: boolean; existingHash?: string }> => {
  try {
    const migrationExecuted = await pool.query(
      sql`SELECT hash FROM pg_toolbox_migrations WHERE file_name = ${fileName} FETCH FIRST 1 ROWS ONLY`
    );

    return {
      migrationExecuted: !!migrationExecuted.rows.length,
      // Todo: When I upgrade Slonik I can delete this typecast and strongly type the query
      existingHash: migrationExecuted.rows[0]?.hash
        ? (migrationExecuted.rows[0]?.hash as string)
        : undefined,
    };
  } catch (err: any) {
    // If no migrations have run then you will get an error: relation "pg_toolbox_migrations" does not exist
    if (err.code === "42P01") return { migrationExecuted: false };
    else throw err;
  }
};

export default getMigrationsExecuted;
