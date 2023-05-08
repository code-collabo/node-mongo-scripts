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
  const { templateName, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles, atleastOneSetOfAtlasConnectionFileExists, atleastOneSetOfLocalConnectionFileExists } = setTemplateFileDirExt(templateNameString, pathToCheck);

  // More pair checks (for atlas and/or local)
  const noCompleteSetOfAtlasOrLocalConnectionFiles = !atlasSetOfConnectionFiles || !localSetOfConnectionFiles;
  const noOneFileFromPairExists = !atleastOneSetOfAtlasConnectionFileExists && !atleastOneSetOfLocalConnectionFileExists;
  const oneFileFromPairExists = atleastOneSetOfAtlasConnectionFileExists || atleastOneSetOfLocalConnectionFileExists;

  const promptOption = {
    switchToAtlas: 'Switch to ATLAS connection',
    switchToLocal: 'Switch to LOCAL connection',
    ignorePrompt: 'Ignore (but continue dev server)',
    installAtlasConnection: 'ATLAS connection',
    installLocalConnection: 'LOCAL connection',
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
