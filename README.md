# WARNING: DO NOT USE UNTIL VERSION 1.2 OR GREATER - Brand new and largely untested package with an unstable API

# pg-toolbox

- Utility functions and CLI scripts built on top of the `pg` Postgres database package.
- This package exposes a lot of APIs in that package so please refer to the [pg documentation](https://node-postgres.com/) for a lower level understanding of this package.
- Automatically establishes a `pg` Pool connection
  - When PGToolbox is initialized, it automatically connects to the database using environment variables. Whereas the `pg` package has this functionality if you are using the `PGHOST`, `PGUSER`, etc, environment variables, this package adds the ability to declare a single environment variable `PGURI` to automatically connect with a URI connection string.
  - PG's Pool object is accessible directly at `PGToolbox.pool` if you ever need it, but most of the time you will probably be using utility functions like `PGToolbox.query(text, params)` or `PGToolbox.transaction((client) => callback)`
- Execute a query with `PGToolbox.query(text, params)`
  - This utility function automatically uses the pg Pool instance created when the package is initialized, and is the safest way to run a query because there is no chance of leaking connections.
  - Exact same API as `PG.Pool.query()`
- Execute a transaction with `PGToolbox.transaction((client) => callback)`
  - Accepts a callback with the first argument being a client object
  - Automatically releases the client after the transaction is committed successfully or rolled back.
  - A callback function should be sent in as the first argument, and the callback is executed in between `BEGIN` and `COMMIT` SQL statements. If an error occurs in your callback, then the `ROLLBACK` statement is automatically called to rollback the transaction.
  - Make sure to "re-throw" any errors if you handle or catch them inside your callback, or else the transaction will not be rolled back properly.
  - If there are any queries which you expect to error out inside the callback function (for instance, querying for a table tht might not exist yet), but you want to handle the error and continue with the transaction, then do not use the client in the transaction callback to make that query. If you use the transaction's client, and a query errors out, then even if you catch the error the rest of the queries done with that client will not work. Use `PG.Pool.query()` for these queries instead.. you can use it inside the transaction call back with no issues.
- Check out a client with `PGToolbox.getClient()`
  - In most cases you should probably use `PGToolbox.query()` or `PGToolbox.transaction()`
  - Clients must be released after their usage or else connections may not be closed properly. Read more about this in the PG documentation if using getClient()
- CLI Commands For Database Management
  - `npx pg-migrate`
  - `npx pg-rollback`
  - `npx pg-truncate`
  - `npx pg-seed`

# Usage

## Install the NPM Package

```
npm install pg-toolbox
```

## Initialize the package in `/db/index.js`

You will import this object into other modules in order to make database queries in your application using the above described utility functions.

```
const PGToolbox = require("pg-toolbox");

const db = PGToolbox();

module.exports = db;
```

## Create an ENV file in the root directory of your project

You only need to do this in development, because a development dependency `dotenv` is used to red the environment variables when you are running the CLI scripts to manage your database.

Example `.env` file:

```
PGMIGRATIONS=/path/to/db/migration/folder
PGURI=
# Optionally, use individual values instead of a database connection string URI:
# PGHOST=
# PGUSER=
# PGDATABASE=
# PGPASSWORD=
# PGPORT=


```

## Create your migration definitions

- Migration definitions are consumed by the CLI commands, and are retrieved using the PGMIGRATIONS environment variable which represents the path from the root folder of your project to the migrations folder.
- The scripts will be executed in alphabetical order (ascending when migrating and seeding, or descending when truncating and rolling back).
- Migration definitions are object literals with the following keys:
  - `migrate`
    - SQL script
    - Script ran during migrations
    - Required
    - Example: `CREATE TABLE table_name ( id SERIAL PRIMARY KEY, ticker VARCHAR(5) NOT NULL UNIQUE, name VARCHAR(50) NOT NULL UNIQUE, url VARCHAR(150) NOT NULL UNIQUE )`
  - `rollback`
    - SQL script
    - Script ran to drop tables during rollback
    - Required
    - Example: `DROP TABLE IF EXISTS table_name`
  - `truncate`
    - SQL script
    - Script ran to truncate tables during truncate and seeding
    - Required
    - Example: `TRUNCATE table_name RESTART IDENTITY CASCADE`
  - `seeds`
    - Object literal with two keys:
      - `tableName`
        - String
        - Used to determine which table to insert the seeds
        - Required
      - `seeds`
        - Array of object literals
          - Each object in the array should represent a single row to be seeded with they keys of the object being table columns, and the values of the object being the values of the columns.
    - Optional
    - Example: `{ tableName: "funds", seeds: [ { name: "ARK Innovation ETF", ticker: "ARKK", url: "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_INNOVATION_ETF_ARKK_HOLDINGS.csv", },...]`

## Example migration definitions:

`/db/migrations/1-funds.js`

```
module.exports = {
  migrate: `CREATE TABLE funds (
      id  SERIAL PRIMARY KEY,
      ticker  VARCHAR(5) NOT NULL UNIQUE,
      name VARCHAR(50) NOT NULL UNIQUE,
      url VARCHAR(150) NOT NULL UNIQUE
    )`,
  rollback: `DROP TABLE IF EXISTS funds`,
  truncate: `TRUNCATE funds RESTART IDENTITY CASCADE`,
  seeds: {
    tableName: "funds",
    seeds: [
      {
        name: "ARK Innovation ETF",
        ticker: "ARKK",
        url:
          "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_INNOVATION_ETF_ARKK_HOLDINGS.csv",
      },
      {
        name: "ARK Autonomous Technology & Robotics ETF",
        ticker: "ARKQ",
        url:
          "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_AUTONOMOUS_TECHNOLOGY_&_ROBOTICS_ETF_ARKQ_HOLDINGS.csv",
      },
      {
        name: "ARK Next Generation Internet ETF",
        ticker: "ARKW",
        url:
          "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_NEXT_GENERATION_INTERNET_ETF_ARKW_HOLDINGS.csv",
      },
      {
        name: "ARK Genomic Revolution ETF",
        ticker: "ARKG",
        url:
          "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_GENOMIC_REVOLUTION_MULTISECTOR_ETF_ARKG_HOLDINGS.csv",
      },
      {
        name: "ARK Fintech Innovation ETF",
        ticker: "ARKF",
        url:
          "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_FINTECH_INNOVATION_ETF_ARKF_HOLDINGS.csv",
      },
    ],
  },
};
```

`/db/migrations/2-companies.js`

```
module.exports = {
  migrate: `CREATE TABLE companies (
    id  SERIAL PRIMARY KEY,
    ticker  VARCHAR(6) UNIQUE,
    cusip VARCHAR(9) NOT NULL UNIQUE,
    given_name VARCHAR(50) NOT NULL UNIQUE,
    readable_name VARCHAR(50) NOT NULL UNIQUE
  )`,
  rollback: `DROP TABLE IF EXISTS companies`,
  truncate: `TRUNCATE companies RESTART IDENTITY CASCADE`,
};
```

`/db/tables/3-holdings.js`

```
module.exports = {
  migrate: `CREATE TABLE holdings (
    id  SERIAL PRIMARY KEY,
    day DATE NOT NULL,
    fund INTEGER REFERENCES funds (id) ON DELETE RESTRICT,
    company INTEGER REFERENCES companies (id) ON DELETE RESTRICT,
    shares INT NOT NULL,
    value DECIMAL(14,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    CONSTRAINT day_fund_company UNIQUE(day,fund,company)
  )`,
  rollback: `DROP TABLE IF EXISTS holdings`,
  truncate: `TRUNCATE holdings RESTART IDENTITY CASCADE`,
};
```

# CLI Commands

The CLI commands use the migration definitions you define (see above) to manage your database.

## npx pg-migrate

- Runs migration scripts in ascending alphabetical order
- Skips any migrations which have already been ran
- A table named `pg_toolbox_migrations` is automatically created and updated to keep track of which migrations have already been executed.

## npx pg-rollback

- Runs rollback scripts in descending alphabetical order
- The migration table named `pg_toolbox_migrations` is automatically dropped after all rollback scripts have been processed.

## npx pg-truncate

- Runs truncate scripts in descending alphabetical order

## npx pg-seed

- Runs truncate scripts in descending alphabetical order
- Then seeds the data provided into your tables processing scrips in ascending alphabetical order
- For now the same columns must be provided for all seeds because they are inserted in a single statement, but in the future I will write an algorithm to split up seeds provided with different columns into separate batches. It is on my future enhancement to-do list!
