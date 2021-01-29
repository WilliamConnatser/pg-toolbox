#!/usr/bin/env node

require("dotenv").config();
const path = require("path");
const PGToolbox = require("../index");
const { getFiles, alterDatabase } = require("./utilities");

(async () => {
  const db = await PGToolbox();
  await alterDatabase("truncate", db, false);

  db.transaction(async (client) => {
    const migrations = getFiles(
      path.join(process.env.PWD, process.env.PGMIGRATIONS)
    ).map((fileName) => ({
      fileName,
      ...require(path.join(
        process.env.PWD,
        process.env.PGMIGRATIONS,
        fileName
      )),
    }));

    return Promise.all(
      migrations.map(({ fileName, seeds }) => {
        if (!seeds) return Promise.resolve();
        const tableName = seeds.tableName;
        seeds = seeds.seeds;

        if (Array.isArray(seeds) && seeds.length > 0) {
          const seedValues = seeds.map((seed) => Object.values(seed));
          const script = `
        INSERT INTO ${tableName} (${Object.keys(
            seeds[0]
          ).toString()}) VALUES\n\t${seedValues
            .map(
              (array, rowIndex) =>
                `(${array
                  .map(
                    (_, columnIndex) =>
                      `$${rowIndex * seedValues[0].length + (columnIndex + 1)}`
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
          return client.query(script, seedValues.flat());
        }
      })
    );
  }).finally(async () => {
    await db.pool.end();
  });
})();
