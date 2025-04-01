import React from 'react';
import { View, Text, ActivityIndicator,TouchableOpacity } from 'react-native';

export const LoadingOverlay = ({ message = 'Loading...' }) => (
  <View className="absolute inset-0 bg-black/50 flex items-center justify-center">
    <View className="bg-white p-6 rounded-lg shadow-lg">
      <ActivityIndicator size="large" className="mb-4" />
      <Text className="text-gray-700 text-center">{message}</Text>
    </View>
  </View>
);

export const LoadingButton = ({ 
  isLoading, 
  children, 
  disabled,
  onPress,
  className = ''
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={isLoading || disabled}
    className={`flex-row items-center justify-center px-4 py-2 rounded-lg ${
      isLoading || disabled ? 'opacity-50' : ''
    } ${className}`}
  >
    {isLoading && <ActivityIndicator size="small" className="mr-2" />}
    {children}
  </TouchableOpacity>
);

export const LoadingPlaceholder = ({ lines = 3 }) => (
  <View className="w-full animate-pulse">
    {[...Array(lines)].map((_, i) => (
      <View 
        key={i}
        className="h-4 bg-gray-200 rounded mb-2 last:mb-0"
        style={{ width: `${Math.random() * 40 + 60}%` }}
      />
    ))}
  </View>
);