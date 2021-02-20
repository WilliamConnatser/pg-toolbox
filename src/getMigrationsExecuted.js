const getMigrationsExecuted = async (db, fileName) => {
  return await db
    .query(
      `SELECT exists (SELECT true FROM pg_toolbox_migrations WHERE name = $1)`,
      [fileName]
    )
    .then((res) => {
      return res.rows[0].exists;
    })
    .catch((err) => {
      //If no migrations have run then you will get a pg_toolbox_migrations error: relation "pg_toolbox_migrations" does not exist
      if (err.code === "42P01") return false;
      else throw err;
    });
};

module.exports = getMigrationsExecuted;
