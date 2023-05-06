import fs from 'fs';
import inquirer from 'inquirer';
import { questionPushAPIscripts } from './prompt-questions.js';
import { runPackageJsonScriptWithoutPrompt, selectedOptionOutcome } from './selected-option-outcome.js';
import { user } from '../helpers/user.js';
import { setTemplateFileDirExt } from '../helpers/helpers.js';
import { runningDevScript, runningChangeConnection } from '../helpers/helpers.js';

export const promptsUserResponseAndOutcomes = async (arg) => {
  const { templateName, promptOption, pathToCheck, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles, userChoice, noCompleteSetOfAtlasOrLocalConnectionFiles, noOneFileFromPairExists, oneFileFromPairExists } = arg;
  let connectionQuestions = [];
  const questionPushArgs = { connectionQuestions, atlasSetOfConnectionFiles, localSetOfConnectionFiles, userChoice, noCompleteSetOfAtlasOrLocalConnectionFiles, noOneFileFromPairExists, oneFileFromPairExists };
  questionPushAPIscripts(questionPushArgs, false);
  const connectionNameAnswers = await inquirer.prompt(connectionQuestions);
  const selectedOptionArgs = { templateName, connectionNameAnswers, promptOption, pathToCheck, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles };
  selectedOptionOutcome(selectedOptionArgs, questionPushArgs, connectionQuestions);
}

export const connectionSetupTypePrompt = async (templateNameString, pathToCheck) => {
  // return all files in the path you want to check
  const dirFiles = fs.readdirSync(pathToCheck, (files) => files);

  const { templateName, dbServerFileNames } = setTemplateFileDirExt(templateNameString);

  // Check for a pair of db file & server file (for atlas and local)
  const atlasSetOfConnectionFiles = dbServerFileNames.atlas.every(element => dirFiles.includes(element));
  const localSetOfConnectionFiles = dbServerFileNames.local.every(element => dirFiles.includes(element));

  // Check that at least one of the pairs exists (for atlas and local)
  const atleastOneSetOfAtlasConnectionFileExists = dbServerFileNames.atlas.some(element => dirFiles.includes(element));
  const atleastOneSetOfLocalConnectionFileExists = dbServerFileNames.local.some(element => dirFiles.includes(element));

  // More pair checks (for atlas and/or local)
  const noCompleteSetOfAtlasOrLocalConnectionFiles = !atlasSetOfConnectionFiles || !localSetOfConnectionFiles;
  const noOneFileFromPairExists = !atleastOneSetOfAtlasConnectionFileExists && !atleastOneSetOfLocalConnectionFileExists;
  const oneFileFromPairExists = atleastOneSetOfAtlasConnectionFileExists || atleastOneSetOfLocalConnectionFileExists;

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

  const promptsUserArgs = { templateName, promptOption, pathToCheck, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles, userChoice, noCompleteSetOfAtlasOrLocalConnectionFiles, noOneFileFromPairExists, oneFileFromPairExists };
  if (!user.isFirstTimer && runningDevScript) runPackageJsonScriptWithoutPrompt(promptsUserArgs);
  if (runningChangeConnection || (user.isFirstTimer && runningDevScript)) promptsUserResponseAndOutcomes(promptsUserArgs);
}