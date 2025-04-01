import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';

export const ConfirmationDialog = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'bg-blue-500',
  type = 'default'
}) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          confirmButton: 'bg-red-500',
          icon: 'text-red-500'
        };
      case 'warning':
        return {
          confirmButton: 'bg-yellow-500',
          icon: 'text-yellow-500'
        };
      default:
        return {
          confirmButton: confirmStyle,
          icon: 'text-blue-500'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-lg w-[90%] max-w-md p-4">
          <Text className="text-xl font-semibold text-gray-900 mb-2">
            {title}
          </Text>
          
          <Text className="text-gray-600 mb-6">
            {message}
          </Text>
          
          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="px-4 py-2 rounded-lg bg-gray-100"
            >
              <Text className="text-gray-700 font-medium">
                {cancelText}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onConfirm}
              className={`px-4 py-2 rounded-lg ${typeStyles.confirmButton}`}
            >
              <Text className="text-white font-medium">
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export const ValidationErrorDialog = ({
  visible,
  errors = [],
  onClose
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
  >
    <View className="flex-1 justify-center items-center bg-black/50">
      <View className="bg-white rounded-lg w-[90%] max-w-md p-4">
        <Text className="text-xl font-semibold text-red-600 mb-4">
          Please Fix the Following Errors
        </Text>
        
        <View className="mb-4">
          {errors.map(error => (
            <Text 
              key={error.key} 
              className="text-gray-600 mb-2"
            >
              • {error.message}
            </Text>
          ))}
        </View>
        
        <TouchableOpacity
          onPress={onClose}
          className="bg-gray-100 px-4 py-2 rounded-lg self-end"
        >
          <Text className="text-gray-700 font-medium">
            OK
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export const useConfirmation = () => {
  const [dialog, setDialog] = React.useState({
    visible: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'default'
  });

  const confirm = ({
    title,
    message,
    onConfirm,
    type = 'default'
  }) => new Promise(resolve => {
    setDialog({
      visible: true,
      title,
      message,
      onConfirm: () => {
        resolve(true);
        onConfirm?.();
        setDialog(prev => ({ ...prev, visible: false }));
      },
      onCancel: () => {
        resolve(false);
        setDialog(prev => ({ ...prev, visible: false }));
      },
      type
    });
  });

  return {
    confirm,
    dialog,
    closeDialog: () => setDialog(prev => ({ ...prev, visible: false }))
  };
};