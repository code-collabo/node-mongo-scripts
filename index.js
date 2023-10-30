// Require esm module package to allow modules to work
require = require('esm')(module/*, options*/);

// The main index.js content starts here
import fs from 'fs';
import { promisify } from 'util';
import { connectionSetupTypePrompt } from './scripts/api/prompts/index.js';
import { error } from './scripts/shared/console.js';
import { nodemongoPaths, restoreToFirstTimer, runningChangeConnection, runningDevScript, runningRestoreConnection, runningAtlasServerConnection, runningLocalServerConnection, startAtlasServer, startLocalServer } from './scripts/api/helpers/helpers.js';

let { templatePath } = nodemongoPaths();
const { pathToCheck } = templatePath;

const access = promisify(fs.access);

export const chooseNodeMongoApiDBServer = async () => {
  try {
    await access(pathToCheck, fs.constants.R_OK);
    if (runningDevScript || runningChangeConnection) connectionSetupTypePrompt();
    if (runningRestoreConnection) restoreToFirstTimer();
    if (runningLocalServerConnection) startLocalServer();
    if (runningAtlasServerConnection) startAtlasServer();
  } catch(err) {
    error(`\nPath or directory '${pathToCheck}' does not exist. Enter correct path as parameter/argument in the chooseNodeMongoApiDBServer() method\n`);
  }
}
