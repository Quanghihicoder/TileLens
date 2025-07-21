import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../../hooks/useRedux';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types';

function SplashScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppSelector(state => state.user);

  useEffect(() => {
    if (user.id != null) {
      navigation.replace('Main', { screen: 'ImageList' });
    } else {
      navigation.replace('Auth');
    }
  }, [user]);

  return (
    <SafeAreaView style={styles.container}>
      <View>
        <Text style={styles.text}>TileLens</Text>
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
  text: {
    fontSize: 34,
    fontWeight: 900,
  },
});

export default SplashScreen;
