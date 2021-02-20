const handleMigrationChange = async (db, client, fileName, migrating) => {
  return db
    .query(
      `SELECT EXISTS (SELECT true FROM pg_toolbox_migrations FETCH FIRST 1 ROWS ONLY)`
    )
    .then(() => {
      //The table exists already so we need to update it
      if (migrating) {
        //If migrating then create a new row for this table in the database
        return client.query(
          `
          INSERT INTO pg_toolbox_migrations(name)
            VALUES($1)`,
          [fileName]
        );
      } else {
        //Else when rolling back remove the row from the database
        return client
          .query(
            `
          DELETE FROM pg_toolbox_migrations
            WHERE name = $1`,
            [fileName]
          )
          .then(() => {
            return client.query(
              `SELECT EXISTS (SELECT true FROM pg_toolbox_migrations FETCH FIRST 1 ROWS ONLY)`
            );
          })
          .then(({ rows }) => {
            if (!rows[0].exists) {
              //If there are no more tables to rollback then drop the pg_toolbox_migrations table
              return client.query(`DROP TABLE IF EXISTS pg_toolbox_migrations`);
            }
          });
      }
    })
    .catch(async (err) => {
      if (err.code === "42P01") {
        //The table does not exist yet, meaning no migrations have ran at all
        //If migrating then create the table and recursively call handleMigrationChange
        if (migrating) {
          db.query(
            `
              CREATE TABLE pg_toolbox_migrations (
              name VARCHAR(50) PRIMARY KEY
            )`
          ).then(() => {
            return handleMigrationChange(db, client, fileName, migrating);
          });
        } else {
          return;
        }
      } else {
        throw err;
      }
    });
};

module.exports = handleMigrationChange;
