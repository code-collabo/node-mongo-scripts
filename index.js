import fs from 'fs';
import { promisify } from 'util';
import { connectionSetupTypePrompt } from './scripts/api/prompts/index.js';

const access = promisify(fs.access);

export const chooseNodeMongoApiDBServer = async (pathToCheck, templateName) => {
  try {
    await access(pathToCheck, fs.constants.R_OK);
    connectionSetupTypePrompt(templateName, pathToCheck);
  } catch(err) {
    console.log(`\nPath or directory '${pathToCheck}' does not exist. Enter correct path as parameter/argument in the chooseNodeMongoApiDBServer() method\n`);
  }
}