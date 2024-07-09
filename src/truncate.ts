const getMigrationsExecuted = require("./getMigrationsExecuted");
const formatAndConsoleLog = require("./formatAndConsoleLog");

const truncate = async (pool, transactionConnection, toolboxFiles) => {
  //Iterate over migration files in descending alphabetical order
  const toolboxFilesReversed = toolboxFiles.slice().reverse();
  for (let toolboxFile of toolboxFilesReversed) {
    const { truncate, fileName } = toolboxFile;

    //Check if the toolbox file migration script was already executed before truncating
    const migrationsExecuted = await getMigrationsExecuted(pool, fileName);
    if (migrationsExecuted) {
      if (truncate) {
        formatAndConsoleLog(
          `Truncate: Running truncate script in ${fileName}`,
          truncate
        );
        await transactionConnection.query(truncate);
      } else {
        formatAndConsoleLog(
          `Truncate: ${fileName} does not have a truncate script.`
        );
      }
    } else {
      formatAndConsoleLog(`Truncate: ${fileName} has not been migrated yet.`);
    }
  }
};

module.exports = truncate;
