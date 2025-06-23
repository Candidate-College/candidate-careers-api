const storage = require('@/config/storage');

const upload = async (file: any, directory: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!file || !file.data || file.data.length === 0) {
        return reject(new Error('Invalid or empty file'));
      }

      const stream = storage.uploader.upload_stream(
        {
          format: 'webp',
          resource_type: 'image',
          directory,
        },
        (error: any, result: any) => {
          if (error) return reject(new Error(error));
          resolve({
            secure_url: result.secure_url,
            name: file.name,
          });
        },
      );

      stream.end(file.data);
    } catch (error) {
      reject(error);
    }
  });
};
exports.upload = upload;

const remove = async (name: string) => {
  const arr = name.split('/');
  const publicId = arr.slice(-2).join('/').replace(/\.[^/.]+$/, '');

  return storage.uploader.destroy(publicId, {
    resource_type: 'image',
    invalidate: true,
  });
};
exports.remove = remove;

exports.update = async (oldFilePath: string, newFile: any, directory: string) => {
  try {
    if (oldFilePath) {
      // Delete old file if it exists
      await remove(oldFilePath);
    }

    // Upload new file
    const uploadedFile: any = await upload(newFile, directory);
    return uploadedFile.secure_url;
  } catch (error: any) {
    throw new Error(`Error updating file: ${error.message}`);
  }
};
