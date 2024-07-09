import fs from 'fs'

/**
 * Get the list of toolbox files from the specified directory.
 *
 * @param dirPath - The path to the directory containing toolbox files.
 * @returns An array of toolbox file names.
 */
const getToolboxFiles = (dirPath: string): string[] => {
  try {
    return fs
      .readdirSync(dirPath)
      .filter((file) => file.endsWith('.js') || file.endsWith('.ts'))
  } catch (err) {
    console.error(`Error reading directory: ${dirPath}`, err)
    return []
  }
}

export default getToolboxFiles
