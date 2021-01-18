const db = require("../index");
const fs = require("fs");

const getFiles = (path) => {
  return fs.readdirSync(path);
};

const rollback = (tableName) => `DROP TABLE IF EXISTS ${tableName}`;
const truncate = (tableName) => `TRUNCATE ${tableName} RESTART IDENTITY`;

const migrateOrRollbackOrTruncate = (type) => {
  return db.transaction(async (client) => {
    const tables = getFiles("../tables");
    switch (type) {
      case "rollback":
        return Promise.all(
          tables
            .reverse()
            .map((table) =>
              table.rollback
                ? client.query(table.rollback)
                : rollback(table.name)
            )
        );
      case "truncate":
        return Promise.all(
          tables
            .reverse()
            .map((table) =>
              table.truncate
                ? client.query(table.truncate)
                : truncate(table.name)
            )
        );
      case "migrate":
        return Promise.all(tables.map((table) => client.query(table.migrate)));
    }
  });
};

module.exports = { migrateOrRollbackOrTruncate, getFiles };
