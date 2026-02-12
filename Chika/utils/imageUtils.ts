import * as ImageManipulator from 'expo-image-manipulator';

export const convertToWebP = async (uri: string): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 0.8, format: ImageManipulator.SaveFormat.WEBP }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error converting to WebP:', error);
    return uri;
  }
};