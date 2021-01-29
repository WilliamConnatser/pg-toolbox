# pg-toolbox

# WARNING: brand new largely untested package with an unstable API

- Utility functions and scripts built on top of the `pg` Postgres database package.
- This package exposes a lot of APIs in that package so please refer to the [pg documentation](https://node-postgres.com/) for a lower level understanding of this package.
- Automatically establishes a pg Pool connection
  - When PGToolbox is initialized, it automatically connects to the database using environment variables.
  - PG's Pool object is accessible directly at `PGToolbox.pool` if you ever need it, but most of the time you will probably be using utility functions like `PGToolbox.query(text, params)` or `PGToolbox.transaction((client) => callback)`
- Execute a query with PGToolbox.query(text, params)
  - This utility function automatically uses the pg Pool instance created when the package is initialized, and is the safest way to run a query (no chance of leaking connections- see the `PGToolbox.transaction()` section below)
  - Exact same API as `PG.Pool.query()` with a wrapper which logs error to the console.
- Execute a transaction with PGToolbox.transaction((client) => callback)
  - A callback function is sent in which is wrapped in `BEGIN` and `COMMIT` SQL statements. If an error occurs in your callback, then the `ROLLBACK` statement is automatically called to rollback the transaction. Make sure to "re-throw" any errors if you handle them inside your callback or else the transaction will not be rolled back.
  - Accepts a callback with the first argument being a client object
  - Automatically releases the client after the transaction is committed successfully or rolled back.
- Check out a client with `PGToolbox.getClient()`
  - In most cases you will probably use
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

Example `.env`

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

module.exports = {
migrate: `CREATE TABLE companies ( id SERIAL PRIMARY KEY, ticker VARCHAR(6) UNIQUE, cusip VARCHAR(9) NOT NULL UNIQUE, given_name VARCHAR(50) NOT NULL UNIQUE, readable_name VARCHAR(50) NOT NULL UNIQUE )`,
rollback: `DROP TABLE IF EXISTS companies`,
truncate: `TRUNCATE companies RESTART IDENTITY CASCADE`,
};

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

The CLI commands use the migration definitions you define to manage your database.

## npx pg-migrate

    Runs migration scripts

## npx pg-rollback

    Runs rollback scripts

## npx pg-truncate

    Runs truncate scripts

## npx pg-seed

    Runs truncate scripts, then seeds the data provided into your tables
