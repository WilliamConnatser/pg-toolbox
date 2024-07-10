import { TaggedTemplateLiteralInvocationType } from "slonik";

/**
 * Format a message and log it to the console.
 * If a SQL query is provided, it will also log the formatted query.
 *
 * @param message - The message to log.
 * @param query - The optional SQL query to log.
 */
const formatAndLog = (
  message: string,
  query: TaggedTemplateLiteralInvocationType | null = null,
): void => {
  const formattedQuery = query?.sql
    ? `\n\t${query.sql.replace(/\n/g, "\n\t")}`
    : "";
  console.log(`[pg-toolbox] ${message}${formattedQuery}`);
};

export default formatAndLog;
