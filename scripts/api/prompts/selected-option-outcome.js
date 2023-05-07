import fs from 'fs';
import { promisify } from 'util';
import { changeUserSettings, copyTemplateFiles, deletePreviousTemplateFiles } from '../../shared/helpers.js';
import { questionPushAPIscripts } from './prompt-questions.js';
import inquirer from 'inquirer';
import { error, success } from '../../shared/console.js';
import { installAndConnect, nodemongoPaths, setTemplateFileDirExt } from '../helpers/helpers.js';
import { user } from '../helpers/user.js';

const access = promisify(fs.access);
const { userObjFileLocation } = nodemongoPaths();

export const selectedOptionOutcome = async (arg, questionPushArgs, connectionQuestions) => {
  const { templateName, promptOption, pathToCheck, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles } = arg;
  let { connectionNameAnswers } = arg;
  // console.log(arg);
  
  try { // TODO: change this path to node_modules path? (when testing published package)
    // Path to node-mongo-scripts (folders) from the API boilerplate template using the package

    const { atlasTemplateDirectory, localTemplateDirectory } = setTemplateFileDirExt(templateName, pathToCheck);

    // Check that all paths exist first (to prevent delete from happening if files are not copied due to error and vice versa)
    await access(pathToCheck, fs.constants.R_OK);
    await access(atlasTemplateDirectory, fs.constants.R_OK);
    await access(localTemplateDirectory, fs.constants.R_OK);

    let selectedOptionIsSameAs = {
      switchToAtlas: connectionNameAnswers.template === promptOption.switchToAtlas,
      switchToLocal: connectionNameAnswers.template === promptOption.switchToLocal,
      installAtlasConnection: connectionNameAnswers.template === promptOption.installAtlasConnection,
      installLocalConnection: connectionNameAnswers.template === promptOption.installLocalConnection,
      ignorePrompt: connectionNameAnswers.template === promptOption.ignorePrompt,
      continueWithBoth: connectionNameAnswers.template === promptOption.continueWithBoth,
    }

    const templatePath = { templateName, pathToCheck };

    const updateUserSettings = (pkgJsonScript) => {
      changeUserSettings({
        ...userObjFileLocation,
        isFirstTimer: false,
        savedConnection: pkgJsonScript.slice(4).toUpperCase(),
      });
    }

    const selectionOptionIsSameAsAtlasOrLocal = async () => {
      if (selectedOptionIsSameAs.switchToAtlas || selectedOptionIsSameAs.installAtlasConnection) {
        await deletePreviousTemplateFiles(dbServerFileNames.local, pathToCheck);
        const copyFilesDir = { templateDirectory: atlasTemplateDirectory, targetDirectory: pathToCheck };
        await copyTemplateFiles({ ...copyFilesDir });
        installAndConnect('dev:atlas', '\n✔ Atlas db and server connection files installed in src folder\n', templatePath);
        updateUserSettings('dev:atlas');
      }
  
      if (selectedOptionIsSameAs.switchToLocal || selectedOptionIsSameAs.installLocalConnection) {
        await deletePreviousTemplateFiles(dbServerFileNames.atlas, pathToCheck);
        const copyFilesDir = { templateDirectory: localTemplateDirectory, targetDirectory: pathToCheck };
        await copyTemplateFiles({ ...copyFilesDir });
        installAndConnect('dev:local', '\n✔ Local db and server connection files installed in src folder\n', templatePath);
        updateUserSettings('dev:local');
      }
    }

    selectionOptionIsSameAsAtlasOrLocal();

    if (selectedOptionIsSameAs.ignorePrompt || selectedOptionIsSameAs.continueWithBoth) {
      if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) {
        installAndConnect('dev:atlas', '\n✔ Atlas db and server connection files retained\n', templatePath);
      }
      if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) {
        installAndConnect('dev:local', '\n✔ Local db and server connection files retained\n', templatePath);
      }
      if (atlasSetOfConnectionFiles && localSetOfConnectionFiles) {
        success('\n✔ Both (Atlas and Local) db and server connection files retained\n');
        connectionQuestions = [];
        questionPushAPIscripts({ ...questionPushArgs, connectionQuestions }, selectedOptionIsSameAs.continueWithBoth);
        connectionNameAnswers = await inquirer.prompt(connectionQuestions);
        //=== Why did I need to repeat this object here before the correct values were applied to its property?
        selectedOptionIsSameAs = {
          switchToAtlas: connectionNameAnswers.template === promptOption.switchToAtlas,
          switchToLocal: connectionNameAnswers.template === promptOption.switchToLocal,
          installAtlasConnection: connectionNameAnswers.template === promptOption.installAtlasConnection,
          installLocalConnection: connectionNameAnswers.template === promptOption.installLocalConnection,
          ignorePrompt: connectionNameAnswers.template === promptOption.ignorePrompt,
          continueWithBoth: connectionNameAnswers.template === promptOption.continueWithBoth,
        } //===
        selectionOptionIsSameAsAtlasOrLocal();
      }
    }
  } catch(err) {
    error(err);
  }
}

export const runPackageJsonScriptWithoutPrompt = (arg) => {
  try {
    const { atlasSetOfConnectionFiles, localSetOfConnectionFiles, templateName, pathToCheck } = arg;
    const templatePath = { templateName, pathToCheck };
    if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) installAndConnect('dev:atlas', undefined, templatePath);
    if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) installAndConnect('dev:local', undefined, templatePath);
    if (localSetOfConnectionFiles && atlasSetOfConnectionFiles) {
      let pkgJsonScript = '';
      if (user.savedConnection === 'ATLAS') pkgJsonScript = 'dev:atlas';
      if (user.savedConnection === 'LOCAL') pkgJsonScript = 'dev:local';
        
      // TODO: how do I get the previously saved connection of user when both connection files exist?
      installAndConnect(pkgJsonScript, undefined, templatePath); // reminder that this last one runs when both pairs are present after you run "npm run dev" (& user is not fisrt timer)
    }
  } catch (err) {
    error(err);
  }
}