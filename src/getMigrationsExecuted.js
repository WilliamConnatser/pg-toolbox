const { sql, SlonikError } = require("slonik");

const getMigrationsExecuted = (pool, fileName) => {
  return pool
    .exists(
      sql`SELECT true FROM pg_toolbox_migrations WHERE name = ${fileName} FETCH FIRST 1 ROWS ONLY`
    )
    .then((rowExists) => {
      return rowExists;
    })
    .catch((err) => {
      //If no migrations have run then you will get an error: relation "pg_toolbox_migrations" does not exist
      if (err.code === "42P01") return false;
      else throw err;
    });
};

module.exports = getMigrationsExecuted;
