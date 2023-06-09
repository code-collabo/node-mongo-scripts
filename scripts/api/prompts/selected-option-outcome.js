import fs from 'fs';
import { promisify } from 'util';
import { changeUserSettings, copyTemplateFiles, deletePreviousTemplateFiles } from '../../shared/helpers.js';
import { questionPushAPIscripts } from './prompt-questions.js';
import inquirer from 'inquirer';
import { error, success, warning } from '../../shared/console.js';
import { installAndConnect, nodemongoPaths, runningChangeConnection, runningDevScript, setTemplateFileDirExt } from '../helpers/helpers.js';
import { user } from '../helpers/user.js';

const access = promisify(fs.access);
const { userObjFileLocation, templatePath } = nodemongoPaths();
const { pathToCheck } = templatePath;

export const selectedOptionOutcome = async (arg, questionPushArgs, connectionQuestions) => {
  const { promptOption, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles } = arg;
  let { connectionNameAnswers } = arg;
  
  try {
    const { atlasTemplateDirectory, localTemplateDirectory } = setTemplateFileDirExt();

    // Check that all paths exist first (to prevent delete from happening if files are not copied due to error and vice versa)
    await access(pathToCheck, fs.constants.R_OK);
    await access(atlasTemplateDirectory, fs.constants.R_OK);
    await access(localTemplateDirectory, fs.constants.R_OK);

    let selectedOptionIsSameAs = {
      switchToAtlasOrDefault: connectionNameAnswers.template === promptOption.switchToAtlas || connectionNameAnswers.template === promptOption.continueWithDefault,
      switchToLocal: connectionNameAnswers.template === promptOption.switchToLocal,
      installAtlasConnection: connectionNameAnswers.template === promptOption.installAtlasConnection,
      installLocalConnection: connectionNameAnswers.template === promptOption.installLocalConnection,
      ignorePrompt: connectionNameAnswers.template === promptOption.ignorePrompt,
      continueWithBoth: connectionNameAnswers.template === promptOption.continueWithBoth,
    }

    const updateUserSettings = (pkgJsonScript) => {
      let isFirstimerPropExists = user.hasOwnProperty('isFirstTimer'); // FUTURE TODO: Can we make this isFirstTimerPropExists check reusable everywhere (we might be needing it)?
      let isFirstTimerValue;
      if (runningDevScript) isFirstTimerValue = false;
      if (runningChangeConnection) isFirstTimerValue = isFirstimerPropExists ? user.isFirstTimer : true;
      changeUserSettings({
        ...userObjFileLocation,
        isFirstTimer: isFirstTimerValue,
        savedConnection: pkgJsonScript.slice(4).toUpperCase(),
      });
    }

    const selectionOptionIsSameAsAtlasOrLocal = async (onlyAtlasPairOrOnlyLocalPairOfConnectionFiles) => {
      if (selectedOptionIsSameAs.switchToAtlasOrDefault || selectedOptionIsSameAs.installAtlasConnection) {
        if (onlyAtlasPairOrOnlyLocalPairOfConnectionFiles) {
          const deleteFilesDir = { filesArray: dbServerFileNames.local, folderPath: pathToCheck };
          await deletePreviousTemplateFiles(deleteFilesDir);
          const copyFilesDir = { templateDirectory: atlasTemplateDirectory, targetDirectory: pathToCheck };
          await copyTemplateFiles({ ...copyFilesDir });
        }
        installAndConnect('dev:atlas', '\n✔ Atlas db and server connection files installed in src folder\n');
        updateUserSettings('dev:atlas');
      }
  
      if (selectedOptionIsSameAs.switchToLocal || selectedOptionIsSameAs.installLocalConnection) {
        if (onlyAtlasPairOrOnlyLocalPairOfConnectionFiles) {
          const deleteFilesDir = { filesArray: dbServerFileNames.atlas, folderPath: pathToCheck };
          await deletePreviousTemplateFiles(deleteFilesDir);
          const copyFilesDir = { templateDirectory: localTemplateDirectory, targetDirectory: pathToCheck };
          await copyTemplateFiles({ ...copyFilesDir });
        }
        installAndConnect('dev:local', '\n✔ Local db and server connection files installed in src folder\n');
        updateUserSettings('dev:local');
      }
    }

    selectionOptionIsSameAsAtlasOrLocal(true);

    if (selectedOptionIsSameAs.ignorePrompt || selectedOptionIsSameAs.continueWithBoth) {
      if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) {
        installAndConnect('dev:atlas', '\n✔ Atlas db and server connection files retained\n');
        updateUserSettings('dev:atlas');
      }
      if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) {
        installAndConnect('dev:local', '\n✔ Local db and server connection files retained\n');
        updateUserSettings('dev:local');
      }
      if (atlasSetOfConnectionFiles && localSetOfConnectionFiles) {
        success('\n✔ Both (Atlas and Local) db and server connection files retained\n');
        connectionQuestions = [];
        questionPushAPIscripts({ ...questionPushArgs, connectionQuestions }, selectedOptionIsSameAs.continueWithBoth);
        connectionNameAnswers = await inquirer.prompt(connectionQuestions);
        //=== Why did I need to repeat this object here before the correct values were applied to its property?
        //=== FUTURE TODO: To prevent repeat, maybe make selectedOptionIsSameAs a function, that returns an object, and that collects connectionNameAnswers.template and/or promptOption as arguments (and destructure where necessary if need be)
        selectedOptionIsSameAs = {
          switchToAtlasOrDefault: connectionNameAnswers.template === promptOption.switchToAtlas || connectionNameAnswers.template === promptOption.continueWithDefault,
          switchToLocal: connectionNameAnswers.template === promptOption.switchToLocal,
          installAtlasConnection: connectionNameAnswers.template === promptOption.installAtlasConnection,
          installLocalConnection: connectionNameAnswers.template === promptOption.installLocalConnection,
          ignorePrompt: connectionNameAnswers.template === promptOption.ignorePrompt,
          continueWithBoth: connectionNameAnswers.template === promptOption.continueWithBoth,
        } //===
        selectionOptionIsSameAsAtlasOrLocal(false);
      }
    }
  } catch(err) {
    error(err);
  }
}

export const runPackageJsonScriptWithoutPrompt = (arg) => {
  try {
    const { atlasSetOfConnectionFiles, localSetOfConnectionFiles } = arg;
    if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) installAndConnect('dev:atlas', undefined);
    if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) installAndConnect('dev:local', undefined);
    if (localSetOfConnectionFiles && atlasSetOfConnectionFiles) {
      let pkgJsonScript = '';
      const connectionTypeNotRecognised = user.savedConnection !== 'ATLAS' && user.savedConnection !== 'LOCAL';
      if (user.savedConnection === 'ATLAS' || connectionTypeNotRecognised) pkgJsonScript = 'dev:atlas';
      if (user.savedConnection === 'LOCAL') pkgJsonScript = 'dev:local';
      const recognisedConnectionType = user.savedConnection === 'ATLAS' || user.savedConnection === 'LOCAL';
      if (recognisedConnectionType && runningDevScript) installAndConnect(pkgJsonScript, undefined);
      if (connectionTypeNotRecognised && runningDevScript) {
        warning(`ℹ node-mongo does not recognise the connection type "${user.savedConnection}" in your settings. Please run this command to set your preferred connection type first:\n\nnpm run dev:change \n`);
      }
    }
  } catch (err) {
    error(err);
  }
}