import { spawn } from 'child_process';

export const npmRunPackageJsonScript = ({ script, currentWorkingDir } : { script: string, currentWorkingDir: string }): void => {
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  spawn(npm, ['run', script], { cwd: currentWorkingDir, stdio: 'inherit' });
}