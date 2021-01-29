const PGToolbox = require("../index");
const fs = require("fs");
const path = require("path");

const getFiles = (path) => {
  return fs.readdirSync(path);
};

const alterDatabase = async (type, db = null, closePool = true) => {
  if (!db) db = PGToolbox();
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
          return Promise.all(
            migrations.reverse().map(({ rollback, fileName }) => {
              console.log(
                rollback,
                `\n[pg-toolbox] Rollback: Running rollback script in ${fileName}`
              );
              return client.query(rollback);
            })
          );
        case "truncate":
          return Promise.all(
            migrations.reverse().map(({ truncate, fileName }) => {
              console.log(
                truncate,
                `\n[pg-toolbox] Truncate: Running truncate script in ${fileName}`
              );
              return client.query(truncate);
            })
          );
        case "migrate":
          return Promise.all(
            migrations.map(({ migrate, fileName }) => {
              console.log(
                migrate,
                `\n[pg-toolbox] Migrate: Running migration script in ${fileName}`
              );
              return client.query(migrate);
            })
          );
      }
    })
    .catch((err) => {
      console.log(err, `\n[pg-toolbox] Error during ${type}`);
    })
    .finally(async () => {
      //Sometimes we want to alter the database without closing the pool
      //EI. when truncating before seeding
      if (closePool) await db.pool.end();
    });
};

module.exports = { alterDatabase, getFiles };
