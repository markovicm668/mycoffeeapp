import React from 'react';
import { View, Text, TextInput } from 'react-native';

export const FormField = ({
  label,
  error,
  touched,
  className = '',
  ...props
}) => (
  <View className={`mb-4 ${className}`}>
    <Text className="text-gray-700 text-sm mb-1">{label}</Text>
    <TextInput
      className={`border rounded-lg px-3 py-2 ${
        error && touched ? 'border-red-500' : 'border-gray-300'
      }`}
      {...props}
    />
    {error && touched && (
      <Text className="text-red-500 text-xs mt-1">{error}</Text>
    )}
  </View>
);

export const useFormValidation = (initialValues, validationSchema) => {
  const [values, setValues] = React.useState(initialValues);
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, values[name]);
  };

  const validateField = (name, value) => {
    try {
      const fieldSchema = validationSchema.pick({ [name]: true });
      fieldSchema.validateSync({ [name]: value });
      setErrors(prev => ({ ...prev, [name]: undefined }));
    } catch (error) {
      setErrors(prev => ({ ...prev, [name]: error.message }));
    }
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur
  };
};