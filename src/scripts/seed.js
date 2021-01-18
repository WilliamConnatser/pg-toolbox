#!/usr/bin/env node

require("dotenv").config();
const path = require("path");
const PGToolbox = require("../index");
const { getFiles, alterDatabase } = require("./utilities");

(async () => {
  const db = await PGToolbox({ connection: process.env.PG_CONNECTION_STRING });
  await alterDatabase(db, "truncate", false);

  db.transaction(async (client) => {
    const tablesPath = path.join(process.env.PWD, "db/tables");
    const tables = getFiles(tablesPath);
    return Promise.all(
      tables.map((table, i) => {
        const tableConfig = require(path.join(tablesPath, table));
        if (Array.isArray(tableConfig.seeds) && tableConfig.seeds.length > 0) {
          const seedValues = tableConfig.seeds.map((seed) =>
            Object.values(seed)
          );
          const query = `
        INSERT INTO ${tableConfig.name} (${Object.keys(
            tableConfig.seeds[0]
          ).toString()}) VALUES\n\t${seedValues
            .map(
              (array, rowIndex) =>
                `(${array
                  .map(
                    (item, columnIndex) =>
                      `$${rowIndex * seedValues[0].length + (columnIndex + 1)}`
                  )
                  .toString()})`
            )
            .join(`,\n\t`)}
      `;
          console.log(query, `\n[pg-toolbox] Seed: Running query #${i + 1}`);
          console.log(seedValues.flat(), "Inserting this");
          return client.query(query, seedValues.flat());
        }
      })
    );
  }).finally(async () => {
    await db.pool.end();
  });
})();
