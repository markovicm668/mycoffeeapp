import React, { createContext, useContext, useState, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';

export const ToastContext = createContext({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showToast = ({ message, type = 'info', duration = 3000 }) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }),
      Animated.delay(duration),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      })
    ]).start(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    });
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      <View style={styles.container}>
        {children}
        <View style={styles.toastContainer}>
          {toasts.map(toast => (
            <Animated.View 
              key={toast.id}
              style={[
                styles.toast,
                styles[toast.type],
                { opacity: fadeAnim }
              ]}
            >
              <Text style={styles.toastText}>{toast.message}</Text>
            </Animated.View>
          ))}
        </View>
      </View>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  toast: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#333',
    minWidth: 200,
  },
  info: {
    backgroundColor: '#3498db',
  },
  success: {
    backgroundColor: '#2ecc71',
  },
  error: {
    backgroundColor: '#e74c3c',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});