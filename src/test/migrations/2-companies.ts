import { sql } from "slonik";

const companiesToolBoxFile = async () => ({
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

export default companiesToolBoxFile;
