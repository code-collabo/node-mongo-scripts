import { success, warning } from '../../shared/console.js';
import { npmRunPackageJsonScript } from '../../shared/helpers.js';
import { user } from './user.js';

const npmLifeCycleEvent = process.env.npm_lifecycle_event;
export const runningDevScript = npmLifeCycleEvent === 'dev';
export const runningChangeConnection = npmLifeCycleEvent === 'change:connection';

export const setTemplateFileDirExt = (templateName) => {
  let dbServerFileNames, ext;

  templateName === 'ts' ? ext = '.ts' : ext = '.js';

  dbServerFileNames = {
    atlas: [`db.atlas.connect${ext}`, `server.atlas${ext}`],
    local: [`db.local.connect${ext}`, `server.local${ext}`]
  }

  const atlasTemplateDirectory = `../../node-mongo-scripts/api-templates/${templateName}/atlas/`;
  const localTemplateDirectory = `../../node-mongo-scripts/api-templates/${templateName}/local/`;

  return {
    templateName,
    dbServerFileNames,
    atlasTemplateDirectory,
    localTemplateDirectory
  }
}

const changeConnectionMessage = (message, pkgJsonScript) => { 
  if (runningDevScript) {
    if (user.isFirstTimer) {
      success('✔ Connection setup type saved for every other time you run the "npm run dev" command');
    }
    if (!user.isFirstTimer) {
      success(`ℹ Using your saved connection setting: ${pkgJsonScript.slice(4).toUpperCase()}\n  Running: npm run ${pkgJsonScript}`);
    }
    if (message) {
      warning('\nℹ If you ever wish to reset your connection type before running the "npm run dev" command again, use the command:\n npm run dev:restore');
      warning('\nℹ Or you can use this other command to change your connection:\n npm run change:connection');
    }
  }
  if (runningChangeConnection || (user.isFirstTimer && runningDevScript)) success(`${runningChangeConnection ? '': '\n'}ℹ Running: npm run ${pkgJsonScript}`);
}

export const installAndConnect = (pkgJsonScript, message) => {
  if (message) success(message);
  changeConnectionMessage(message, pkgJsonScript);
  npmRunPackageJsonScript({ script: pkgJsonScript, currentWorkingDir: './'})
}