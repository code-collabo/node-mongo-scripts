import fs from 'fs';
import { error, success, warning } from '../../shared/console.js';
import { changeUserSettings, copyTemplateFiles, deletePreviousTemplateFiles, npmRunPackageJsonScript } from '../../shared/helpers.js';
import { user } from './user.js';
import nodemongo_config from '../../../../../../node-mongo.json';

export const nodemongoPaths = () => {
  const nodemongoRoot = '../../node-mongo-scripts';
  const nodemongoAPItemplatesFolder =  `${nodemongoRoot}/api-templates`;
  const nodemongoScriptsFolder =  `${nodemongoRoot}/scripts`;
  const nodemongoAPIhelpersFolder = `${nodemongoScriptsFolder}/api/helpers/`;

  const userObjFileLocation = { 
    targetDirectory: nodemongoAPIhelpersFolder, 
    filePathName: 'user.js',
  }

  return {
    templatePath: nodemongo_config,
    root: nodemongoRoot,
    apiTemplatesFolder: nodemongoAPItemplatesFolder,
    userObjFileLocation
  }
}

let { templatePath } = nodemongoPaths();
const { pathToCheck, templateName } = templatePath; // for everywhere we need them in this file

const npmLifeCycleEvent = process.env.npm_lifecycle_event;
export const runningDevScript = npmLifeCycleEvent === 'dev';
export const runningChangeConnection = npmLifeCycleEvent === 'dev:change';
export const runningRestoreConnection = npmLifeCycleEvent === 'dev:restore';

export const setTemplateFileDirExt = () => {
  let dbServerFileNames, ext;

  templateName === 'ts' ? ext = '.ts' : ext = '.js';

  dbServerFileNames = {
    atlas: [`db.atlas.connect${ext}`, `server.atlas${ext}`],
    local: [`db.local.connect${ext}`, `server.local${ext}`]
  }

  const { apiTemplatesFolder } = nodemongoPaths();
  const atlasTemplateDirectory = `${apiTemplatesFolder}/${templateName}/atlas/`;
  const localTemplateDirectory = `${apiTemplatesFolder}/${templateName}/local/`;

  // Return all files in the path you want to check
  const dirFiles = fs.readdirSync(pathToCheck, (files) => files);

  // Check for a pair of db file & server file (for atlas and local)
  const atlasSetOfConnectionFiles = dbServerFileNames.atlas.every(element => dirFiles.includes(element));
  const localSetOfConnectionFiles = dbServerFileNames.local.every(element => dirFiles.includes(element));

  // Check that at least one of the pairs exists (for atlas and local)
  const atleastOneSetOfAtlasConnectionFileExists = dbServerFileNames.atlas.some(element => dirFiles.includes(element));
  const atleastOneSetOfLocalConnectionFileExists = dbServerFileNames.local.some(element => dirFiles.includes(element));

  return {
    dbServerFileNames,
    atlasTemplateDirectory,
    localTemplateDirectory,
    atlasSetOfConnectionFiles,
    localSetOfConnectionFiles,
    atleastOneSetOfAtlasConnectionFileExists,
    atleastOneSetOfLocalConnectionFileExists,
  }
}

const changeConnectionMessage = (message, pkgJsonScript) => {
  const { atlasSetOfConnectionFiles, localSetOfConnectionFiles } = setTemplateFileDirExt();
  const onlyAtlasPairOfConnectionFiles = atlasSetOfConnectionFiles && !localSetOfConnectionFiles;
  const onlyLocalPairOfConnectionFiles = !atlasSetOfConnectionFiles && localSetOfConnectionFiles;
  const bothPairsExist = atlasSetOfConnectionFiles && localSetOfConnectionFiles;

  if (message) {
    if (onlyAtlasPairOfConnectionFiles || onlyLocalPairOfConnectionFiles) success(message);
    if (bothPairsExist) success('');
  };

  if (runningDevScript) {
    if (user.isFirstTimer) {
      success(`✔ Connection setup type "${pkgJsonScript.slice(4).toUpperCase()}" saved for every other time you run the "npm run dev" command`);
      success(`\n✔ Running: npm run ${pkgJsonScript}`);
    }
    if (!user.isFirstTimer) {
      success(`ℹ Using your saved connection setting: ${pkgJsonScript.slice(4).toUpperCase()}\n  Running: npm run ${pkgJsonScript}`);
    }
    if (message) {
      warning('\nℹ If you ever wish to reset your connection type before running the "npm run dev" command again, use the command:\n npm run dev:restore');
      warning('\nℹ Or you can use this other command to change your connection:\n npm run dev:change');
    }
  }
  if (runningChangeConnection) warning('ℹ Start the server with the command:\n  npm run dev\n');
}

export const installAndConnect = (pkgJsonScript, message) => {
  changeConnectionMessage(message, pkgJsonScript);
  if (runningDevScript) npmRunPackageJsonScript({ script: pkgJsonScript, currentWorkingDir: './'})
}

export const restoreToFirstTimer = async () => {
  try {
    if (user.isFirstTimer) {
      warning('ℹ You do not need the restore command yet: the restore command is for resetting your connection type if ever you wish to change it after the "npm run dev" command saves it for you \n');
    } else {
      // Restore default (atlas) connection files
      const { dbServerFileNames, atlasTemplateDirectory } = setTemplateFileDirExt();
      const deleteFilesDir = { filesArray: dbServerFileNames.local, folderPath: pathToCheck };
      await deletePreviousTemplateFiles(deleteFilesDir);
      const copyFilesDir = { templateDirectory: atlasTemplateDirectory, targetDirectory: pathToCheck };
      await copyTemplateFiles({ ...copyFilesDir });
      success('✔ Default (Atlas) db and server connection files restored in src folder\n');
      // Restore user to first timer and saved connection to node-mongo's default connection
      const { userObjFileLocation } = nodemongoPaths();
      changeUserSettings({
        ...userObjFileLocation,
        isFirstTimer: true,
        savedConnection: 'ATLAS',
      });
      success('✔ Previously saved connection setup type removed');
      warning('\nℹ You will now have the option to set preferred connection type again the next time you start the server with the command:\nnpm run dev\n');
    }
  } catch(err) {
    error(err);
  }
}