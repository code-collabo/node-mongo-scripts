import fs from 'fs';

export const chooseNodeMongoApiDBServer = (templateName, pathToCheck) => {
  // change dir/path from root to preferred
  process.chdir(pathToCheck); //TODO: catch error if file does not exist
  const dir = process.cwd();
  
  // console.log(dir);
  
  // return all files in the path you want to check
   const dirFiles = fs.readdirSync(dir, (err, files) => {
      if (err) {
        throw err;
      }
  
      return files;
  });
  
  console.log(dirFiles);

  let dbServerFileNames;
  let ext;

  templateName === 'ts' ? ext = '.ts' : ext = '.js';

  dbServerFileNames = {
    atlas: [`db.atlas.connect${ext}`, `server.atlas${ext}`],
    local: [`db.local.connect${ext}`, `server.local${ext}`]
  }

  // We need this later for a different action i.e if this is true but AtlasSetOfConnectionFiles or LocalSetOfConnectionFiles is false
  const AllDbServerFileNames = dbServerFileNames.atlas.concat(dbServerFileNames.local);

  // Check for a pair of db file & server file (atlas)
  const AtlasSetOfConnectionFiles = dbServerFileNames.atlas.every(element => dirFiles.includes(element));
  // Check for a pair of db file & server file (local)
  const LocalSetOfConnectionFiles = dbServerFileNames.local.every(element => dirFiles.includes(element));

  console.log({ AtlasSetOfConnectionFiles, LocalSetOfConnectionFiles });

  const questionPush = (msgString, folder) => {
    folderQuestions.push({
      type: 'input',
      name: 'folderName',
      message: msgString,
      default: folder
    });
  }

  

  //First check if any of the 4 file names exist (only do 1st prompt if it returns false)
  // 1st prompt (if true): Your application does not have the required server and db connection files. 
                           // Which type of connection would you like to set up?
  // else, check if app finds either + Prompt: your application already uses bla bla bla type of prompts

  
  
  
  // const AllTwoSetsOfConnectionFilesExist = Object.keys(dbServerFileNames).map(connectionName => {
  //   // console.log(connectionName);
  //   // console.log(dbServerFileNames[connectionName]);
  //   // dbServerFileNames[connectionName].some((files) => {
  //   //   // console.log(files);
  //   //   return files;
  //   // });
  
  //   return dbServerFileNames[connectionName];
  // });

  // console.log(AllTwoSetsOfConnectionFilesExist);
  
  // .some(files => {
  //   console.log(files);
  // });


  // const test = dirFiles.filter(element => dbServerFileNames.atlas.includes(element));
  // const test2 = dirFiles.filter(element => dbServerFileNames.local.includes(element));

  // console.log()

  // console.log(dbServerFileNames);

  // const AllDbServerFileNames = dbServerFileNames.atlas.concat(dbServerFileNames.local);
  // console.log(AllDbServerFileNames);

  // const test = dirFiles.some(element => AllDbServerFileNames.includes(element)); // TODO: Check for a pair of
  // console.log(test);
}

chooseNodeMongoApiDBServer('ts', '../node-mongo-api-boilerplate-templates/ts/src');


 //change dir from root to dist/modules
//  process.chdir('./dist/modules');
//  const distModulesDir = process.cwd();

//  //return all files in the dist/modules
//  const distModulesFiles = fs.readdirSync(distModulesDir, (err, files) => {
//     if (err) {
//       throw err;
//     }

//     return files;
// });

// //filter .js extension files
// const filterFiles = distModulesFiles.filter(file => {
//   return extname(file) === '.js';
// });

// //delete .js extension files
// try {
//   filterFiles.map(file => {
//     return fs.unlinkSync(file)
//   });
// } catch (err) {
//   console.log(err);
// }