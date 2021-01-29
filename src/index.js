require("dotenv").config();
const { Pool } = require("pg");

class _PGToolbox {
  constructor(config) {
    //Connect to the database
    if (
      !process.env.PGURI &&
      !process.env.PGHOST &&
      !process.env.PGUSER &&
      !process.env.PGDATABASE &&
      !process.env.PGPASSWORD &&
      !process.env.PGPORT
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
    try {
      return await this.pool.query(text, params);
    } catch (err) {
      console.log(text, "[PGToolbox] Errored query");
      console.log(err, "[PGToolbox] Error executing query");
      throw err;
    }
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
        client.release();
        return res;
      } catch (err) {
        await client.query("ROLLBACK");
        console.log(
          err,
          "\n[PGToolbox] Error during transaction- Changes rolled back"
        );
        await client.release();
        throw err;
      }
    });
  }
}

const PGToolbox = function (payload) {
  if (payload instanceof _PGToolbox) return payload;
  else if (!payload || payload instanceof Object)
    return new _PGToolbox(payload);
};

module.exports = PGToolbox;
