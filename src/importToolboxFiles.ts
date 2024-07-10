import path from "path";
import getToolboxFiles from "./getToolboxFilePaths";
import { ToolBoxFile, ToolBoxFileWithMetaData } from "./types";

const importToolboxFiles = async (): Promise<ToolBoxFileWithMetaData[]> => {
  const importToolboxFiles = getToolboxFiles(
    path.join(process.env.PWD || "", process.env.PGMIGRATIONS || ""),
  ).map(async (fileName: string) => {
    const toolBoxFile = await import(
      path.join(process.env.PWD || "", process.env.PGMIGRATIONS || "", fileName)
    );
    console.log(toolBoxFile, fileName);
    return {
      ...(toolBoxFile() as ToolBoxFile),
      fileName,
    };
  });

  return await Promise.all(importToolboxFiles);
};

export default importToolboxFiles;
