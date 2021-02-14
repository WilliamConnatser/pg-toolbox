const PGToolbox = require("../index");
const fs = require("fs");
const path = require("path");

const getFiles = (path) => {
  return fs.readdirSync(path);
};

const getMigrationsRan = async (db, fileName) => {
  return await db
    .query(
      `SELECT exists (SELECT true FROM pg_toolbox_migrations WHERE name = $1)`,
      [fileName]
    )
    .then((res) => {
      return res.rows[0].exists;
    })
    .catch((err) => {
      //If no migrations have run then you will get a pg_toolbox_migrations error: relation "pg_toolbox_migrations" does not exist
      if (err.code === "42P01") return false;
      else throw err;
    });
};

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

const truncate = async (db, client, migrations) => {
  //Iterate over migration files in descending alphabetical order
  const reversedMigrations = migrations.reverse();
  for (let migration of reversedMigrations) {
    const { truncate, fileName } = migration;

    //Check if the migrations were even ran before rolling back
    const migrationsRan = await getMigrationsRan(db, fileName);
    if (migrationsRan) {
      console.log(
        truncate,
        `\n[pg-toolbox] Truncate: Running truncate script in ${fileName}`
      );
      await client.query(truncate);
    } else {
      console.log(
        truncate,
        `\n[pg-toolbox] Truncate: ${fileName} has not been migrated yet.`
      );
    }
  }
  return;
};

const alterDatabase = async (type) => {
  const db = PGToolbox();

  const migrations = getFiles(
    path.join(process.env.PWD, process.env.PGMIGRATIONS)
  ).map((fileName) => ({
    fileName,
    ...require(path.join(process.env.PWD, process.env.PGMIGRATIONS, fileName)),
  }));

  return db
    .transaction(async (client) => {
      switch (type) {
        case "rollback":
          //Iterate over migration files in descending alphabetical order
          const reversedMigrations = migrations.reverse();
          for (let migration of reversedMigrations) {
            const { rollback, fileName } = migration;
            //Check if the migrations were even ran before rolling back
            const migrationsRan = await getMigrationsRan(db, fileName);

            //Change back to if(migrationsRan) once done with migration logic
            if (true) {
              console.log(
                rollback,
                `\n[pg-toolbox] Rollback: Running rollback script in ${fileName}`
              );
              await client.query(rollback);
              await await handleMigrationChange(db, client, fileName, false);
            } else {
              console.log(
                rollback,
                `\n[pg-toolbox] Rollback: ${fileName} has not been migrated yet, and so it does not need to be rolled back.`
              );
            }
          }
          break;
        case "truncate":
          //Truncate needs to be abstracted away because it is used both independently, and also as the first step when seeding
          await truncate(db, client, migrations);
          break;
        case "migrate":
          //Iterate over migration files in ascending alphabetical order
          for (let migration of migrations) {
            const { migrate, fileName } = migration;
            const migrationsRan = await getMigrationsRan(db, fileName);

            //Check if the migrations have already been ran before running them
            if (!migrationsRan) {
              console.log(
                migrate,
                `\n[pg-toolbox] Migrate: Running migration script in ${fileName}`
              );
              await client.query(migrate);
              await handleMigrationChange(db, client, fileName, true);
            } else {
              console.log(
                migrate,
                `\n[pg-toolbox] Migrate: Migration file ${fileName} has already ran.`
              );
              return null;
            }
          }
          break;
        case "seed":
          return truncate(db, client, migrations).then(async () => {
            for (let migration of migrations) {
              const { fileName, seeds: seedObject } = migration;
              if (!seedObject) continue;
              const tableName = seedObject.tableName;
              const seeds = seedObject.seeds;

              if (Array.isArray(seeds) && seeds.length > 0) {
                const seedValues = seeds.map((seed) => Object.values(seed));
                const script = `
                INSERT INTO ${tableName} (${Object.keys(seeds[0]).toString()})
                  VALUES ${seedValues
                    .map(
                      (array, rowIndex) =>
                        `(${array
                          .map(
                            (_, columnIndex) =>
                              `$${
                                rowIndex * seedValues[0].length +
                                (columnIndex + 1)
                              }`
                          )
                          .toString()})`
                    )
                    .join(`,\n\t`)}
              `;
                console.log(
                  script,
                  seedValues.flat(),
                  `\n[pg-toolbox] Seed: Running seed script ${fileName}`
                );
                await client.query(script, seedValues.flat());
              }
            }
          });
          break;
      }
    })
    .catch((err) => {
      console.log(err, `\n[pg-toolbox] Error during ${type}`);
    })
    .finally(() => {
      console.log("[pg-toolbox] Closing Connection");
      return db.pool.end();
    });
};

module.exports = { alterDatabase, getFiles };
