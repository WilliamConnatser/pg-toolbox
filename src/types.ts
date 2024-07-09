import { TaggedTemplateLiteralInvocationType } from 'slonik'

/**
 * Represents the structure of a toolbox file used in pg-toolbox.
 * Each property is an asynchronous function that returns a `slonik` SQL query.
 */
type ToolBoxFile = {
  /**
   * An async function returning a `slonik` SQL query for migrating the database.
   * This query is executed when the `migrate` command is run.
   *
   * @example
   * async () => sql`CREATE TABLE example (id SERIAL PRIMARY KEY, name TEXT)`
   */
  migrate: () => Promise<TaggedTemplateLiteralInvocationType>

  /**
   * An async function returning a `slonik` SQL query for rolling back the migration.
   * This query is executed when the `rollback` command is run.
   *
   * @example
   * async () => sql`DROP TABLE IF EXISTS example`
   */
  rollback: () => Promise<TaggedTemplateLiteralInvocationType>

  /**
   * An async function returning a `slonik` SQL query for truncating the tables.
   * This query is executed when the `truncate` command is run.
   * This property is optional.
   *
   * @example
   * async () => sql`TRUNCATE TABLE example`
   */
  truncate?: () => Promise<TaggedTemplateLiteralInvocationType>

  /**
   * An async function returning a `slonik` SQL query for seeding the database.
   * This query is executed when the `seed` command is run.
   * This property is optional.
   *
   * @example
   * async () => sql`INSERT INTO example (name) VALUES ('Sample Data')`
   */
  seed?: () => Promise<TaggedTemplateLiteralInvocationType>
}

export type ParsedToolboxFile = ToolBoxFile & { fileName: string }

export default ToolBoxFile
