import { createHash } from "crypto";
import { ToolBoxFile, ToolBoxFileWithMetaData } from "./types";

/**
 * Generates a SHA-256 hash of the migrate and rollback SQL queries, and verifies the hash (if applicable)
 * - Extract the SQL queries for migrate and rollback from the toolbox file.
 * - Concatenate the migrate and rollback queries into a single string.
 * - Create a SHA-256 hash of the concatenated string.
 * - Verify the hash of the migrate and rollback queries concatenated matches the existing hash (if applicable)
 * - Return the hash as a hexadecimal string.
 *
 * @param {ToolBoxFile} toolBoxFile - The toolbox file containing SQL queries for migration operations.
 * @returns {string} - The SHA-256 hash of the concatenated migrate and rollback queries.
 */
export const generateAndVerifyMigrationHash = (
  toolBoxFile: ToolBoxFile | ToolBoxFileWithMetaData,
  existingHash?: string
): string => {
  // Extract the SQL queries for migrate and rollback from the toolbox file.
  const migrateQuery = toolBoxFile.migrate.sql;
  const rollbackQuery = toolBoxFile.rollback.sql;

  // Concatenate the migrate and rollback queries into a single string.
  const concatenatedQueries = `${migrateQuery};${rollbackQuery}`;

  // Create a SHA-256 hash of the concatenated string.
  const hash = createHash("sha256");
  hash.update(concatenatedQueries);

  // Return the hash as a hexadecimal string.
  const currentHash = hash.digest("hex");

  if (existingHash && currentHash !== existingHash) {
    throw new Error(
      "Migrations are immutable, but the migrate and/or rollback script has been changed"
    );
  }

  return currentHash;
};
