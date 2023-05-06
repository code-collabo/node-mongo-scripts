import fs from 'fs';
import { promisify } from 'util';
import { changeFirstTimer, copyTemplateFiles, deletePreviousTemplateFiles } from '../../shared/helpers.js';
import { questionPushAPIscripts } from './prompt-questions.js';
import inquirer from 'inquirer';
import { error, success } from '../../shared/console.js';
import { installAndConnect, setTemplateFileDirExt } from '../helpers/helpers.js';

const access = promisify(fs.access);

export const selectedOptionOutcome = async (arg, questionPushArgs, connectionQuestions) => {
  const { templateName, promptOption, pathToCheck, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles } = arg;
  let { connectionNameAnswers } = arg;
  // console.log(arg);
  
  try { // TODO: change this path to node_modules path? (when testing published package)
    // Path to node-mongo-scripts (folders) from the API boilerplate template using the package

    const { atlasTemplateDirectory, localTemplateDirectory } = setTemplateFileDirExt(templateName);

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

    const selectionOptionIsSameAsAtlasOrLocal = async () => {
      if (selectedOptionIsSameAs.switchToAtlas || selectedOptionIsSameAs.installAtlasConnection) {
        await deletePreviousTemplateFiles(dbServerFileNames.local, pathToCheck);
        const copyFilesDir = { templateDirectory: atlasTemplateDirectory, targetDirectory: pathToCheck };
        await copyTemplateFiles({ ...copyFilesDir });
        installAndConnect('dev:atlas', '\n✔ Atlas db and server connection files installed in src folder\n');
      }
  
      if (selectedOptionIsSameAs.switchToLocal || selectedOptionIsSameAs.installLocalConnection) {
        await deletePreviousTemplateFiles(dbServerFileNames.atlas, pathToCheck);
        const copyFilesDir = { templateDirectory: localTemplateDirectory, targetDirectory: pathToCheck };
        await copyTemplateFiles({ ...copyFilesDir });
        installAndConnect('dev:local', '\n✔ Local db and server connection files installed in src folder\n');
      }
    }

    selectionOptionIsSameAsAtlasOrLocal();

    if (selectedOptionIsSameAs.ignorePrompt || selectedOptionIsSameAs.continueWithBoth) {
      if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) {
        installAndConnect('dev:atlas', '\n✔ Atlas db and server connection files retained\n');
      }
      if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) {
        installAndConnect('dev:local', '\n✔ Local db and server connection files retained\n');
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

     // TODO: change this targetDirectory path to node_modules path? (when testing published package)
    changeFirstTimer({ 
      targetDirectory: '../../node-mongo-scripts/scripts/api/helpers/', 
      filePathName: 'user.js',
      isFirstTimer: false
    });

  } catch(err) {
    error(err);
  }
}

export const runPackageJsonScriptWithoutPrompt = (arg) => {
  const { atlasSetOfConnectionFiles, localSetOfConnectionFiles } = arg;
  if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) installAndConnect('dev:atlas', undefined);
  if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) installAndConnect('dev:local', undefined);
}