# WARNING: DO NOT USE UNTIL VERSION 1.2 OR GREATER - Brand new and largely untested package with an unstable API

# pg-toolbox

# Why?

I decided to create this package after reading this blog post from the creator of the NPM Package [slonik](https://github.com/gajus/slonik) ([Gajus Kuizinas](https://github.com/gajus)). In the blog post he makes what I think is a solid argument to write pure SQL instead of using libraries like ORMs or Knex.JS as a way to solidify your SQL knowledge, and due to the fact that dynamic query builders (like Knex.JS, for instance) are overkill for most applications and use cases.

I had heavily relied on ORMs and query builders in my software engineering career up to the time read this blog post, and it really resonated with me so I started using `slonik` to query PostgreSQL databases. However, I had grown used to the CLI commands in ORMs that ship with batteries to manage migrations, rollback and seeding, and `slonik` does not have that functionality implemented so I built this package to be used in tandem with `slonik` in order to manage your database.

If you use an ORM or query builder in all of your projects, then I would implore you to give `slonik` and `pg-toolbox` a try! Especially if you are a student, or in an early stage of your career, because I guarantee you once you start writing pure SQL you will realize there are gaps in your SQL knowledge. SQL is battle tested over decades and is not going anywhere anytime soon, and PostgreSQL is the defacto SQL open-source SQL standard. Using these packages will help you solidify your Postgres and SQL knowledge in a practical & project-based setting by simply building applications!

# Features

- Several CLI commands to migrate, rollback, truncate, or seed your database.
- Little to no bloat or production dependencies. The only packages used (other than `slonik`) are development dependencies, and it's recommended to install pg-toolbox as a development dependency.
- Ability to dynamically build seed or truncate scripts
- Immutable migration and rollback scripts

# Usage

## Install the NPM Package

pg-toolbox should be installed as a development dependency so no bloat is added to your app. All of pg-toolboxs's CLI scripts would usually only be applied in a development environment or a deployment pipeline.

Depending on what package manager you use, run one of the following commands:

`npm install pg-toolbox -D`
`yarn add pg-toolbox -D`
`pnpm add pg-toolbox -D`
`bun add pg-toolbox -D`

## Create an environment variable

Locally, this is usually defined in an `.env` file (remember to `.gitignore`!), or it's defined in the context the script is ran if running in a pipeline.

Example `.env` file:

```
PGMIGRATIONS=/path/from/root/folder/of/project/to/folder/containing/toolbox/files
PGURI=postgres://user:pass@host:port_number/database
```

## Create your toolbox files

- Toolbox files are consumed by the scripts which run after executing the CLI commands.
- All toolbox files inside the pg-toolbox folder are consumed by the CLI commands. The filepath from the root folder of your project to the folder containing the toolbox files is defined by the PGMIGRATIONS environment variable.
- All scripts applied by the CLI commands are applied in alphabetical order (ascending when migrating and seeding, or descending when truncating and rolling back).
- Toolbox files must export an async function which returns an object literal.
- The object literal should contain the following keys: `migrate`, `rollback`, `truncate`, and `seed`.
- Each value of the object is a `slonik` query wrapped in backticks, and preceded by a sql template tag which can be imported like so: `const {sql} = require('pg-toolbox')`
- The only optional keys of this object are `seed` and `truncate`- `migrate` and `rollback` are mandatory.
- The queries defined for the `migrate` and `rollback` actions are immutable so once they've been ran once they can not be changed. The hash is saved in the toolbox metadata table the first time a migration is ran.
- You may write whatever `async` logic in the function which returns this to build dynamic queries, but keep in mind that the migrate and rollback queries need to be immutable. This functionality is more meant to be leveraged when building a script to seed the database.
- See the Slonik Documentation to discover many utility functions for advanced query building.
- There are several example toolbox files towards the end of this README and also [here](src/test/migrations/).

# CLI Commands

The CLI commands use the toolbox files you defined (see above) to manage your database.

## npx pg-toolbox --migrate

- Executes migration scripts in **ascending alphabetical order**
- Skips any migrations which have already been ran
- A table named `pg_toolbox_migrations` is automatically created (and updated) to keep track of which migrations have already been applied.

## npx pg-toolbox --rollback

- Executes rollback scripts in **descending alphabetical order**
- Each toolbox file's rollback script is only ran if the migration script for that file was already applied.
- The table named `pg_toolbox_migrations` which keeps track of migrations is automatically dropped after all rollback scripts have been processed.

## npx pg-toolbox --truncate

- Executes truncate scripts in **descending alphabetical order**
- Each toolbox file's truncate script is only ran if the migration script for that file was already applied.

## npx pg-toolbox --seed

- Executes seed scripts in **ascending alphabetical order**
- Each toolbox file's seed script is only ran if the migration script for that file was already applied.

# Common Options for All CLI Operations

All scripts (migrate, rollback, truncate, and seed) also support the following options:

Apply the next pending operation: `pg-toolbox <operation>`
Apply all pending operations: `pg-toolbox <operation> --all`
Apply operation up to a specific version: `pg-toolbox <operation> --to <FileName>`
Apply a specific number of operations: `pg-toolbox <operation> --steps <number>`
Apply a specific operation: `pg-toolbox <operation> --only <fileName>`
Undo the most recent operation:`pg-toolbox <operation> undo`

> > > > > > > Stashed changes

## Advanced Usage

- The `slonik` package is the only export of this package, and can be imported to a toolbox file like so: `const slonik = require('pg-toolbox')`
- This export contains the entire slonik library so you can write more advanced SQL scripts using slonik's many utility functions.
- Furthermore, toolbox files export an async function for a reason. You may perform database queries in order to inject dynamic values into your queries, or dynamically build a SQL script.
- Remember that the migrate and rollback scripts are immutable so this feature is meant more to build dynamic seed scripts.

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

# Contributing

- Please open an Issue (or ideally a PR) if you find a bug or have a feature request.
- Development:
  - Install packages
  - Install Docker
    - Currently, all tests are ran using Docker
    - There are some scripts to spin up or tear down a PostgreSQL database instance to aid in development
  - Get familiar with the scripts section of [package.json](/package.json)

# Design Decisions Explained

### Dynamic Seed Script

- **Adaptability**: Adjust to different environments and requirements in real-time.
- **Automation**: Integrates seamlessly with the pg-toolbox tool set for streamlined data management.

**Note**: Migration and rollback scripts are recommended to be immutable for maintaining historical accuracy and reliability so it's recommended to only use dynamism on seed or truncate scripts.

### Immutable Database Migrations

- **Historical Accuracy**: Immutable migrations preserve the history of changes, providing a clear and accurate record of how the database schema evolved over time.
- **Reliability**: Ensures consistency across different environments (development, staging, production), preventing issues related to inconsistent schema states.
- **Auditing and Compliance**: Facilitates auditing and compliance processes by maintaining an unalterable history of database changes.
- **Simplified Debugging**: Easier to trace and debug issues by examining the sequence of applied migrations.
- **Collaboration**: Reduces the risk of conflicts and confusion among team members, as migrations are not altered once created.
