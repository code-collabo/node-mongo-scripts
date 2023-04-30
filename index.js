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
      fs.existsSync(`${folderPath}/${file}`) ? fs.unlinkSync(`${folderPath}/${file}`) : null;
    });
  } catch(err) {
    console.log({ err }); // TODO: Display user understandable error message? Maybe also try use this here: await access(pathToCheck, fs.constants.R_OK);
  }
}

const questionPushAPIscripts = (arg) => {
  const inquiryType = {
    type: 'list',
    name: 'template',
  }

  if (arg.atlasSetOfConnectionFiles && !arg.localSetOfConnectionFiles) {
    arg.connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API already uses the ATLAS server and db connection type.\n  Which of these actions would you like to take?',
      choices: arg.atlas,
      default: arg.atlas[0],
    });
  }

  if (arg.localSetOfConnectionFiles && !arg.atlasSetOfConnectionFiles) {
    arg.connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API already uses the LOCAL server and db connection type.\n  Which of these actions would you like to take?',
      choices: arg.local,
      default: arg.local[0],
    });
  }

  if (arg.atlasSetOfConnectionFiles && arg.localSetOfConnectionFiles) {
    arg.connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API has both ATLAS and LOCAL server and db connection type (which is not recommended because of the confusion that comes with having both connection types). Choose one of the connection types below to continue:',
      choices: [...arg.switchToOneOrContinueWithBoth],
      default: arg.switchToOneOrContinueWithBoth[0],
    });
  }

  const noCompleteSetOfAtlasOrLocalConnectionFiles = !arg.atlasSetOfConnectionFiles || !arg.localSetOfConnectionFiles;
  const noOneFileFromPairExists = !arg.atleastOneSetOfAtlasConnectionFileExists && !arg.atleastOneSetOfLocalConnectionFileExists;
  if (noOneFileFromPairExists && noCompleteSetOfAtlasOrLocalConnectionFiles) {
    arg.connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API does not have the needed db and server connection files. This operation will install the connection files in the src/ folder. Choose one of the connection types below to continue:',
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

const selectedOptionOutcome = async (arg) => {
  try {
    const selectedOptionIsSameAs = {
      switchToAtlas: arg.connectionNameAnswers.template === arg.promptOption.switchToAtlas,
      switchToLocal: arg.connectionNameAnswers.template === arg.promptOption.switchToLocal,
      installAtlasConnection: arg.connectionNameAnswers.template === arg.promptOption.installAtlasConnection,
      installLocalConnection: arg.connectionNameAnswers.template === arg.promptOption.installLocalConnection,
      ignorePrompt: arg.connectionNameAnswers.template === arg.promptOption.ignorePrompt,
      continueWithBoth: arg.connectionNameAnswers.template === arg.promptOption.continueWithBoth,
    }

    if (selectedOptionIsSameAs.switchToAtlas || selectedOptionIsSameAs.installAtlasConnection) {
      await deletePreviousTemplateFiles(arg.dbServerFileNames.local, arg.pathToCheck);
      const copyFilesDir = { templateDirectory: './atlas/', targetDirectory: arg.pathToCheck };
      await copyTemplateFiles({ ...copyFilesDir });
      console.log('Atlas connection db and server connection files installed in src folder');
    }

    if (selectedOptionIsSameAs.switchToLocal || selectedOptionIsSameAs.installLocalConnection) {
      await deletePreviousTemplateFiles(arg.dbServerFileNames.atlas, arg.pathToCheck);
      const copyFilesDir = { templateDirectory: './local/', targetDirectory: arg.pathToCheck };
      await copyTemplateFiles({ ...copyFilesDir });
    }

    if (selectedOptionIsSameAs.ignorePrompt || selectedOptionIsSameAs.continueWithBoth) {
      if (arg.atlasSetOfConnectionFiles && !arg.localSetOfConnectionFiles) console.log('Atlas connection type retained');
      if (arg.localSetOfConnectionFiles && !arg.atlasSetOfConnectionFiles) console.log('Local connection type retained');
      if (arg.atlasSetOfConnectionFiles && arg.localSetOfConnectionFiles) console.log('Both connection types retained');
    }
  } catch(err) {
    console.log({ err }); // TODO: Display user understandable error message? Maybe also try use this here: await access(pathToCheck, fs.constants.R_OK);
  }
}

const connectionSetupTypePrompt = (templateName, pathToCheck, devIsFirstimer) => {
  // return all files in the path you want to check
  const dirFiles = fs.readdirSync(pathToCheck, (files) => files);

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
    continueWithBoth: 'Continue using both (not recommended)',
  };

  const userChoice = {
    atlas: [promptOption.switchToLocal, promptOption.ignorePrompt],
    local: [promptOption.switchToAtlas, promptOption.ignorePrompt],
    installNew: [promptOption.installAtlasConnection, promptOption.installLocalConnection],
    switchToOneOrContinueWithBoth: [promptOption.installAtlasConnection, promptOption.installLocalConnection, promptOption.continueWithBoth]
  };

  const promptAndResponse = async () => {
    const connectionQuestions = [];
    const fileSets = { atlasSetOfConnectionFiles, localSetOfConnectionFiles };
    const atLeastOneConnectionFileExists = { atleastOneSetOfAtlasConnectionFileExists, atleastOneSetOfLocalConnectionFileExists };
    questionPushAPIscripts({ connectionQuestions, ...fileSets, ...userChoice, ...atLeastOneConnectionFileExists});
  
    const connectionNameAnswers = await inquirer.prompt(connectionQuestions);
  
    const selectedOptionArgs = { connectionNameAnswers, promptOption, pathToCheck, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles };
    selectedOptionOutcome(selectedOptionArgs);
  }

  const noCompleteSetOfAtlasOrLocalConnectionFiles = !atlasSetOfConnectionFiles || !localSetOfConnectionFiles;
  const oneFileFromPairExists = atleastOneSetOfAtlasConnectionFileExists || atleastOneSetOfLocalConnectionFileExists;
  const noOneFileFromPairExists = !atleastOneSetOfAtlasConnectionFileExists || !atleastOneSetOfLocalConnectionFileExists;

  const dev = {
    isFirstTimer: devIsFirstimer,
    // hasNoConnectionFile: noOneFileFromPairExists && noCompleteSetOfAtlasOrLocalConnectionFiles,
    // hasNoCompleteConnectionFilesPair: noCompleteSetOfAtlasOrLocalConnectionFiles,
    // hasAllConnectionFilesPair: atlasSetOfConnectionFiles && localSetOfConnectionFiles,
  };

  console.log(dev);
  const devNeedsPrompt = dev.isFirstTimer /*|| dev.hasNoConnectionFile || dev.hasNoCompleteConnectionFilesPair || dev.hasAllConnectionFilesPair*/;
  devNeedsPrompt ? promptAndResponse() : null;
}


export const chooseNodeMongoApiDBServer = async (pathToCheck, templateName, devIsFirstimer) => {
  try {
    await access(pathToCheck, fs.constants.R_OK);
    connectionSetupTypePrompt(templateName, pathToCheck, devIsFirstimer);
  } catch(err) {
    console.log(`Path or directory '${pathToCheck}' does not exist. Enter correct path as parameter/argument in the chooseNodeMongoApiDBServer() method`);
  }
}

// chooseNodeMongoApiDBServer('../node-mongo-api-boilerplate-templates/ts/src', 'ts', false);