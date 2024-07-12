import { execSync } from "child_process";
import { createPool, DatabasePoolType, sql } from "slonik";

/** Function to create and start a PostgreSQL container, and initialize the connection pool */
export const createPostgresContainer = async (): Promise<DatabasePoolType> => {
  console.log("Starting Docker");

  try {
    // Run the Docker command to start the PostgreSQL container
    const stdout = execSync(
      `docker run --rm --name postgres_dev -e POSTGRES_PASSWORD=postgres -d -p 5432:5432 postgres`
    );
    console.log(`Stdout: ${stdout}`);
    console.log("PostgreSQL container started successfully.");

    // Wait for PostgreSQL to be ready
    await waitForPostgres();

    // Return a connection pool to use in tests
    return createPool("postgres://postgres:postgres@localhost:5432/postgres");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    throw new Error("Failed to start PostgreSQL container.");
  }
};

/** Function to wait for PostgreSQL to be ready */
const waitForPostgres = async () => {
  const maxRetries = 5;
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const pool = createPool(
        "postgres://postgres:postgres@localhost:5432/postgres"
      );
      await pool.query(sql`SELECT 1 AS id`);
      console.log("PostgreSQL is ready.");
      await pool.end();
      return;
    } catch (err) {
      console.log("Waiting for PostgreSQL to be ready...");
      attempts++;
      // Wait for 1 second before retrying
      await new Promise((res) => setTimeout(res, 1000));
    }
  }

  throw new Error("PostgreSQL did not become ready in time.");
};

/** Function to stop and remove the PostgreSQL container */
export const removePostgresContainer = () => {
  console.log("Stopping Docker container");

  try {
    // Stop and remove the Docker container
    const stdout = execSync("docker stop postgres_dev");

    console.log(`Stdout: ${stdout}`);
    console.log("Docker container stopped and removed successfully.");
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    }
    throw new Error("Failed to stop PostgreSQL container.");
  }
};
