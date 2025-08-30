import fs from "fs";
import path from "path";

export const getAllFiles = (folderPath: string) => {
  let results: string[] = [];

  const allfilesandfolders = fs.readdirSync(folderPath);

  allfilesandfolders.forEach((file) => {
    const fullFilePath = path.join(folderPath, file);
    const stat = fs.statSync(fullFilePath);
    if (stat && stat.isDirectory()) {
      /* Recurse into a subdirectory */
      results = results.concat(getAllFiles(fullFilePath));
    } else {
      /* Is a file */
      results.push(fullFilePath);
    }
  });
  return results;
};
