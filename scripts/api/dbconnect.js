import { spawn } from 'child_process';
import { success, error, warning } from '../shared/consolemsg.js';
// import package_json from '../../package.json' assert type json;

/* eslint-disable no-console */

export const npmRunPackageJsonScript = ({ script, currentWorkingDir }) => {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  spawn(npm, ['run', script], { cwd: currentWorkingDir, stdio: 'inherit' });
}

export const server = (serverPort) => {
  try {
    success(`\nnode-mongo (Typescript) API boilerplate template v${1}`);
    success(`\nServer running at ${serverPort}`);
  } catch (err) {
    error(`${{ err }}`);
  }
}

const eslintAndServer = (serverPort) => {
  npmRunPackageJsonScript({ script: 'lint:watch', currentWorkingDir: './' });
  server(serverPort);
}

export const afterAtlasDBconnectSuccessful = (serverPort) => {
  success('\nConnected to mongoDB ATLAS');
  eslintAndServer(serverPort);
}

export const afterLocalDBconnectSuccessful = (serverPort) => {
  success('\nConnected to LOCAL mongoDB');
  eslintAndServer(serverPort);
}

export const connectToDBunsuccessful = (err) => {
  error(`\nError in DB connection: ${err.message}\n`);
  warning('Refer to the node-mongo documentation: https://code-collabo.gitbook.io/node-mongo-v2.0.0\n\nGet further help from Code Collabo Community\'s Node mongo channel: https://matrix.to/#/#collabo-node-mongo:gitter.im\n');
}
