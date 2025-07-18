// NotificationProvider.tsx
import React, { createContext, useContext, useRef, useState } from 'react';
import { Text, StyleSheet, Animated, Dimensions } from 'react-native';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

const NotificationContext = createContext<
  (message: string, type?: NotificationType) => void
>(() => {});

export const useNotification = () => useContext(NotificationContext);

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState<NotificationType>('info');
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (
    text: string,
    notificationType: NotificationType = 'info',
  ) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setMessage(text);
    setType(notificationType);
    setVisible(true);

    // Animate in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    const wordCount = text.trim().split(/\s+/).length;
    const duration = Math.min((wordCount / 2) * 1000, 20000); // max 20s

    timeoutRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }, duration);
  };

  const getNotificationColor = () => {
    switch (type) {
      case 'success':
        return '#22c55e'; // green
      case 'error':
        return '#ef4444'; // red
      case 'warning':
        return '#eab308'; // yellow
      case 'info':
      default:
        return '#3b82f6'; // blue
    }
  };

  return (
    <NotificationContext.Provider value={showNotification}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.notification,
            { backgroundColor: getNotificationColor(), opacity: fadeAnim },
          ]}
        >
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      )}
    </NotificationContext.Provider>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  notification: {
    position: 'absolute',
    top: 60,
    left: width / 2 - 150,
    width: 300,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 10,
    alignItems: 'center',
  },
  message: {
    color: '#fff',
    textAlign: 'center',
  },
});
