// Enhanced notificationService.js
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import BASE_URL from '../screens/config';

const API_URL = `${BASE_URL}/api`;

// Configure how notifications behave when the app is in foreground
export const configureNotifications = () => {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  
  // Set up notification response handler
  Notifications.addNotificationResponseReceivedListener(response => {
    // Handle notification taps here
    const { data } = response.notification.request.content;
    
    // Navigate to relevant screen based on notification type
    if (data.type === 'ORDER_UPDATE') {
      // Navigate to ActiveOrderScreen
      // This requires navigation reference or context
    }
  });
};

// Get push token and register with backend
export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log('Physical device required for Push Notifications');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permission not granted for notifications');
    return null;
  }
  
  let options = {};
  if (Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.eas) {
    options.projectId = Constants.expoConfig.extra.eas.projectId;
  }
  const token = (await Notifications.getExpoPushTokenAsync(options)).data;
  
  // Save token to backend
  await saveDeviceToken(token);
  
  return token;
};

export const saveDeviceToken = async (token) => {
  try {
    const response = await fetch(`${API_URL}/users/device-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${global.userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error saving device token:', error);
    return false;
  }
};

// import * as Notifications from 'expo-notifications';
// import * as Device from 'expo-device';

// export const registerForPushNotifications = async () => {
//   if (!Device.isDevice) {
//     return false;
//   }

//   const { status: existingStatus } = await Notifications.getPermissionsAsync();
//   let finalStatus = existingStatus;
  
//   if (existingStatus !== 'granted') {
//     const { status } = await Notifications.requestPermissionsAsync();
//     finalStatus = status;
//   }

//   if (finalStatus !== 'granted') {
//     return false;
//   }

//   const token = (await Notifications.getExpoPushTokenAsync()).data;
//   return token;
// };

// export const saveDeviceToken = async (userId, token) => {
//   try {
//     const response = await fetch(`${API_URL}/users/device-token`, {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${global.userToken}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({ token }),
//     });
//     return response.ok;
//   } catch (error) {
//     console.error('Error saving device token:', error);
//     return false;
//   }
// };

// export const configureNotifications = () => {
//   Notifications.setNotificationHandler({
//     handleNotification: async () => ({
//       shouldShowAlert: true,
//       shouldPlaySound: true,
//       shouldSetBadge: true,
//     }),
//   });
// };