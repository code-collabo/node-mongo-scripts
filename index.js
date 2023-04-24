import fs from 'fs';
import inquirer from 'inquirer';
import { promisify } from 'util';
import ncp from 'ncp';

const access = promisify(fs.access);
const copy = promisify(ncp);

const copyTemplateFiles = async (options) => {
  return copy(options.templateDirectory, options.targetDirectory, {
    clobber: false
  });
}

const deletePreviousTemplateFiles = async (filesArray, folderPath) => {
  try {
    filesArray.map((file) => {
      return fs.unlinkSync(`${folderPath}/${file}`);
    });
  } catch(err) {
    console.log({ err }); // TODO: Display user understandable error message? Maybe also try use this here: await access(pathToCheck, fs.constants.R_OK);
  }
}

const questionPushAPIscripts = (arg) => {
  console.log(arg);
  const inquiryType = {
    type: 'list',
    name: 'template',
  }

  if (arg.atlasSetOfConnectionFiles) {
    arg.connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API already uses the ATLAS server and db connection type.\n  Which of these actions would you like to take?',
      choices: arg.atlas,
      default: arg.atlas[0],
    });
  }

  if (arg.localSetOfConnectionFiles) {
    arg.connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API already uses the LOCAL server and db connection type.\n  Which of these actions would you like to take?',
      choices: arg.local,
      default: arg.local[0],
    });
  }

  const noCompleteSetOfAtlasOrLocalConnectionFiles = !arg.atlasSetOfConnectionFiles || !arg.localSetOfConnectionFiles;
  const noOneFileFromPairExists = !arg.atleastOneSetOfAtlasConnectionFileExists && !arg.atleastOneSetOfLocalConnectionFileExists;
  if (noOneFileFromPairExists && noCompleteSetOfAtlasOrLocalConnectionFiles) {
    arg.connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API does not have the db and server connection files. This operation will install the connection files in the src/ folder. Choose one of the connection types below to continue:',
      choices: arg.installNew,
      default: arg.installNew[0],
    });
  }

  const oneFileFromPairExists = arg.atleastOneSetOfAtlasConnectionFileExists || arg.atleastOneSetOfLocalConnectionFileExists;
  if (oneFileFromPairExists && noCompleteSetOfAtlasOrLocalConnectionFiles) {
    arg.connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API does not have a complete set of db and server connection files. This operation will install a complete set in the src/ folder. Choose one of the connection types below to continue: ',
      choices: arg.installNew,
      default: arg.installNew[0],
    });
  }
}

const connectionSetupTypePrompt = async (templateName, pathToCheck) => {
  // return all files in the path you want to check
  const dirFiles = fs.readdirSync(pathToCheck, (files) => files);
  
  console.log(dirFiles);

  let dbServerFileNames;
  let ext;

  templateName === 'ts' ? ext = '.ts' : ext = '.js';

  dbServerFileNames = {
    atlas: [`db.atlas.connect${ext}`, `server.atlas${ext}`],
    local: [`db.local.connect${ext}`, `server.local${ext}`]
  }

  // TODO: Confirm if you will need this. If not, remove it
  // const allDbServerFileNames = dbServerFileNames.atlas.concat(dbServerFileNames.local);

  // Check for a pair of db file & server file (for atlas and local)
  const atlasSetOfConnectionFiles = dbServerFileNames.atlas.every(element => dirFiles.includes(element));
  const localSetOfConnectionFiles = dbServerFileNames.local.every(element => dirFiles.includes(element));

  // Check that at least one of the pairs exists (for atlas and local)
  const atleastOneSetOfAtlasConnectionFileExists = dbServerFileNames.atlas.some(element => dirFiles.includes(element));
  const atleastOneSetOfLocalConnectionFileExists = dbServerFileNames.local.some(element => dirFiles.includes(element));

  const promptOption = {
    switchToAtlas: 'Switch to atlas connection',
    switchToLocal: 'Switch to local connection',
    ignorePrompt: 'Ignore prompt',
    installAtlasConnection: 'Atlas connection',
    installLocalConnection: 'Local connection',
  };

  const userChoice = {
    atlas: [promptOption.switchToLocal, promptOption.ignorePrompt],
    local: [promptOption.switchToAtlas, promptOption.ignorePrompt],
    installNew: [promptOption.installAtlasConnection, promptOption.installLocalConnection],
  };

  const connectionQuestions = [];
  const fileSets = { atlasSetOfConnectionFiles, localSetOfConnectionFiles };
  const atLeastOneConnectionFileExists = { atleastOneSetOfAtlasConnectionFileExists, atleastOneSetOfLocalConnectionFileExists };
  questionPushAPIscripts({ connectionQuestions, ...fileSets, ...userChoice, ...atLeastOneConnectionFileExists});

  const connectionNameAnswers = await inquirer.prompt(connectionQuestions);

  // TODO: Move function out when done and just call here
  const actionOutcomes = async () => {
    try {
      if (connectionNameAnswers.template === promptOption.switchToLocal) {
        await deletePreviousTemplateFiles(dbServerFileNames.atlas, pathToCheck);
        const copyFilesDir = { templateDirectory: './local/', targetDirectory: pathToCheck };
        await copyTemplateFiles({ ...copyFilesDir });
      }

      if (connectionNameAnswers.template === promptOption.switchToAtlas) {
        await deletePreviousTemplateFiles(dbServerFileNames.local, pathToCheck);
        const copyFilesDir = { templateDirectory: './atlas/', targetDirectory: pathToCheck };
        await copyTemplateFiles({ ...copyFilesDir });
      }
      // TODO: this and others
      if (connectionNameAnswers.template === promptOption.ignorePrompt) {
        console.log(promptOption.ignorePrompt)
      }
    } catch(err) {
      console.log({ err }); // TODO: Display user understandable error message? Maybe also try use this here: await access(pathToCheck, fs.constants.R_OK);
    }
  }

  actionOutcomes();
}


export const chooseNodeMongoApiDBServer = async (templateName, pathToCheck) => {
  try {
    await access(pathToCheck, fs.constants.R_OK);
    connectionSetupTypePrompt(templateName, pathToCheck);
  } catch(err) {
    console.log(`Path or directory '${pathToCheck}' does not exist. Enter correct path as parameter/argument in the chooseNodeMongoApiDBServer() method`);
  }
}

chooseNodeMongoApiDBServer('ts', '../node-mongo-api-boilerplate-templates/ts/src');