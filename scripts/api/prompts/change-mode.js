import fs from 'fs';
import dotenv from 'dotenv';
import inquirer from 'inquirer';
import { error, success } from '@code-collabo/node-mongo-scripts/scripts/shared/console';

export const changeConnectionMode = async () => {
  // Load the .env file
  dotenv.config({ path: '.env' });

  // Define the envConfig object
  const envConfig = dotenv.parse(fs.readFileSync('.env'));

  // Define empty options
  let possibleOptions = [];
  let choiceAtlas, choiceLocal, choiceIgnore;

  // Define the available choices
  if (envConfig.MODE === 'atlas') {
    possibleOptions = [
      'Continue with ATLAS connection', // Default choice
      'Switch to LOCAL connection',
      'Ignore prompt',
    ];
    choiceAtlas = possibleOptions[0];
    choiceLocal = possibleOptions[1];
    choiceIgnore = possibleOptions[2];
  } else if (envConfig.MODE == 'local') {
    possibleOptions = [
      'Continue with LOCAL connection', // Default choice
      'Switch to ATLAS connection',
      'Ignore prompt',
    ];
    choiceAtlas = possibleOptions[1];
    choiceLocal = possibleOptions[0];
    choiceIgnore = possibleOptions[2];
  } else {
    possibleOptions = [
      'Switch to ATLAS connection', // Default choice
      'Switch to LOCAL connection',
      'Ignore prompt',
    ];
    choiceAtlas = possibleOptions[0];
    choiceLocal = possibleOptions[1];
    choiceIgnore = possibleOptions[2];
  };

  // Prompt the user for their choice
  inquirer
    .prompt([
      {
        type: 'list',
        name: 'mode',
        message: 'Which mode do you want to switch to?',
        choices: possibleOptions,
      },
    ])
    .then((answers) => {
      // Modify the value of MODE based on the user's selection
      if (answers.mode === choiceLocal) {
        envConfig.MODE = 'local';
        // Write the changes back to the .env file
        const envConfigString = Object.keys(envConfig)
          .map(key => `${key}=${envConfig[key]}`)
          .join('\n');
        fs.writeFileSync('.env', envConfigString);

        // Show a message indicating mode change status
        success(`MODE has been set to ${envConfig.MODE}`);
      } else if (answers.mode === choiceAtlas) {
        envConfig.MODE = 'atlas';
        // Write the changes back to the .env file
        const envConfigString = Object.keys(envConfig)
          .map(key => `${key}=${envConfig[key]}`)
          .join('\n');
        fs.writeFileSync('.env', envConfigString);

        // Show a message indicating mode change status
        success(`MODE has been set to ${envConfig.MODE}`);
      } else {
        success(`You ignored mode change request. Current mode retained: ${envConfig.MODE}`);
      }

    })
    .catch((err) => {
      error(err);
    });
};
