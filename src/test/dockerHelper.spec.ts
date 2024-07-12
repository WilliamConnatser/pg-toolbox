import { DatabasePoolType, sql } from "slonik";
import {
  createPostgresContainer,
  removePostgresContainer,
} from "./dockerHelpers";

describe("Database Tests", () => {
  let pool: DatabasePoolType;

  beforeEach(async () => {
    pool = await createPostgresContainer();
  });

  afterEach(() => {
    removePostgresContainer();
  });

  it("should be able to connect to a PostgreSQL docker container", async () => {
    const res = await pool.query(sql`SELECT 1 AS id`);
    expect(res.rows[0]?.id).toEqual(1);
  });
});
