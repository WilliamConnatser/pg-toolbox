const { sql } = require("slonik");

const handleMigrationChange = async (
  pool,
  transactionConnection,
  fileName,
  migrating,
) => {
  return pool
    .exists(sql`SELECT true FROM pg_toolbox_migrations FETCH FIRST 1 ROWS ONLY`)
    .then(() => {
      //The table exists already so we need to update it
      if (migrating) {
        //If migrating then create a new row for this table in the database
        return transactionConnection.query(
          sql`INSERT INTO pg_toolbox_migrations(name)
            VALUES(${fileName})`,
        );
      } else {
        //Else when rolling back remove the row from the database
        return transactionConnection
          .query(
            sql`
          DELETE FROM pg_toolbox_migrations
            WHERE name = ${fileName}`,
          )
          .then(() => {
            //Check if there are anymore rows in pg_toolbox_migrations
            return transactionConnection.exists(
              sql`SELECT true FROM pg_toolbox_migrations FETCH FIRST 1 ROWS ONLY`,
            );
          })
          .then((rowExists) => {
            if (!rowExists) {
              //If there are no more tables to rollback, then drop the pg_toolbox_migrations table
              return transactionConnection.query(
                sql`DROP TABLE IF EXISTS pg_toolbox_migrations`,
              );
            }
          });
      }
    })
    .catch(async (err) => {
      if (err.code === "42P01") {
        //If the table does not exist yet, meaning no migrations have ran at all
        if (migrating) {
          //If migrating and the table does not exits, then create the table, and recursively execute handleMigrationChange
          pool
            .query(
              sql`CREATE TABLE pg_toolbox_migrations (
              name VARCHAR(50) PRIMARY KEY
            )`,
            )
            .then(() => {
              return handleMigrationChange(
                pool,
                transactionConnection,
                fileName,
                migrating,
              );
            });
        } else {
          return;
        }
      } else {
        throw err;
      }
    });
};

export default handleMigrationChange;
