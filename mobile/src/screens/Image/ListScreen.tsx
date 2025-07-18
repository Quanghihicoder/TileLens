import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import axios from 'axios';
import { clearUser } from '../../features/user/userSlice';
import { API_URL } from '@env';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

function ListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      await dispatch(clearUser());
      navigation.replace('Auth');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text onPress={handleLogout}> Hello {user && user.username}</Text>
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
});

export default ListScreen;
