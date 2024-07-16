import { TaggedTemplateLiteralInvocationType } from "slonik";

export type UnparsedToolBoxFile = () => Promise<ToolBoxFile>;

/** For each ToolBox file each `OperationType` you can define one query wrapped in `sql` tags, or an array of queries to carry out multiple queries that get executed in a sequence. */
export type ToolBoxFileScript =
  | TaggedTemplateLiteralInvocationType
  | Array<TaggedTemplateLiteralInvocationType>;

/**
 * An async function which returns various queries for migrating, rolling back, truncating, and seeding a database.
 * The object returned is in the structure of a toolbox file used in pg-toolbox.
 * Each property is an asynchronous function that returns a `slonik` SQL query.
 */
export type ToolBoxFile = {
  /**
   * A `slonik` SQL query for migrating the database.
   * This query is applied when the `migrate` command is run.
   *
   * @example
   * sql`CREATE TABLE example (id SERIAL PRIMARY KEY, name TEXT)`
   */
  migrate?: ToolBoxFileScript;

  /**
   * AA `slonik` SQL query for rolling back the migration.
   * This query is applied when the `rollback` command is run.
   *
   * @example
   * sql`DROP TABLE IF EXISTS example`
   */
  rollback?: ToolBoxFileScript;

  /**
   * A `slonik` SQL query for truncating the tables.
   * This query is applied when the `truncate` command is run.
   * This property is optional.
   *
   * @example
   * sql`TRUNCATE TABLE example`
   */
  truncate?: ToolBoxFileScript;

  /**
   * A `slonik` SQL query for seeding the database.
   * This query is applied when the `seed` command is run.
   * This property is optional.
   *
   * @example
   * sql`INSERT INTO example (name) VALUES ('Sample Data')`
   */
  seed?: ToolBoxFileScript;
};

export type ToolBoxFileWithMetaData = ToolBoxFile & { fileName: string };

export type OperationType = "migrate" | "rollback" | "seed" | "truncate";
