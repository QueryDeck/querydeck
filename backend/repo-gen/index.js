
const fs = require("fs/promises");
var ModelManager = require.main.require('./models/modelManager');
const path = require("path")
var fs_extra = require("fs-extra");
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const gitHelper = require('./gitHelper');
const directoryExists = require('directory-exists');
const logger = require.main.require('./lib/logs');

const { rimraf, rimrafSync, native, nativeSync } = require('rimraf')

exports.generateRepoFirstTime = generateRepoFirstTime;
exports.overwriteRepo = overwriteRepo;
exports.diff = diff;
exports.push = push;
exports.getDiffFiles = getDiffFiles;
exports.readApiIndex = readApiIndex;

// generate app, connect git, init, commit and push
function generateRepoFirstTime(params, callback) {

    if(!params.subdomain || !params.gitUrl || !params.username || !params.password) {
        return callback({error: '!params.subdomain || !params.gitUrl || !params.directoryName || !params.username || !params.password'})
    }

    ModelManager.loadApp(params.subdomain, function(err){
        if(err) return callback(err);

        const directoryName = "repo-gen/repos/" + params.subdomain;

        rimraf(directoryName).then(() => {

            createDirectoryIfNotExists(directoryName).then(() => {

                fs_extra.copy(path.join(__dirname, 'auto-repo-template'), directoryName, function (err) {
                    if (err){
                        return callback(err)
                    }
                    // return console.log('DONE')

                    overwriteRepo({subdomain: params.subdomain}).then(() => {

                        // return callback(null);

                        gitHelper.initRepo({directoryName: directoryName, gitUrl: params.gitUrl, username: params.username, password: params.password}).then(() => {    
                            gitHelper.commitAndPush({directoryName: directoryName, commitMessage: 'Initial commit'}).then(() => {
                                callback();
                            }).catch((error) => {
                                callback(error);
                            });
                            
                        }).catch((error) => {
                            callback(error);
                        });

                    }).catch((error) => {
                        callback(error);
                    });

                });

    
            }).catch((error) => {
                callback(error);
            });

        }).catch((err) => {
            return callback(err);
        })


    })
    
}

// regenerate api, routes, models, app
async function overwriteRepo(params) {

    if(!params.subdomain) {
        throw {error: '!params.subdomain'}
    }

    var db_id = Object.keys(ModelManager.models[params.subdomain].databases)[0];

    var clientModel = ModelManager.models[params.subdomain].databases[db_id];

    const directoryName = "repo-gen/repos/" + params.subdomain;

    if(!await directoryExists(directoryName)) {
        throw {error: 'directoryName does not exist'}
    }

    try {

        // delete api, routes, models, app.js

        await rimraf(directoryName + '/lib/api')

        await deleteFilesIFExists([
            directoryName + '/lib/api-index.js',
            directoryName + '/lib/app.js',
            directoryName + '/lib/models.js'
        ])

        // regenerate api, routes, models, app.js

        await createDirectoryIfNotExists(directoryName + '/lib/api')

        await writeModels({fileName: directoryName + '/lib/' + 'models.js', clientModel: clientModel})

        await writeRoutes({routes: ModelManager.models[params.subdomain].routes, directoryName: directoryName})
        
        var appDetails = JSON.parse(JSON.stringify(ModelManager.models[params.subdomain].appDetails, null, 2))

        delete appDetails.auth.jwt_key;

        await fs.writeFile(directoryName + '/lib/' + 'app.js', 'module.exports = ' + JSON.stringify(appDetails, null, 2))

        await gitHelper.removeDeletedFiles({directoryName: directoryName});
        
    } catch (error) {
        throw error;
    }
    
}

async function getDiffFiles(params) {

    const directoryName = "repo-gen/repos/" + params.subdomain;

    if(!await directoryExists(directoryName)) {
        throw {error: 'directoryName does not exist', code: 404}
    }

    try {
        let diff = await gitHelper.getDiffFiles({directoryName: directoryName})
        return diff
    } catch (error) {
        throw error
    }

}

async function diff(params) {

    const directoryName = "repo-gen/repos/" + params.subdomain;

    if(!await directoryExists(directoryName)) {
        throw {error: 'directoryName does not exist', code: 404}
    }

    try {
        let diff = await gitHelper.getDiff({directoryName: directoryName})
        return diff
    } catch (error) {
        throw error
    }

}

async function readApiIndex(params) {
    const directoryName = "repo-gen/repos/" + params.subdomain;

    return await fs.readFile(directoryName + '/lib/api-index.js', 'utf8')
    
}

// push
function push(params, callback) {

    if(!params.subdomain || !params.commitMessage) {
        return callback({error: '!params.subdomain || !params.commitMessage'})
    }

    const directoryName = "repo-gen/repos/" + params.subdomain;

    copyModelFiles({directoryName: directoryName})
        .then(() => {
            console.log('Model files copied successfully');
            return gitHelper.commitAndPush({
                directoryName: directoryName, 
                commitMessage: params.commitMessage, 
                username: params.username, 
                password: params.password
            });
        })
        .then(() => {
            console.log('Model files committed and pushed successfully');
            callback();
        })
        .catch((error) => {
            console.error('Error in copying or pushing model files:', error);
            callback(error);
        });

    // gitHelper.commitAndPush({directoryName: directoryName, commitMessage: params.commitMessage, username: params.username, password: params.password}).then(() => {
    //     callback()
    // }).catch((error) => {
    //     callback(error);
    // });

}

async function deleteFilesIFExists(filePaths) {
    for (let i = 0; i < filePaths.length; i++) {
        const filePath = filePaths[i];
        try {   
            if(await fs.access(filePath)) {
                await fs.unlink(filePath);
            }
        } catch (error) {}
    }
}

async function writeModels(params) {

    var mods = {}

        var schema_arr = Object.keys(params.clientModel.models)

        for(var i = 0; i < schema_arr.length; i++) {
            var schema = schema_arr[i]
            mods[schema] = mods[schema] || {};
            var tables = Object.keys(params.clientModel.models[schema])
            for(var j = 0; j < tables.length; j++) {
                var table = tables[j]
                mods[schema][table] = {properties: params.clientModel.models[schema][table].properties}
            }
        }

        try {
            await fs.writeFile(params.fileName, 'module.exports = ' + JSON.stringify({
                models: mods,
                idToName: params.clientModel.idToName,
                tidToName: params.clientModel.tidToName
            }, null, 2));
            
        } catch (error) {
            // console.error(`Error writing to file: ${error}`);
            throw error;
        }

}

async function copyModelFiles(params) {
    const sourceDir = 'models';
    const destDir = params.directoryName + '/models';
    // logger.log('copyModelFiles', params.directoryName)
    const filesToCopy = ['JsonToSql.js', 'executeClientRequest.js', 'modelUtils.js', 'replaceModelWithBody.js', 'utils.js'];
    
    try {
      // Ensure the destination directory exists
      await fs.mkdir(destDir, { recursive: true });
  
      for (const file of filesToCopy) {
        const sourcePath = path.join(sourceDir, file);
        const destPath = path.join(destDir, file);
  
        // Copy the file
        await fs.copyFile(sourcePath, destPath);
        console.log(`Copied ${file} to ${destPath}`);
      }

      // TODO: this is a temp fix because catchClientRequest had an error. remove this line later
      await fs.copyFile('repo-gen/auto-repo-template/middlewares/catchClientRequest.js', params.directoryName + '/middlewares/catchClientRequest.js');
  
      console.log('File copying completed successfully.');
    } catch (error) {
      console.error('Error copying files:', error);
    }
  }

async function writeRoutes(params) {

    var api_index = {};
    
    var route_keys = Object.keys(params.routes)

    for(var i = 0; i < route_keys.length; i++) {

        var route = route_keys[i]

        var methods = Object.keys(params.routes[route])

        if(!methods.length) {
            continue;
        }

        for(var j = 0; j < methods.length; j++) {

            var method = methods[j]

            if(params.routes[route][method]) {

                api_index[route] = api_index[route] || {};
                api_index[route][method] = params.routes[route][method].query_id;

                try {
                    await fs.writeFile(params.directoryName + '/lib/api/' + params.routes[route][method].query_id + '.js', 'module.exports = ' + JSON.stringify(params.routes[route][method], null, 2));
                    
                } catch (error) {
                    // console.error(`Error writing to file: ${error}`);
                    throw error;
                }
            }
        }

    }

    try {
        await fs.writeFile(params.directoryName + '/lib/api-index.js', 'module.exports = ' + JSON.stringify(api_index, null, 2));
        
    } catch (error) {
        // console.error(`Error writing to file: ${error}`);
        throw error;
    }

}

async function createDirectoryIfNotExists(directoryPath) {
    try {
      await fs.access(directoryPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(directoryPath, { recursive: true });
        console.log(`Directory created: ${directoryPath}`);
      } else {
        throw error;
      }
    }
  }

const deleteFolderRecursive = function (directoryPath) {
    if (fs.existsSync(directoryPath)) {
        fs.readdirSync(directoryPath).forEach((file, index) => {
          const curPath = path.join(directoryPath, file);
          if (fs.lstatSync(curPath).isDirectory()) {
           // recurse
            deleteFolderRecursive(curPath);
          } else {
            // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(directoryPath);
      }
    };


var copyRecursiveSync = function(src, dest) {
    var exists = fs.existsSync(src);
    var stats = exists && fs.statSync(src);
    var isDirectory = exists && stats.isDirectory();
    if (isDirectory) {
      fs.mkdirSync(dest);
      fs.readdirSync(src).forEach(function(childItemName) {
        copyRecursiveSync(path.join(src, childItemName),
                          path.join(dest, childItemName));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  };