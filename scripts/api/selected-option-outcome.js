import fs from 'fs';
import { promisify } from 'util';
import { copyTemplateFiles, createNewFileOrOverwriteExistingFileContent, deletePreviousTemplateFiles, npmRunPackageJsonScript } from '../shared/helper-functions.js';
import { questionPushAPIscripts } from './prompt-questions.js';
import inquirer from 'inquirer';
import { user } from './save-user-info.js';

const access = promisify(fs.access);

const changeConnectionMessage = () => { 
  if (user.isFirstTimer) console.log('\nYou can always change your connection using the command below:\n npm run change:connection\n\n'); 
}

export const selectedOptionOutcome = async (arg, questionPushArgs, connectionQuestions) => {
  const { templateName, promptOption, pathToCheck, dbServerFileNames, atlasSetOfConnectionFiles, localSetOfConnectionFiles } = arg;
  let { connectionNameAnswers } = arg;
  // console.log(arg);
  
  try { // TODO: change this path to node_modules path? (when testing published package)
    // Path to node-mongo-scripts (folders) from the API boilerplate template using the package
    const atlasTemplateDirectory = `../../node-mongo-scripts/api-templates/${templateName}/atlas/`;
    const localTemplateDirectory = `../../node-mongo-scripts/api-templates/${templateName}/local/`;

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
        console.log('\nAtlas db and server connection files installed in src folder\n');
        changeConnectionMessage();
        npmRunPackageJsonScript({ script: 'dev:atlas', currentWorkingDir: './'});
      }
  
      if (selectedOptionIsSameAs.switchToLocal || selectedOptionIsSameAs.installLocalConnection) {
        await deletePreviousTemplateFiles(dbServerFileNames.atlas, pathToCheck);
        const copyFilesDir = { templateDirectory: localTemplateDirectory, targetDirectory: pathToCheck };
        await copyTemplateFiles({ ...copyFilesDir });
        console.log('\nLocal db and server connection files installed in src folder\n');
        changeConnectionMessage();
        npmRunPackageJsonScript({ script: 'dev:local', currentWorkingDir: './'});
      }
    }

    selectionOptionIsSameAsAtlasOrLocal();

    if (selectedOptionIsSameAs.ignorePrompt || selectedOptionIsSameAs.continueWithBoth) {
      if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) {
        console.log('\nAtlas db and server connection files retained\n');
        npmRunPackageJsonScript({ script: 'dev:atlas', currentWorkingDir: './'});
      }
      if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) {
        console.log('\nLocal db and server connection files retained\n');
        npmRunPackageJsonScript({ script: 'dev:local', currentWorkingDir: './'});
      }
      if (atlasSetOfConnectionFiles && localSetOfConnectionFiles) {
        console.log('\nBoth (Atlas and Local) db and server connection files retained\n');
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
     const content = 'const user = {\n  isFirstTimer: false,\n}\n\nexport { user };';
     createNewFileOrOverwriteExistingFileContent({ 
       targetDirectory: '../../node-mongo-scripts/scripts/api/', 
       filePathName: 'save-user-info.js', 
       content 
     });

  } catch(err) {
    console.log(err);
  }
}

export const runPackageJsonScriptWithoutPrompt = (arg) => {
  const { atlasSetOfConnectionFiles, localSetOfConnectionFiles } = arg;
  if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) npmRunPackageJsonScript({ script: 'dev:atlas', currentWorkingDir: './'});
  if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) npmRunPackageJsonScript({ script: 'dev:local', currentWorkingDir: './'});
  if (atlasSetOfConnectionFiles && localSetOfConnectionFiles) npmRunPackageJsonScript({ script: 'dev:atlas', currentWorkingDir: './'}); // Temporary: run atlas connection here for now
}