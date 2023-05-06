import chalk from 'chalk';

export const success = (message) => {
  console.log( chalk.greenBright(message) );
}

export const warning = (message) => {
  console.log( chalk.yellowBright(message) );
}

export const error = (message) => {
  console.log( chalk.redBright(message) );
}
