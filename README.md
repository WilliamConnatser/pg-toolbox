# pg-toolbox

# WARNING: brand new largely untested package with an unstable API

Utility functions built on top of the `pg` Postgres database package. A couple of them are straight out of the examples in the pg package's [documentation](https://node-postgres.com/), and some are ones I thought would be convenient to have. This package exposes a lot of APIs in that package so please refer to that documentation for a lower level understanding of this package.

- Automatic pool connection
  - When PGToolbox is initialized it automatically connects to the database using the configurations provided passed into the PG.Pool.connect() function.
  - PG's Pool object is accessible directly at PGToolbox.pool if you ever need it.
- Execute a query with PGToolbox.query(text, params)
  - Automatically uses the pg Pool instance created when the package is initialized.
  - Same API as PG.Pool.query()
- Execute a transaction with PGToolbox.transaction((client) => callback)
  - A callback function is sent in which is wrapped in `BEGIN` and `COMMIT` SQL statements. If an error occurs in your callback the `ROLLBACK` statement is automatically called to rollback the transaction.
  - Accepts a callback with the first argument being a client object.
  - Automatically releases the client after the transaction is committed successfully or rolled back.
- Check out a client with PGToolbox.getClient()
  - Clients must be released after their usage or else connections may not be closed properly. Read more about this in the PG documentation if using getClient().
- CLI Commands For Database Management
  - npx pg-migrate
  - npx pg-rollback
  - npx pg-truncate
  - npx pg-seed

# Usage

## Install the NPM Package

```
npm install pg-toolbox
```

## Initialize the package in `/db/index.js`

You will import this to make database queries in your application.

```
const PGToolbox = require("pg-toolbox");

const db = PGToolbox({
  connection: process.env.PG_CONNECTION_STRING,
});

module.exports = db;
```

## Create an ENV file in the root directory of your project

Example `.env`

```
PG_CONNECTION_STRING=PG DATABASE CONNECTION STRING
```

## Create your table definitions

Table definitions are consumed after the CLI commands must be in the `/db/tables` folder. They will be executed in alphabetical order (ascending when migrating and seeding, and descending when truncating or rolling back).

Only the name and migrate properties are required. Table definition schema:

- name
  - String
  - Name of the table
  - Mandatory
- migrate
  - SQL script
  - Script ran to create the table during migrations
  - Mandatory - no default script
- rollback
  - SQL script
  - Script ran to delete the table during rollback
  - Optional
  - Default script: `DROP TABLE IF EXISTS table_name`
- truncate
  - SQL script
  - Script ran to truncate the table during truncate and seeding
  - Optional
  - Default script: `TRUNCATE table_name RESTART IDENTITY CASCADE`
- seeds
  - Array of objects
  - Each object should represent a single row to be seeded with they keys of the object being table columns and the values of the object being the values of the columns.
  - Optional

## Example table definitions:

`/db/tables/1-funds.js`

```
module.exports = {
  name: "funds",
  migrate: `CREATE TABLE funds (
    id  SERIAL PRIMARY KEY,
    ticker  VARCHAR(5) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL UNIQUE,
    url VARCHAR(150) NOT NULL UNIQUE
  )`,
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
};
```

`/db/tables/2-companies.js`

```
module.exports = {
  name: "companies",
  migrate: `CREATE TABLE companies (
    id  SERIAL PRIMARY KEY,
    ticker  VARCHAR(6) UNIQUE,
    cusip VARCHAR(9) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL UNIQUE
  )`,
};
```

`/db/tables/3-holdings.js`

```
module.exports = {
  name: "holdings",
  migrate: `CREATE TABLE holdings (
    id  SERIAL PRIMARY KEY,
    day DATE NOT NULL,
    fund INTEGER REFERENCES funds (id) ON DELETE RESTRICT,
    company INTEGER REFERENCES companies (id) ON DELETE RESTRICT,
    shares INT NOT NULL,
    value DECIMAL(14,2) NOT NULL UNIQUE,
    weight DECIMAL(5,2) NOT NULL UNIQUE,
    CONSTRAINT day_fund_company UNIQUE(day,fund,company)
  )`,
};
```

# CLI Commands

The CLI commands use the table definitions you define to manage your database.

## npx pg-migrate

    Creates all of your tables using the migrate script in your table definitions

## npx pg-rollback

    Deletes all of your tables

## npx pg-truncate

    Truncates all of your tables

## npx pg-seed

    Truncates then seeds data into all of your tables
