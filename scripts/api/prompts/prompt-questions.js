import { user } from '../helpers/user.js';

export const questionPushAPIscripts = (arg, continueWithBoth) => {
  const { connectionQuestions, atlasSetOfConnectionFiles, localSetOfConnectionFiles, userChoice, noCompleteSetOfAtlasOrLocalConnectionFiles, noOneFileFromPairExists, oneFileFromPairExists } = arg;
  
  const inquiryType = {
    type: 'list',
    name: 'template',
  }

  const atlasDefaultMessage = user.isFirstTimer ? 
    'The default connection type is ATLAS i.e. the db and server connection files are set up to work with monogDB ATLAS. Choose whether you will like to continue with mongoDB ATLAS connection setup, or switch to LOCAL mongoDB connecion setup' 
    : 'Your nodejs API already uses the ATLAS server and db connection type.\n  Which of these actions would you like to take?';

  if (atlasSetOfConnectionFiles && !localSetOfConnectionFiles) {
    connectionQuestions.push({
      ...inquiryType,
      message: atlasDefaultMessage,
      choices: userChoice.atlas,
      default: userChoice.atlas[0],
    });
  }

  if (localSetOfConnectionFiles && !atlasSetOfConnectionFiles) {
    connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API already uses the LOCAL server and db connection type.\n  Which of these actions would you like to take?',
      choices: userChoice.local,
      default: userChoice.local[0],
    });
  }

  if (atlasSetOfConnectionFiles && localSetOfConnectionFiles && !continueWithBoth) {
    connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API has both ATLAS and LOCAL server and db connection type (which is not recommended because of the confusion that comes with having both connection types). Choose one of the connection types below to continue:',
      choices: [...userChoice.switchToOneOrContinueWithBoth],
      default: userChoice.switchToOneOrContinueWithBoth[0],
    });
  }

  if (atlasSetOfConnectionFiles && localSetOfConnectionFiles && continueWithBoth) {
    connectionQuestions.push({
      ...inquiryType,
      message: 'Both (Atlas and Local) db and server connection files retained. Start server for which of the connection types?',
      choices: userChoice.installNew,
      default: userChoice.installNew[0],
    });
  }

  if (noOneFileFromPairExists && noCompleteSetOfAtlasOrLocalConnectionFiles) {
    connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API does not have the needed db and server connection files. This operation will install the connection files in the src/ folder. Choose one of the connection types below to continue:',
      choices: userChoice.installNew,
      default: userChoice.installNew[0],
    });
  }

  if (oneFileFromPairExists && noCompleteSetOfAtlasOrLocalConnectionFiles) {
    connectionQuestions.push({
      ...inquiryType,
      message: 'Your nodejs API does not have a complete set of db and server connection files. This operation will install a complete set in the src/ folder. Choose one of the connection types below to continue: ',
      choices: userChoice.installNew,
      default: userChoice.installNew[0],
    });
  }
}