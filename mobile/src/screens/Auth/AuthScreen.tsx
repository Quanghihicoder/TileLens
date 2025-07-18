import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';
import axios from 'axios';
import { useNotification } from '../../providers/Notification';
import { API_URL } from '@env';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { setUser } from '../../features/user/userSlice';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

function AuthScreen() {
  const [username, setUsername] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const dispatch = useAppDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const showNotification = useNotification();

  const handleSubmit = async () => {
    if (username.length == 0) {
      showNotification('Please enter a username!', 'error');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/login`,
        { username },
        {
          withCredentials: true,
        },
      );

      if (response?.data?.user) {
        const { id, username } = response.data.user;
        await dispatch(setUser({ id, username }));
        // Redirect to image list screen after login
        navigation.replace('Main', { screen: 'ImageList' });
      }
    } catch (error) {
      console.error('Error login:', error);
      showNotification('Failed to login.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign in to your account</Text>

        <View style={styles.notes}>
          <Text style={styles.note}>Account Authentication</Text>
          <Text style={styles.note}>
            - Remember your credentials for future logins.
          </Text>
          <Text style={styles.note}>
            - New unique usernames will register as new accounts.
          </Text>
          <Text style={styles.note}>
            - If you sign in and see at least one image, you're likely viewing
            someone else's account. :D
          </Text>
        </View>

        <TextInput
          placeholder="Enter your username or 'Test' for test user"
          style={styles.input}
          value={username}
          onChangeText={setUsername}
        />

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && { backgroundColor: '#4c51bf' },
            loading && { opacity: 0.6 },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: '#1a202c',
    marginBottom: 20,
  },
  notes: {
    marginBottom: 16,
  },
  note: {
    fontSize: 14,
    color: '#4a5568',
    marginBottom: 4,
  },
  input: {
    borderColor: '#cbd5e0',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    fontSize: 16,
    marginBottom: 16,
    color: '#1a202c',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AuthScreen;
