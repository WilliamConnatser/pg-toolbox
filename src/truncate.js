const truncate = async (connection, transactionConnection, toolboxFiles) => {
  //Iterate over migration files in descending alphabetical order
  const toolboxFilesReversed = toolboxFiles.reverse();
  for (let toolboxFile of toolboxFilesReversed) {
    const { truncate, fileName } = toolboxFile;

    //Check if the toolbox file migration script was already executed before truncating
    const migrationsExecuted = await getMigrationsExecuted(
      connection,
      fileName
    );
    if (migrationsExecuted) {
      console.log(
        truncate,
        `\n[pg-toolbox] Truncate: Running truncate script in ${fileName}`
      );
      await transactionConnection.query(truncate);
    } else {
      console.log(
        truncate,
        `\n[pg-toolbox] Truncate: ${fileName} has not been migrated yet.`
      );
    }
  }
};

module.exports = truncate;
