import fs from 'fs';
import inquirer from 'inquirer';
import { promisify } from 'util';
import ncp from 'ncp';

const access = promisify(fs.access);
const copy = promisify(ncp);

// TODO: Move all potententially reusable variables into connectionSetupTypePrompt() function
// TODO: Move helper functions out of this file
// TODO: console.log and movement of console.log related code from the templates into this scripts package

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
    console.log(err);
  }
}

const questionPushAPIscripts = (arg) => {
  const { connectionQuestions, atlasSetOfConnectionFiles, localSetOfConnectionFiles, userChoice, atleastOneSetOfAtlasConnectionFileExists, atleastOneSetOfLocalConnectionFileExists } = arg;
  // console.log(arg);
  const inquiryType = {
    type: 'list',
    name: 'template',
  }

  if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) {
    connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API already uses the ATLAS server and db connection type.\n  Which of these actions would you like to take?',
      choices: userChoice.atlas,
      default: userChoice.atlas[0],
    });
  }

  if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) {
    connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API already uses the LOCAL server and db connection type.\n  Which of these actions would you like to take?',
      choices: userChoice.local,
      default: userChoice.local[0],
    });
  }

  if (atlasSetOfConnectionFiles && localSetOfConnectionFiles) {
    connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API has both ATLAS and LOCAL server and db connection type (which is not recommended because of the confusion that comes with having both connection types). Choose one of the connection types below to continue:',
      choices: [...userChoice.switchToOneOrContinueWithBoth],
      default: userChoice.switchToOneOrContinueWithBoth[0],
    });
  }

  const noCompleteSetOfAtlasOrLocalConnectionFiles = !atlasSetOfConnectionFiles || !localSetOfConnectionFiles;
  const noOneFileFromPairExists = !atleastOneSetOfAtlasConnectionFileExists && !atleastOneSetOfLocalConnectionFileExists;
  if (noOneFileFromPairExists && noCompleteSetOfAtlasOrLocalConnectionFiles) {
    connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API does not have the needed db and server connection files. This operation will install the connection files in the src/ folder. Choose one of the connection types below to continue:',
      choices: userChoice.installNew,
      default: userChoice.installNew[0],
    });
  }

  const oneFileFromPairExists = atleastOneSetOfAtlasConnectionFileExists || atleastOneSetOfLocalConnectionFileExists;
  if (oneFileFromPairExists && noCompleteSetOfAtlasOrLocalConnectionFiles) {
    connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API does not have a complete set of db and server connection files. This operation will install a complete set in the src/ folder. Choose one of the connection types below to continue: ',
      choices: userChoice.installNew,
      default: userChoice.installNew[0],
    });
  }
}

const selectedOptionOutcome = async (arg) => {
  const { templateName, connectionNameAnswers, promptOption, pathToCheck, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles } = arg;
  // console.log(arg);
  
  try { // TODO: change this path to node_modules path? (when testing published package)
    // Path to node-mongo-scripts (folders) from the API boilerplate template using the package
    const atlasTemplateDirectory = `../../node-mongo-scripts/api-templates/${templateName}/atlas/`;
    const localTemplateDirectory = `../../node-mongo-scripts/api-templates/${templateName}/local/`;

    // Check these paths exist first (to prevent delete from happening if files are not copied due to error and vice versa)
    await access(pathToCheck, fs.constants.R_OK);
    await access(atlasTemplateDirectory, fs.constants.R_OK);
    await access(localTemplateDirectory, fs.constants.R_OK);

    const selectedOptionIsSameAs = {
      switchToAtlas: connectionNameAnswers.template === promptOption.switchToAtlas,
      switchToLocal: connectionNameAnswers.template === promptOption.switchToLocal,
      installAtlasConnection: connectionNameAnswers.template === promptOption.installAtlasConnection,
      installLocalConnection: connectionNameAnswers.template === promptOption.installLocalConnection,
      ignorePrompt: connectionNameAnswers.template === promptOption.ignorePrompt,
      continueWithBoth: connectionNameAnswers.template === promptOption.continueWithBoth,
    }

    if (selectedOptionIsSameAs.switchToAtlas || selectedOptionIsSameAs.installAtlasConnection) {
      await deletePreviousTemplateFiles(dbServerFileNames.local, pathToCheck);
      const copyFilesDir = { templateDirectory: atlasTemplateDirectory, targetDirectory: pathToCheck };
      await copyTemplateFiles({ ...copyFilesDir });
      console.log('\nAtlas db and server connection files installed in src folder\n');
    }

    if (selectedOptionIsSameAs.switchToLocal || selectedOptionIsSameAs.installLocalConnection) {
      await deletePreviousTemplateFiles(dbServerFileNames.atlas, pathToCheck);
      const copyFilesDir = { templateDirectory: localTemplateDirectory, targetDirectory: pathToCheck };
      await copyTemplateFiles({ ...copyFilesDir });
      console.log('\nLocal db and server connection files installed in src folder\n');
    }

    if (selectedOptionIsSameAs.ignorePrompt || selectedOptionIsSameAs.continueWithBoth) {
      if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) console.log('\nAtlas db and server connection files retained\n');
      if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) console.log('\nLocal db and server connection files retained\n');
      if (atlasSetOfConnectionFiles && localSetOfConnectionFiles) console.log('\nBoth (Atlas and Local) db and server connection files retained\n');
    }
  } catch(err) {
    console.log(err);
  }
}

const connectionSetupTypePrompt = (templateName, pathToCheck, devIsFirstimer) => {
  // return all files in the path you want to check
  const dirFiles = fs.readdirSync(pathToCheck, (files) => files);

  let dbServerFileNames, ext;

  templateName === 'ts' ? ext = '.ts' : ext = '.js';

  dbServerFileNames = {
    atlas: [`db.atlas.connect${ext}`, `server.atlas${ext}`],
    local: [`db.local.connect${ext}`, `server.local${ext}`]
  }

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

  const promptsUserResponseAndOutcomes = async () => {
    const connectionQuestions = [];
    const questionPushArgs = { connectionQuestions, atlasSetOfConnectionFiles, localSetOfConnectionFiles, userChoice, atleastOneSetOfAtlasConnectionFileExists, atleastOneSetOfLocalConnectionFileExists };
    questionPushAPIscripts(questionPushArgs);
    const connectionNameAnswers = await inquirer.prompt(connectionQuestions);
    const selectedOptionArgs = { templateName, connectionNameAnswers, promptOption, pathToCheck, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles };
    selectedOptionOutcome(selectedOptionArgs);
  }



  // const noCompleteSetOfAtlasOrLocalConnectionFiles = !atlasSetOfConnectionFiles || !localSetOfConnectionFiles;
  // const oneFileFromPairExists = atleastOneSetOfAtlasConnectionFileExists || atleastOneSetOfLocalConnectionFileExists;
  // const noOneFileFromPairExists = !atleastOneSetOfAtlasConnectionFileExists || !atleastOneSetOfLocalConnectionFileExists;

  // const dev = {
  //   isFirstTimer: devIsFirstimer,
  //   // hasNoConnectionFile: noOneFileFromPairExists && noCompleteSetOfAtlasOrLocalConnectionFiles,
  //   // hasNoCompleteConnectionFilesPair: noCompleteSetOfAtlasOrLocalConnectionFiles,
  //   // hasAllConnectionFilesPair: atlasSetOfConnectionFiles && localSetOfConnectionFiles,
  // };

  // console.log(dev);
  // const devNeedsPrompt = dev.isFirstTimer /*|| dev.hasNoConnectionFile || dev.hasNoCompleteConnectionFilesPair || dev.hasAllConnectionFilesPair*/;
  // devNeedsPrompt ? promptsUserResponseAndOutcomes() : null;

  promptsUserResponseAndOutcomes();
}

export const chooseNodeMongoApiDBServer = async (pathToCheck, templateName, devIsFirstimer) => {
  try {
    await access(pathToCheck, fs.constants.R_OK);
    connectionSetupTypePrompt(templateName, pathToCheck, devIsFirstimer);
  } catch(err) {
    console.log(`\nPath or directory '${pathToCheck}' does not exist. Enter correct path as parameter/argument in the chooseNodeMongoApiDBServer() method\n`);
  }
}
