// Require esm module package to allow modules to work
require = require('esm')(module/*, options*/);

// The main index.js content starts here
import fs from 'fs';
import { promisify } from 'util';
import { changeConnectionMode } from './scripts/api/prompts/change-mode.js';
import { error } from './scripts/shared/console.js';
import { nodemongoPaths, runningChangeConnection, runningDevScript, runningServerConnection, startServer } from './scripts/api/helpers/helpers.js';

let { templatePath } = nodemongoPaths();
const { pathToCheck } = templatePath;

const access = promisify(fs.access);

export const processNodeMongoApiDBServerCommand = async () => {
  try {
    await access(pathToCheck, fs.constants.R_OK);
    if (runningChangeConnection) changeConnectionMode();
    if (runningDevScript || runningServerConnection) startServer();
  } catch(err) {
    error(`\nPath or directory '${pathToCheck}' does not exist. Enter correct path as parameter/argument in the processNodeMongoApiDBServerCommand() method\n`);
  }
}
