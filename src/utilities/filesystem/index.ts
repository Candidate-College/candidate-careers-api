/**
 * Cloud storage library.
 */
const storage = require('@/config/storage');

type StorageAction = 'upload' | 'remove' | 'update';
const doFile = async (action: StorageAction, ...args: any[]): Promise<any> => {
  return await require(`./${storage.driver}`)[action](...args);
};

exports.upload = async (...args: any): Promise<any> => await doFile('upload', ...args);
exports.remove = async (...args: any): Promise<any> => await doFile('remove', ...args);
exports.update = async (...args: any): Promise<any> => await doFile('update', ...args);
