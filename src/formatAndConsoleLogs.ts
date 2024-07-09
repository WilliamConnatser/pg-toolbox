const formatAndConsoleLog = (message, query = null) => {
  console.log(
    `[pg-toolbox] ${message}${
      query && query.sql ? `\n\t${query.sql.replace(/\n/g, "\n\t")}` : ""
    }`
  );
};

module.exports = formatAndConsoleLog;
