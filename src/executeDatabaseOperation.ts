import {
  createPool,
  DatabasePoolType,
  DatabaseTransactionConnectionType,
} from "slonik";
import importToolboxFiles from "./importToolboxFiles";
import migrate from "./migrate";
import rollback from "./rollback";
import seed from "./seed";
import truncate from "./truncate";

const pool: DatabasePoolType = createPool(process.env.PGURI || "");

/**
 * Execute a specific database operation based on the provided option.
 * - '--rollback' or '-rollback': Rollback the database migrations.
 * - '--truncate' or '-truncate': Truncate the database tables.
 * - '--migrate' or '-migrate': Migrate the database.
 * - '--seed' or '-seed': Seed the database.
 *
 * @param option The operation to perform: --rollback, --truncate, --migrate, --seed
 */
const executeDatabaseOperation = async (option: string): Promise<void> => {
  const toolboxFiles = await importToolboxFiles();

  await pool.transaction(
    async (transactionConnection: DatabaseTransactionConnectionType) => {
      switch (option) {
        case "--rollback":
        case "-rollback":
          await rollback(pool, transactionConnection, toolboxFiles);
          break;
        case "--truncate":
        case "-truncate":
          await truncate(pool, transactionConnection, toolboxFiles);
          break;
        case "--migrate":
        case "-migrate":
          await migrate(pool, transactionConnection, toolboxFiles);
          break;
        case "--seed":
        case "-seed":
          await seed(pool, transactionConnection, toolboxFiles);
          break;
        default:
          console.log("Unknown command");
      }
    }
  );
};

export default executeDatabaseOperation;
