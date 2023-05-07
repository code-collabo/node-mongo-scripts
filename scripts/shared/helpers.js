import fs from 'fs';
import { spawn } from 'child_process';
import { join } from 'path';
import ncp from 'ncp';
import { promisify } from 'util';
import { error } from './console.js';
import { user } from '../api/helpers/user.js';

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

const userObjStringCleanup = (stringifiedObj) => {
  // TODO: Can we dymaically replace the object keys instead? e.g. isFirstTimer, savedConnection (so that we will not need to manually type names of new keys that we will eventually add to user object, in the replace methods below)
  stringifiedObj = stringifiedObj.replace('"isFirstTimer"', '\n  isFirstTimer')
                                 .replace('"savedConnection"', '\n  savedConnection')
                                 .replace('}', '\n}')
                                 .replaceAll('"', '\'')
                                 .replaceAll(':', ': ')
  return stringifiedObj;
}

export const changeFirstTimer = (options) => {
  const stringifiedObj = JSON.stringify({ ...user, isFirstTimer: options.isFirstTimer });
  const cleanedUpStringifiedObj = userObjStringCleanup(stringifiedObj);
  const content = `const user = ${cleanedUpStringifiedObj}\n\nexport { user };`;
  delete options.isFirstTimer; // delete prop so it doesn't show up in createNewFileOrOverwriteExistingFileContent() method
  createNewFileOrOverwriteExistingFileContent({ content, ...options});
}

export const changesavedConnection = (options) => {
  const stringifiedObj = JSON.stringify({ ...user, savedConnection: options.savedConnection });
  const cleanedUpStringifiedObj = userObjStringCleanup(stringifiedObj);
  const content = `const user = ${cleanedUpStringifiedObj}\n\nexport { user };`;
  delete options.savedConnection; // delete prop so it doesn't show up in createNewFileOrOverwriteExistingFileContent() method
  createNewFileOrOverwriteExistingFileContent({ content, ...options});
}