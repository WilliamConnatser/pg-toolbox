import { sql } from "slonik";

const holdingsToolBoxFile = async () => ({
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

export default holdingsToolBoxFile;
