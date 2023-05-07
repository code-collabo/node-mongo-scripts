// Require esm module package to allow modules to work
require = require('esm')(module/*, options*/);

// The main index.js content starts here
import fs from 'fs';
import { promisify } from 'util';
import { connectionSetupTypePrompt } from './scripts/api/prompts/index.js';
import { success, warning, error } from './scripts/shared/console.js';
import { changeUserSettings, copyTemplateFiles, deletePreviousTemplateFiles } from './scripts/shared/helpers.js';
import { user } from './scripts/api/helpers/user.js';
import { nodemongoPaths, setTemplateFileDirExt } from './scripts/api/helpers/helpers.js';

const access = promisify(fs.access);
const { userObjFileLocation } = nodemongoPaths();

export const chooseNodeMongoApiDBServer = async (pathToCheck, templateName) => {
  try {
    await access(pathToCheck, fs.constants.R_OK);
    connectionSetupTypePrompt(templateName, pathToCheck);
  } catch(err) {
    error(`\nPath or directory '${pathToCheck}' does not exist. Enter correct path as parameter/argument in the chooseNodeMongoApiDBServer() method\n`);
  }
}

export const restoreToFirstTimer = async (pathToCheck, templateName) => {
  if (user.isFirstTimer) {
    warning('ℹ You do not need the restore command yet: the restore command is for resetting your connection type if ever you wish to change it after the "npm run dev" command or the "npm run change:connection" command saves it for you \n')
  } else {
    // Restore default (atlas) connection files
    const { dbServerFileNames, atlasTemplateDirectory } = setTemplateFileDirExt(templateName, pathToCheck);
    await deletePreviousTemplateFiles(dbServerFileNames.local, pathToCheck);
    const copyFilesDir = { templateDirectory: atlasTemplateDirectory, targetDirectory: pathToCheck };
    await copyTemplateFiles({ ...copyFilesDir });
    success('✔ Default (Atlas) db and server connection files restored in src folder\n');
    // Restore user to first timer and saved connection to node-mongo's default connection
    changeUserSettings({
      ...userObjFileLocation,
      isFirstTimer: true,
      savedConnection: 'ATLAS',
    });
    success('✔ Previously saved connection setup type removed');
    warning('\nℹ You will now have the option to set preferred connection type again the next time you run the "npm run dev" command\n');
  }
}