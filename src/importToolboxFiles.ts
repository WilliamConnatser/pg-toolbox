import fs from "fs";
import path from "path";
import { ToolBoxFile, ToolBoxFileWithMetaData } from "./types";

/**
 * Get the list of toolbox file paths from the specified directory.
 *
 * @param {string} dirPath - The path to the directory containing toolbox files.
 * @returns {string} An array of toolbox file names.
 */
const getToolboxFilePaths = (dirPath: string): string[] => {
  try {
    return fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
  } catch (err) {
    console.error(`Error reading directory: ${dirPath}`, err);
    return [];
  }
};

/**
 * Imports toolbox files and adds metadata to them.
 * - Retrieves the list of toolbox files based on the `PGMIGRATIONS` environment variable.
 * - Imports each toolbox file dynamically.
 * - Adds the file name as metadata to each imported toolbox file.
 *
 * @returns {Promise<ToolBoxFileWithMetaData[]>} A promise that resolves to an array of toolbox files with metadata.
 */
const importToolboxFiles = async (): Promise<ToolBoxFileWithMetaData[]> => {
  // Retrieve the list of toolbox files
  const importToolboxFiles = getToolboxFilePaths(
    path.join(process.env.PWD || "", process.env.PGMIGRATIONS || "")
  ).map(async (fileName: string) => {
    // Dynamically import each toolbox file
    const toolBoxFile = await import(
      path.join(process.env.PWD || "", process.env.PGMIGRATIONS || "", fileName)
    );
    console.log(toolBoxFile, fileName);
    return {
      ...(toolBoxFile() as ToolBoxFile),
      fileName,
    };
  });

  // Wait for all toolbox files to be imported and return them with metadata
  return await Promise.all(importToolboxFiles);
};

export default importToolboxFiles;
