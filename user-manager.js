let jsonfile = require('jsonfile');

/**
 * Bot save data on a simple json object and keep it on disk as a json file
 * Users List object with user single object:
 * [{
 *   id: "userId",
 *   keys: [
 *       {
            key: "channelKey",
            id: "channelId/groupId"
         },
 *       ...
 *     ]
 *  },
 *  ...]
 */

// Path of the bot users list file
const FILE_PATH = './users-list.json';

// The main users object
let users = null;

// Read users data from file
function readUsersFile() {
  users = jsonfile.readFileSync(FILE_PATH) || {};
}

// Write back data to file
function writeUsersFile() {
  jsonfile.writeFileSync(FILE_PATH, users);
}

// Add new user to main Users object, after check if not exists
function addUser(userId) {
  if (!users.filter((u) => u.id === userId).length) {
    let user = {
      id: userId,
      keys: []
    };

    users.push(user);
    return true;
  } else {
    // User exists
    return false;
  }
}

/**
 * Add user key to his object of main Users object and save to file
 * Check if key is not exists for this user
 * User single object:
 * {
 *   id: userId,
 *   keys: [{ key: channelKey/groupKey, id: channelId/groupId}]
 * }
 */
function addKey(user) {
  let currentUser = users.filter((u) => u.id === user.id)[0];

  if (!currentUser.keys.filter((k) => k.key === user.keys[0].key).length) {

    currentUser.keys.push(user.keys[0]);

    writeUsersFile();

    return true;
  } else {
    // The key user want to add is exists try another one
    return false;
  }
}

/**
 * Return just channel or group id by user id and key value
 * If user is not exists return null
 * If user exists but key is not exists return just userId with result object
 * If key exists too return full single user object
 * User single object:
 * {
 *   id: userId,
 *   keys: [{ key: channelKey/groupKey, id: channelId/groupId}]
 * }
 */
function getId(user) {
  let result = null;

  let currentUser = users.filter((u) => u.id === user.id);

  if (currentUser.length) {
    result = {};
    result.id = currentUser[0].id;

    let currentKey = currentUser.keys.filter((k) => k.key === user.keys[0].key);

    if (currentKey.length) {
      result.keys[0] = currentKey[0];
    }
  }

  return result;
}

// Load users list from file to memory on start
readUsersFile();

module.exports.addUser = addUser;
module.exports.addKey = addKey;
module.exports.getId = getId;
