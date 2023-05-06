import fs from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';
import ncp from 'ncp';
import { promisify } from 'util';
import { error } from './console.js';

const copy = promisify(ncp);

export const npmRunPackageJsonScript = ({ script, currentWorkingDir }) => {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  spawn(npm, ['run', script], { cwd: currentWorkingDir, stdio: 'inherit' });
}

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
    error(err);
  }
}

export const createNewFileOrOverwriteExistingFileContent = async (options) => {
  const { targetDirectory, filePathName, content } = options;
  fs.writeFileSync(join(targetDirectory, filePathName), content);
  return;
}