const { Pool } = require("pg");

class _PGToolbox {
  constructor() {
    //Connect to the database
    if (
      !process.env.PGURI &&
      (!process.env.PGHOST ||
        !process.env.PGUSER ||
        !process.env.PGDATABASE ||
        !process.env.PGPASSWORD ||
        !process.env.PGPORT)
    ) {
      throw new Error(
        "[PGToolbox] No environment variables provided to connect to the database"
      );
    }

    this.pool = process.env.PGURI
      ? new Pool({ connectionString: process.env.PGURI })
      : new Pool();
  }

  async query(text, params) {
    return await this.pool.query(text, params);
  }

  async getClient() {
    const client = await this.pool.connect();
    const query = client.query;
    const release = client.release;
    // set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
      console.error(
        "[PGToolbox]  A client has been checked out for more than 5 seconds!"
      );
      console.error(
        `[PGToolbox]  The last executed query on this client was: ${client.lastQuery}`
      );
    }, 5000);
    // monkey patch the query method to keep track of the last query executed
    client.query = (...args) => {
      client.lastQuery = args;
      return query.apply(client, args);
    };
    client.release = () => {
      // clear our timeout
      clearTimeout(timeout);
      // set the methods back to their old un-monkey-patched version
      client.query = query;
      client.release = release;
      return release.apply(client);
    };
    return client;
  }

  async transaction(callback) {
    return await this.getClient().then(async (client) => {
      try {
        await client.query("BEGIN");
        const res = await callback(client);
        await client.query("COMMIT");
        return res;
      } catch (err) {
        await client.query("ROLLBACK");
        console.log(
          err,
          "\n[PGToolbox] Error during transaction- Changes rolled back"
        );
        throw err;
      } finally {
        client.release();
      }
    });
  }
}

//Create new PGToolbox instance without the new keyword
const PGToolbox = function (payload) {
  if (payload instanceof _PGToolbox) return payload;
  else if (!payload || payload instanceof Object)
    return new _PGToolbox(payload);
};

module.exports = PGToolbox;
