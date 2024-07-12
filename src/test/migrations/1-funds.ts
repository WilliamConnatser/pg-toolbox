import { sql } from "slonik";
import { ToolBoxFile } from "../../types";

const fundsToolBoxFile: () => Promise<ToolBoxFile> = async () => ({
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

export default fundsToolBoxFile;
