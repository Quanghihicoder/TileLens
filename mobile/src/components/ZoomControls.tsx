import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={onZoomIn}>
        <Text style={styles.symbol}>+</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={onZoomOut}>
        <Text style={styles.symbol}>−</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingHorizontal: 10,
    backgroundColor: '#2563eb',
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  button: {
    width: 36,
    height: '60%',
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  symbol: {
    fontSize: 22,
    color: '#1f2937',
    fontWeight: 'bold',
  },
});
