import fs from 'fs';
import { join } from 'path';
import ncp from 'ncp';
import { promisify } from 'util';

const copy = promisify(ncp);

export const copyTemplateFiles = async (options) => {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false
  });
}

export const deletePreviousTemplateFiles = async (filesArray, folderPath) => {
  try {
    filesArray.map((file) => {
      fs.existsSync(`${folderPath}/${file}`) ? fs.unlinkSync(`${folderPath}/${file}`) : null;
    });
  } catch(err) {
    console.log(err);
  }
}

export const createNewFileOrOverwriteExistingFileContent = async (options) => {
  console.log(options);
  const { targetDirectory, filePathName, content } = options;
  fs.writeFileSync(join(targetDirectory, filePathName), content);
  return;
}