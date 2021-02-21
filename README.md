# WARNING: DO NOT USE UNTIL VERSION 1.2 OR GREATER - Brand new and largely untested package with an unstable API

# pg-toolbox

# Why?

I decided to create this package after reading this blog post from the creator of the NPM Package [slonik](https://github.com/gajus/slonik) ([Gajus Kuizinas](https://github.com/gajus)). In the blog post he makes what I think is a solid argument to write pure SQL instead of using libraries like ORMs or Knex.JS as a way to solidify your SQL knowledge, and due to the fact that dynamic query builders (like Knex.JS, for instance) are overkill for most applications and use cases.

I had heavily relied on Knex.JS in my career up to the time read this blog post, and it really resonated with me so I started using `slonik` to query PostgreSQL databases. However, I had grown used to the CLI commands in `knex` to manage migrations and seeding, and `slonik` does not have that capability so I built this package to be used in tandem with `slonik` in order to manage your database.

If you use knex and/or another ORM in all of your projects, then I would implore to give `slonik` and `pg-toolbox` a try! Especially if you are a students, or in an early stage of your career, because I guarantee you once you start writing pure SQL you will realize there are gaps in your SQL knowledge. Using these packages will help you solidify your SQL knowledge in a practical and project-based setting by building applications!

# Features

- Several CLI commands to migrate, rollback, truncate, or seed your database.
- No bloat or production dependencies. The only packages this package uses (`dotenv` and `slonik`) are development dependencies.
- Ability to inject dynamic values into Toolbox files' scripts
- Ability to dynamically build the Toolbox files' scripts

# Usage

## Install the NPM Package

pg-toolbox should be installed as a development dependency so no bloat is added to your app. All of pg-toolboxs's CLI scripts are executed in a development environment.

### With NPM

```
npm install pg-toolbox -D
```

### With yarn

```
yarn add pg-toolbox -D
```

## Create an .env file in the root directory of your project

You only need to do this in the development environment because the development dependency `dotenv` is used to read the environment variables when you are running the CLI scripts to manage your database.

Example `.env` file:

```
PGMIGRATIONS=/path/from/root/folder/of/project/to/folder/containing/toolbox/files
PGURI=postgres://user:pass@host:port_number/database
```

## Create your toolbox files

- Toolbox files are consumed by the scripts which run after executing the CLI commands
- All toolbox files inside the pg-toolbox folder are consumed by the CLI commands. The filepath from the root folder of your project to the folder containing the toolbox files is defined by the PGMIGRATIONS environment variable.
- All scripts executed by the CLI commands are executed in alphabetical order (ascending when migrating and seeding, or descending when truncating and rolling back).
- Toolbox files must export an async function which returns an object literal.
- The object literal should contain the following keys: `migrate`, `rollback`, `truncate`, and `seed`.
- The only optional keys of this object are `seed` and `truncate`- `migrate` and `rollback` are mandatory.
- Each value of the object is a `slonik` query wrapped in backticks, and preceded by a sql template tag which can be imported like so: `const {sql} = require('pg-toolbox')`
- See the Slonik Documentation to discover many utility functions for advanced query building.

## Example Toolbox Files:

### `/db/pg-toolbox/1-funds.js`

```
const { sql } = require("pg-toolbox");

module.exports = async () => ({
  migrate: sql`CREATE TABLE funds (
      id  SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL UNIQUE,
      ticker  VARCHAR(5) NOT NULL UNIQUE,
      url VARCHAR(150) NOT NULL UNIQUE
    )`,
  rollback: sql`DROP TABLE IF EXISTS funds`,
  truncate: sql`TRUNCATE funds RESTART IDENTITY CASCADE`,
  seed: sql`INSERT INTO funds (name, ticker, url)
  SELECT *
  FROM ${sql.unnest(
    [
      [
        "ARK Innovation ETF",
        "ARKK",
        "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_INNOVATION_ETF_ARKK_HOLDINGS.csv",
      ],
      [
        "ARK Autonomous Technology & Robotics ETF",
        "ARKQ",
        "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_AUTONOMOUS_TECHNOLOGY_&_ROBOTICS_ETF_ARKQ_HOLDINGS.csv",
      ],
      [
        "ARK Next Generation Internet ETF",
        "ARKW",
        "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_NEXT_GENERATION_INTERNET_ETF_ARKW_HOLDINGS.csv",
      ],
      [
        "ARK Genomic Revolution ETF",
        "ARKG",
        "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_GENOMIC_REVOLUTION_MULTISECTOR_ETF_ARKG_HOLDINGS.csv",
      ],
      [
        "ARK Fintech Innovation ETF",
        "ARKF",
        "https://ark-funds.com/wp-content/fundsiteliterature/csv/ARK_FINTECH_INNOVATION_ETF_ARKF_HOLDINGS.csv",
      ],
    ],
    ["varchar", "varchar", "varchar"]
  )}`,
});
```

### `/db/pg-toolbox/2-companies.js`

```
const { sql } = require("pg-toolbox");

module.exports = async () => ({
  migrate: sql`CREATE TABLE companies (
    id  SERIAL PRIMARY KEY,
    given_ticker  VARCHAR(50) UNIQUE,
    readable_ticker  VARCHAR(6) UNIQUE,
    cusip VARCHAR(9) NOT NULL UNIQUE,
    given_name VARCHAR(50) NOT NULL UNIQUE,
    readable_name VARCHAR(50) UNIQUE
  )`,
  rollback: sql`DROP TABLE IF EXISTS companies`,
  truncate: sql`TRUNCATE companies RESTART IDENTITY CASCADE`,
});

```

### `/db/pg-toolbox/3-holdings.js`

```
const { sql } = require("pg-toolbox");

module.exports = async () => ({
  migrate: sql`CREATE TABLE holdings (
    id  SERIAL PRIMARY KEY,
    day DATE NOT NULL,
    fund INTEGER REFERENCES funds (id) ON DELETE RESTRICT,
    company INTEGER REFERENCES companies (id) ON DELETE RESTRICT,
    shares INT NOT NULL,
    value DECIMAL(14,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    CONSTRAINT day_fund_company UNIQUE(day,fund,company)
  )`,
  rollback: sql`DROP TABLE IF EXISTS holdings`,
  truncate: sql`TRUNCATE holdings RESTART IDENTITY CASCADE`,
});
```

# CLI Commands

The CLI commands use the toolbox files you defined (see above) to manage your database.

## npx pg-toolbox --migrate

- Executes migration scripts in **ascending alphabetical order**
- Skips any migrations which have already been ran
- A table named `pg_toolbox_migrations` is automatically created (and updated) to keep track of which migrations have already been executed.

## npx pg-toolbox --rollback

- Executes rollback scripts in **descending alphabetical order**
- Each toolbox file's rollback script is only ran if the migration script for that file was already executed.
- The table named `pg_toolbox_migrations` which keeps track of migrations is automatically dropped after all rollback scripts have been processed.

## npx pg-toolbox --truncate

- Executes truncate scripts in **descending alphabetical order**
- Each toolbox file's truncate script is only ran if the migration script for that file was already executed.

## npx pg-toolbox --seed

- Executes seed scripts in **ascending alphabetical order**
- Each toolbox file's seed script is only ran if the migration script for that file was already executed.

## Advanced Usage

- The `slonik` package is the only export of this package, and can be imported to a toolbox file like so: `const slonik = require('pg-toolbox')`
- This export contains the entire slonik library so you can write more advanced SQL scripts using slonik's many utility functions.
- Furthermore, toolbox files export an async function for a reason. You may perform database queries in order to inject dynamic values into your queries, or dynamically build a SQL script.
