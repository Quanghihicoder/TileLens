import { SafeAreaView, StyleSheet, Text } from 'react-native';

function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Hello World!</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default HomeScreen;
