import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import SplashScreen from './screens/Splash/SplashScreen';
import { useAppDispatch } from './hooks/useRedux';
import { clearUser, loadUser, setUser } from './features/user/userSlice';
import { useEffect, useState } from 'react';
import ListScreen from './screens/Image/ListScreen';
import AuthScreen from './screens/Auth/AuthScreen';
import { ActivityIndicator, View } from 'react-native';
import UploadScreen from './screens/Image/UploadScreen';
import ViewScreen from './screens/Image/ViewScreen';
import AccountScreen from './screens/Account/AccountScreen';
import axios from 'axios';
import { API_URL } from '@env';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // tabBarIcon: ({ color, size }) => {
        //   let iconName = 'home';

        //   if (route.name === 'Home') iconName = 'home-outline';
        //   else if (route.name === 'Images') iconName = 'image-outline';
        //   else if (route.name === 'Profile') iconName = 'person-outline';

        //   return <Icon name={iconName} size={size} color={color} />;
        // },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen
        name="ImageList"
        component={ListScreen}
        options={{ tabBarLabel: 'My Images' }}
      />
      <Tab.Screen
        name="ImageUpload"
        component={UploadScreen}
        options={{ tabBarLabel: 'Upload Image' }}
      />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

function App() {
  const dispatch = useAppDispatch();
  const [isReady, setIsReady] = useState(false);

  // useEffect(() => {
  //   const init = async () => {
  //     await dispatch(loadUser());
  //     setIsReady(true);
  //   };
  //   init();
  // }, [dispatch]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await axios.get(`${API_URL}/current_user`, {
          withCredentials: true,
        });
        if (response.data.user) {
          await dispatch(setUser(response.data.user));
        } else {
          await dispatch(clearUser());
        }
      } catch {
        await dispatch(clearUser());
      } finally {
        setIsReady(true);
      }
    }

    fetchUser();
  }, [dispatch]);

  if (!isReady) {
    return (
      <View>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Main" component={AppTabs} />
        <Stack.Screen name="ImageView" component={ViewScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
