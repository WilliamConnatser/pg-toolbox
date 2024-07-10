import { slonik } from "pg-toolbox";

const holdingsToolBoxFile = async () => ({
  migrate: slonik.sql`CREATE TABLE holdings (
    id  SERIAL PRIMARY KEY,
    day DATE NOT NULL,
    fund INTEGER REFERENCES funds (id) ON DELETE RESTRICT,
    company INTEGER REFERENCES companies (id) ON DELETE RESTRICT,
    shares INT NOT NULL,
    value DECIMAL(14,2) NOT NULL,
    weight DECIMAL(5,2) NOT NULL,
    CONSTRAINT day_fund_company UNIQUE(day,fund,company)
  )`,
  rollback: slonik.sql`DROP TABLE IF EXISTS holdings`,
  truncate: slonik.sql`TRUNCATE holdings RESTART IDENTITY CASCADE`,
});

export default holdingsToolBoxFile;
