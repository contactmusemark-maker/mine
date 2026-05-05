import * as FileSystem from 'expo-file-system';

export const saveMediaFile = async (uri: string) => {
  try {
    const fileName = uri.split('/').pop() || `file-${Date.now()}`;
    const newPath = FileSystem.documentDirectory + fileName;

    await FileSystem.copyAsync({
      from: uri,
      to: newPath,
    });

    return newPath;
  } catch (error) {
    console.log('Error saving file:', error);
    return null;
  }
};