require("dotenv").config();
const PGToolbox = require("../index");
const fs = require("fs");
const path = require("path");

const getFiles = (path) => {
  return fs.readdirSync(path);
};

const alterDatabase = async (db, type, closePool = true) => {
  //For each method (migrate, rollback, or seed)
  //We check to see if the user has defined a custom script
  return db
    .transaction(async (client) => {
      const tables = await getFiles(path.join(process.cwd(), "./db/tables"));

      switch (type) {
        case "rollback":
          return Promise.all(
            tables.reverse().map((table, i, arr) => {
              const tableData = require(path.join(
                process.env.PWD,
                "db/tables",
                table
              ));
              const query = tableData.rollback
                ? tableData.rollback
                : `\n\tDROP TABLE IF EXISTS ${tableData.name}`;

              console.log(
                query,
                `\n[pg-toolbox] Rollback: Running query #${arr.length - 1 + i}`
              );
              return client.query(query);
            })
          );
        case "truncate":
          return Promise.all(
            tables.reverse().map((table, i, arr) => {
              const tableData = require(path.join(
                process.env.PWD,
                "db/tables",
                table
              ));
              const query = tableData.truncate
                ? tableData.truncate
                : `\n\tTRUNCATE ${tableData.name} RESTART IDENTITY CASCADE`;
              console.log(
                query,
                `\n[pg-toolbox] Truncate: Running query #${arr.length - 1 + i}`
              );
              return client.query(query);
            })
          );
        case "migrate":
          return Promise.all(
            tables.map((table, i) => {
              const query =
                "\n\t" +
                require(path.join(process.env.PWD, "db/tables", table)).migrate;
              console.log(
                query,
                `\n[pg-toolbox] Migrate: Running query #${i + 1}`
              );
              return client.query(query);
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
