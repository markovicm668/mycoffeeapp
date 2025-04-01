import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { styles, theme } from './styles';
import BASE_URL from './config';
import { validateProfile, formatValidationErrors } from '../utils/validation';
import { ValidationErrorDialog } from '../utils/dialog-components';

const API_URL = `${BASE_URL}/api`;

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phoneNumber: '',
    role: 'user'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showErrors, setShowErrors] = useState(false);

  const roles = [
    { id: 'user', label: 'Customer', icon: 'user' },
    { id: 'coffee_shop', label: 'Coffee Shop', icon: 'coffee' },
    { id: 'admin', label: 'Admin', icon: 'cog' }
  ];

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAuth = async () => {
    try {
      if (!isLogin) {
        const { isValid, errors } = validateProfile(formData);
        console.log('Validation result:', isValid, errors);
        if (!isValid) {
          setValidationErrors(formatValidationErrors(errors));
          setShowErrors(true);
          return;
        }
      }

      setIsLoading(true);
      const endpoint = isLogin ? 'login' : 'signup';
      const payload = isLogin
        ? {
          email: formData.email,
          password: formData.password
        }
        : formData;

      const response = await fetch(`${API_URL}/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      global.userToken = data.token;
      global.userRole = data.user.role;

      navigation.replace('MainApp');
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderRoleSelector = () => (
    <View style={roleStyles.container}>
      <Text style={roleStyles.label}>Select Account Type:</Text>
      <View style={roleStyles.buttonContainer}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[
              roleStyles.roleButton,
              formData.role === role.id && roleStyles.selectedRole
            ]}
            onPress={() => handleChange('role', role.id)}
          >
            <FontAwesome
              name={role.icon}
              size={24}
              color={formData.role === role.id ? theme.white : theme.accent}
              style={roleStyles.roleIcon}
            />
            <Text style={[
              roleStyles.roleText,
              formData.role === role.id && roleStyles.selectedRoleText
            ]}>
              {role.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={roleStyles.outerContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'position'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView
          contentContainerStyle={roleStyles.scrollViewContent}
          keyboardShouldPersistTaps="handled" // This is key - allows taps while keyboard is visible
        >
          <View style={roleStyles.formContainer}>

            <Text style={roleStyles.header}>
              {isLogin ? 'Welcome Back!' : 'Create Account'}
            </Text>

            {!isLogin && (
              <>
                <TextInput
                  style={roleStyles.input}
                  placeholder="Name"
                  value={formData.name}
                  onChangeText={(value) => handleChange('name', value)}
                  autoCapitalize="words"
                />
                <TextInput
                  style={roleStyles.input}
                  placeholder="Phone Number"
                  value={formData.phoneNumber}
                  onChangeText={(value) => handleChange('phoneNumber', value)}
                  keyboardType="phone-pad"
                />
                {renderRoleSelector()}
              </>
            )}

            <TextInput
              style={roleStyles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(value) => handleChange('email', value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={roleStyles.input}
              placeholder="Password"
              value={formData.password}
              onChangeText={(value) => handleChange('password', value)}
              secureTextEntry
            />

            <TouchableOpacity
              style={roleStyles.authButton}
              onPress={handleAuth}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={theme.white} />
              ) : (
                <Text style={roleStyles.authButtonText}>
                  {isLogin ? 'Login' : 'Sign Up'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={roleStyles.buttonSecondary}
              onPress={() => {
                setIsLogin(!isLogin);
                setFormData({
                  email: '',
                  password: '',
                  name: '',
                  phoneNumber: '',
                  role: 'user'
                });
              }}
            >
              <Text style={roleStyles.buttonSecondaryText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : "Already have an account? Login"
                }
              </Text>
            </TouchableOpacity>

            <ValidationErrorDialog
              visible={showErrors}
              errors={validationErrors}
              onClose={() => setShowErrors(false)}
            />

            <View style={{ height: 30 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const roleStyles = StyleSheet.create({
  authButton: {
    backgroundColor: theme.accent,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  authButtonText: {
    color: theme.white,
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: theme.secondary,
    marginBottom: 12,
    fontWeight: '500',
  },
  buttonContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.white,
  },
  selectedRole: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  roleIcon: {
    marginRight: 12,
  },
  roleText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '500',
  },
  selectedRoleText: {
    color: theme.white,
  },
  button: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Roboto',
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5', // Light gray background
  },

  centered: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  outerContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: 'center', // Center content if there's extra space
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 24,
    textAlign: 'center',
  },

  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    color: theme.primary,
  },

  buttonSecondary: {
    padding: 12,
    alignItems: 'center',
  },

  buttonSecondaryText: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});