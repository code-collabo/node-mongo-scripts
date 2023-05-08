import fs from 'fs';
import { success, warning } from '../../shared/console.js';
import { npmRunPackageJsonScript } from '../../shared/helpers.js';
import { user } from './user.js';

export const nodemongoPaths = () => {
  const nodemongoRoot = 'node_modules/@code-collabo/node-mongo-scripts';
  const nodemongoAPItemplatesFolder =  `${nodemongoRoot}/api-templates`;
  const nodemongoScriptsFolder =  `${nodemongoRoot}/scripts`;
  const nodemongoAPIhelpersFolder = `${nodemongoScriptsFolder}/api/helpers/`;

  const userObjFileLocation = { 
    targetDirectory: nodemongoAPIhelpersFolder, 
    filePathName: 'user.js',
  }

  return {
    root: nodemongoRoot,
    apiTemplatesFolder: nodemongoAPItemplatesFolder,
    userObjFileLocation
  }
}

const npmLifeCycleEvent = process.env.npm_lifecycle_event;
export const runningDevScript = npmLifeCycleEvent === 'dev';
export const runningChangeConnection = npmLifeCycleEvent === 'change:connection';

export const setTemplateFileDirExt = (templateName, pathToCheck) => {
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
    templateName,
    dbServerFileNames,
    atlasTemplateDirectory,
    localTemplateDirectory,
    atlasSetOfConnectionFiles,
    localSetOfConnectionFiles,
    atleastOneSetOfAtlasConnectionFileExists,
    atleastOneSetOfLocalConnectionFileExists,
  }
}

const changeConnectionMessage = (message, pkgJsonScript, templatePath) => {
  if (message) success(message);
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
      warning('\nℹ Or you can use this other command to change your connection:\n npm run change:connection');
    }
  }
  if (runningChangeConnection) warning('ℹ Start the server with the command:\n  npm run dev\n');
}

export const installAndConnect = (pkgJsonScript, message, templatePath) => {
  changeConnectionMessage(message, pkgJsonScript, templatePath);
  if (runningDevScript) npmRunPackageJsonScript({ script: pkgJsonScript, currentWorkingDir: './'})
}