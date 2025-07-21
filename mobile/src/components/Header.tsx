import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

interface HeaderProps {
  imageId: string;
}

const Header: React.FC<HeaderProps> = ({ imageId }) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity style={styles.backButton} onPress={handleBack}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>{imageId}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  backButton: {
    position: 'absolute',
    left: '3%',
  },
  backButtonText: {
    fontSize: 16,
    color: 'blue',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Header;
