import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppSelector } from '../../hooks/useRedux';
import axios from 'axios';
import { API_URL } from '@env';
import { useNotification } from '../../providers/Notification';
import { ImageDimensions } from '../../types';
import { launchImageLibrary } from 'react-native-image-picker';

const MAX_FILE_SIZE_MB = 50;
const PREVIEW_IMAGE_MAX_SIZE = 300;

function UploadScreen() {
  const user = useAppSelector(state => state.user);
  const showNotification = useNotification();

  const [image, setImage] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] =
    useState<ImageDimensions | null>(null);
  const [file, setFile] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const resizeImage = (imageDimensions: ImageDimensions) => {
    const ratio = imageDimensions.width / imageDimensions.height;
    const newWidth =
      ratio > 1
        ? PREVIEW_IMAGE_MAX_SIZE
        : Math.ceil(PREVIEW_IMAGE_MAX_SIZE * ratio);
    const newHeight =
      ratio > 1
        ? Math.ceil(PREVIEW_IMAGE_MAX_SIZE / ratio)
        : PREVIEW_IMAGE_MAX_SIZE;

    return { width: newWidth, height: newHeight };
  };

  const handleImageSelect = async () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
      },
      response => {
        if (response.didCancel) return;
        if (response.errorCode) {
          showNotification('Error selecting image', 'error');
          return;
        }

        const asset = response.assets?.[0];
        if (!asset) return;

        console.log(asset.type);

        if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE_MB * 1024 * 1024) {
          showNotification('File is too large. Max size is 50MB.', 'error');
          return;
        }

        if (
          asset.type !== 'image/png' &&
          asset.type !== 'image/jpeg' &&
          asset.type !== 'image/jpg'
        ) {
          showNotification('Only PNG and JPG/JPEG files are allowed.', 'error');
          return;
        }

        setImage(asset.uri || null);
        setImageDimensions({
          width: asset.width || 0,
          height: asset.height || 0,
        });
        setFile(asset);
      },
    );
  };

  const handleUpload = async () => {
    if (!file || !file.uri) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('image', {
      uri: file.uri,
      type: file.type,
      name: file.fileName || 'image.jpg',
    });

    try {
      await axios.post(`${API_URL}/image/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      showNotification('Image uploaded successfully!', 'success');
      setImage(null);
      setImageDimensions(null);
      setFile(null);
    } catch (err) {
      console.error(err);
      showNotification('Upload failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Upload an Image</Text>
      <Text style={styles.subtitle}>Only PNG or JPG formats supported</Text>

      <TouchableOpacity
        style={styles.selectButton}
        onPress={handleImageSelect}
        disabled={loading}
      >
        <Text style={styles.selectButtonText}>Select Image</Text>
      </TouchableOpacity>

      <View style={styles.previewContainer}>
        {image && imageDimensions ? (
          <Image
            source={{ uri: image }}
            style={[styles.imagePreview, resizeImage(imageDimensions)]}
          />
        ) : (
          <Text style={styles.placeholderText}>No image selected</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.uploadButton, loading || !file ? styles.disabled : null]}
        onPress={handleUpload}
        disabled={loading || !file}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Upload Image</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  selectButton: {
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  selectButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  previewContainer: {
    width: PREVIEW_IMAGE_MAX_SIZE,
    height: PREVIEW_IMAGE_MAX_SIZE,
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  imagePreview: {
    borderRadius: 8,
  },
  placeholderText: {
    width: PREVIEW_IMAGE_MAX_SIZE,
    height: PREVIEW_IMAGE_MAX_SIZE,
    textAlign: 'center',
    color: '#aaa',
  },
  uploadButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  disabled: {
    backgroundColor: '#aaa',
  },
});

export default UploadScreen;
