import { success, error, warning } from '../../shared/ts/consolemsg';
import { npmRunPackageJsonScript } from '../../shared/ts/helper-function';

export const server = (serverPort: number | string): void => {
  try {
    success(`\nnode-mongo (Typescript) API boilerplate template v${1}`);
    success(`\nServer running at ${serverPort}`);
  } catch (err) {
    error(`${{ err }}`);
  }
}

const eslintAndServer = (serverPort: number | string) => {
  npmRunPackageJsonScript({ script: 'lint:watch', currentWorkingDir: './' });
  server(serverPort);
}

export const afterAtlasDBconnectSuccessful = (serverPort: number | string) => {
  success('\nConnected to mongoDB ATLAS');
  eslintAndServer(serverPort);
}

export const afterLocalDBconnectSuccessful = (serverPort: number | string) => {
  success('\nConnected to LOCAL mongoDB');
  eslintAndServer(serverPort);
}

export const connectToDBunsuccessful = (err: { message: unknown; }) => {
  error(`\nError in DB connection: ${err.message}\n`);
  warning('Refer to the node-mongo documentation: https://code-collabo.gitbook.io/node-mongo-v2.0.0\n\nGet further help from Code Collabo Community\'s Node mongo channel: https://matrix.to/#/#collabo-node-mongo:gitter.im\n');
}
