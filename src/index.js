#!/usr/bin/env node

require("dotenv").config();
const { createPool } = require("slonik");
const path = require("path");
const getToolboxFiles = require("./getToolboxFiles");
const handleMigrationChange = require("./handleMigrationChange");
const { connect } = require("http2");

const pool = createPool(process.env.PGURI);

const option = process.argv[2];

switch (option) {
  case ("-help", "--help"):
    console.log(`Syntax:
  pg-toolbox [options]

(Note: Preceding options with both - and -- are OK)
  
Options:
  --help (I guess you figured this one out!)
  --migrate (Execute migration scripts which have not already been executed)
  --rollback (Execute rollback scripts for migrations which have already been executed)
  --seed (Execute seed scripts for migrations which have already been executed)
  --truncate (Execute truncate scripts for migrations which have already been executed)
  `);
  case ("--migrate",
  "-migrate",
  "--rollback",
  "-rollback",
  "--seed",
  "-seed",
  "--truncate",
  "-truncate"):
    const toolboxFiles = getToolboxFiles(
      path.join(process.env.PWD, process.env.PGMIGRATIONS)
    ).map((fileName) => ({
      fileName,
      ...require(path.join(
        process.env.PWD,
        process.env.PGMIGRATIONS,
        fileName
      )),
    }));

    pool.connect((connection) => {
      return connection.transaction(async (transactionConnection) => {
        switch (option) {
          case ("--rollback", "-rollback"):
            //Iterate over toolbox files in descending alphabetical order
            const toolboxFilesReversed = toolboxFiles.reverse();
            for (let toolboxFile of toolboxFilesReversed) {
              const { rollback, fileName } = toolboxFile;

              const migrationsExecuted = await getMigrationsExecuted(
                connection,
                fileName
              );

              //Check if this toolbox file migration script was executed before rolling back
              if (migrationsExecuted) {
                console.log(
                  rollback,
                  `\n[pg-toolbox] Rollback: Executing rollback script in ${fileName}`
                );
                await transactionConnection.query(rollback);
                await handleMigrationChange(
                  connection,
                  transactionConnection,
                  fileName,
                  false
                );
              } else {
                console.log(
                  rollback,
                  `\n[pg-toolbox] Rollback: ${fileName} has not been migrated yet so it does not need to be rolled back.`
                );
              }
            }
            break;
          case ("--truncate", "-truncate"):
            //Truncate needs to be abstracted away because it is used both independently, and also as the first step of the seeding process
            await truncate(connection, transactionConnection, toolboxFiles);
            break;
          case ("--migrate", "-migrate"):
            //Iterate over migration files in ascending alphabetical order
            for (let toolboxFile of toolboxFiles) {
              const { migrate, fileName } = toolboxFile;
              const migrationsExecuted = await getMigrationsExecuted(
                connection,
                fileName
              );

              //Check if the toolbox file migration script was already executed before Executing them
              if (!migrationsExecuted) {
                console.log(
                  migrate,
                  `\n[pg-toolbox] Migrate: Executing migration script in ${fileName}`
                );
                await transactionConnection.query(migrate);
                await handleMigrationChange(
                  connection,
                  transactionConnection,
                  fileName,
                  true
                );
              } else {
                console.log(
                  migrate,
                  `\n[pg-toolbox] Migrate: Migration file ${fileName} has already been executed.`
                );
              }
            }
            break;
          case ("-seed", "--seed"):
            return truncate(
              connection,
              transactionConnection,
              toolboxFiles
            ).then(async () => {
              for (let toolboxFile of toolboxFiles) {
                const { fileName, seeds: seedObject } = toolboxFile;
                if (!seedObject) continue;
                const tableName = seedObject.tableName;
                const seeds = seedObject.seeds;

                if (Array.isArray(seeds) && seeds.length > 0) {
                  const seedValues = seeds.map((seed) => Object.values(seed));
                  const script = `
                      INSERT INTO ${tableName} (${Object.keys(
                    seeds[0]
                  ).toString()})
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
                    `\n[pg-toolbox] Seed: Executing seed script ${fileName}`
                  );
                  await transactionConnection.query(script, seedValues.flat());
                }
              }
            });
            break;
        }
      });
    });
    break;
  default:
    console.log(
      "Invalid option provided - Execute `pg-toolbox -help` for more information."
    );
    break;
}
