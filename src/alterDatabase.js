const { createPool } = require("slonik");
const path = require("path");
const formatAndConsoleLog = require("./formatAndConsoleLog");
const getMigrationsExecuted = require("./getMigrationsExecuted");
const getToolboxFiles = require("./getToolboxFiles");
const handleMigrationChange = require("./handleMigrationChange");
const truncate = require("./truncate");
const pool = createPool(process.env.PGURI);

const alterDatabase = async (option) => {
  const importToolboxFiles = getToolboxFiles(
    path.join(process.env.PWD, process.env.PGMIGRATIONS)
  ).map(async (fileName) => ({
    fileName,
    ...(await require(path.join(
      process.env.PWD,
      process.env.PGMIGRATIONS,
      fileName
    ))()),
  }));

  Promise.all(importToolboxFiles).then((toolboxFiles) => {
    return pool.transaction(async (transactionConnection) => {
      switch (option) {
        case "--rollback":
        case "-rollback":
          //Iterate over toolbox files in descending alphabetical order
          const toolboxFilesReversed = toolboxFiles.reverse();

          for (let toolboxFile of toolboxFilesReversed) {
            const { rollback, fileName } = toolboxFile;

            const migrationsExecuted = await getMigrationsExecuted(
              pool,
              fileName
            );

            //Check if this toolbox file migration script was executed before rolling back
            if (migrationsExecuted) {
              formatAndConsoleLog(
                `[pg-toolbox] Rollback: Executing rollback script in ${fileName}`,
                rollback
              );
              await transactionConnection.query(rollback);
              await handleMigrationChange(
                pool,
                transactionConnection,
                fileName,
                false
              );
            } else {
              formatAndConsoleLog(
                `Rollback: ${fileName} has not been migrated yet.`
              );
            }
          }
          break;
        case "--truncate":
        case "-truncate":
          //Truncate needs to be abstracted away because it is used both independently, and also as the first step of the seeding process
          await truncate(pool, transactionConnection, toolboxFiles);
          break;
        case "--migrate":
        case "-migrate":
          //Iterate over toolbox files in ascending alphabetical order
          for (let toolboxFile of toolboxFiles) {
            const { migrate, fileName } = toolboxFile;
            const migrationsExecuted = await getMigrationsExecuted(
              pool,
              fileName
            );

            //Check if the toolbox file migration script was already executed before Executing them
            if (!migrationsExecuted) {
              formatAndConsoleLog(
                `Migrate: Executing migration script in ${fileName}`,
                migrate
              );
              await transactionConnection.query(migrate);
              await handleMigrationChange(
                pool,
                transactionConnection,
                fileName,
                true
              );
            } else {
              formatAndConsoleLog(
                `Migrate: Migration file ${fileName} has already been executed.`
              );
            }
          }
          break;
        case "-seed":
        case "--seed":
          return truncate(pool, transactionConnection, toolboxFiles).then(
            async () => {
              for (let toolboxFile of toolboxFiles) {
                const { fileName, seed } = toolboxFile;
                const migrationsExecuted = await getMigrationsExecuted(
                  pool,
                  fileName
                );
                if (migrationsExecuted) {
                  if (!seed) {
                    formatAndConsoleLog(
                      `Seed: Toolbox file ${fileName} does not contain a seed script.`
                    );
                  } else {
                    formatAndConsoleLog(
                      `Seed: Executing seed script ${fileName}`,
                      seed
                    );
                    await transactionConnection.query(seed);
                  }
                } else {
                  formatAndConsoleLog(
                    `Seed: ${fileName} has not been migrated yet.`
                  );
                }
              }
            }
          );
          break;
      }
    });
  });
};

module.exports = alterDatabase;
