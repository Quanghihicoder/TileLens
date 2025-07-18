import { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppSelector } from '../../hooks/useRedux';
import axios from 'axios';
import { API_URL, ASSETS_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';
import { type ImageData } from '../../types';
import { useNotification } from '../../providers/Notification';
import Clipboard from '@react-native-clipboard/clipboard';

function ListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const showNotification = useNotification();

  const user = useAppSelector(state => state.user);

  const [images, setImages] = useState<ImageData[]>([]);
  const [filter, setFilter] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);

    const fetchImages = async () => {
      try {
        const response = await axios.get(`${API_URL}/image/${user.id}`, {
          withCredentials: true,
        });

        const newImages = [...(response?.data?.images || [])].sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
        );

        if (newImages && JSON.stringify(newImages) !== JSON.stringify(images)) {
          setImages(newImages);
        }
      } catch (err: any) {
        showNotification('Failed to fetch images', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
    const intervalId = setInterval(fetchImages, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const filteredImages = images.filter(img => {
    if (filter === 0) return true;
    if (filter === 1) return !img.isClipped && !img.isBlended;
    if (filter === 2) return img.isClipped;
    if (filter === 3) return img.isBlended;
    return true;
  });

  const imgUrl = (userId: string, imageId: string, imageType: string): string =>
    `${ASSETS_URL}/images/${userId}/${imageId}.${imageType}`;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>My Images</Text>

      <View style={styles.filters}>
        {['All', 'Uploaded', 'Clipped', 'Blended'].map((label, index) => (
          <TouchableOpacity key={label} onPress={() => setFilter(index)}>
            <Text
              style={[
                styles.filterButton,
                filter === index && styles.activeFilter,
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {user.id != null && (
        <FlatList
          data={filteredImages}
          keyExtractor={item => item.imageId}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Image
                source={{
                  uri: imgUrl(
                    user.id!.toString(),
                    item.imageId,
                    item.imageType,
                  ),
                }}
                style={styles.image}
              />
              <View style={styles.info}>
                <Text style={styles.text}>
                  <Text style={styles.label}>ID:</Text> {item.imageId}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.label}>Name:</Text>{' '}
                  {item.imageOriginalName}
                </Text>
                <Text style={styles.text}>
                  <Text style={styles.label}>Type:</Text> {item.imageType}
                </Text>
              </View>
              <View style={styles.actions}>
                {item.processing ? (
                  <Text style={styles.processing}>Processing...</Text>
                ) : (
                  <>
                    <TouchableOpacity
                      style={styles.button}
                      onPress={() =>
                        navigation.navigate('ImageView', {
                          imageId: item.imageId,
                        })
                      }
                    >
                      <Text style={styles.buttonText}>View</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => Clipboard.setString(item.imageId)}
                    >
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f9fafb', flex: 1 },
  heading: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  filters: { flexDirection: 'row', justifyContent: 'center', marginBottom: 24 },
  filterButton: {
    marginHorizontal: 8,
    fontSize: 16,
    color: 'white',
    padding: 10,
    backgroundColor: 'gray',
    borderRadius: 10,
  },
  activeFilter: { backgroundColor: '#007bff' },
  card: {
    marginBottom: 16,
    padding: '5%',
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 12,
    resizeMode: 'contain',
  },
  info: { marginBottom: 12 },
  text: { marginBottom: 4, color: '#333' },
  label: { fontWeight: '600' },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly' },
  button: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 600 },
  copyButton: {
    backgroundColor: '#eee',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },
  copyButtonText: { color: '#333', fontSize: 16, fontWeight: 600 },
  processing: {
    color: 'gray',
    textAlign: 'center',
    fontSize: 16,
    paddingHorizontal: 18,
    fontWeight: 600,
  },
});

export default ListScreen;
