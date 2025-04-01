import { View, StyleSheet, StatusBar, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { FontAwesome } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import ErrorBoundary from './utils/error-boundary';
import { ToastProvider } from './utils/toastNotifications';
import { theme } from './screens/styles';
import React, { useState, useEffect } from 'react';
import { CartProvider } from './screens/CartContext';
import { configureNotifications, registerForPushNotifications } from './utils/notificationService';

// Screen imports
import StoresScreen from './screens/StoresScreen';
import OrdersScreen from './screens/OrdersScreen';
import AuthScreen from './screens/AuthScreen';
import StoreManagementScreen from './screens/StoreManagementScreen';
import ProfileScreen from './screens/ProfileScreen';
import ActiveOrderScreen from './screens/ActiveOrderScreen';
import MenuManagement from './screens/MenuManagement';
import MapScreen from './screens/mapScreen';
import StoreOwnerDashboardScreen from './screens/StoreOwnerDashboard';
import StoreMenuModal from './screens/StoreMenuModal';
import OrderSummaryScreen from './screens/OrderSummaryScreen';
import CheckoutScreen from './screens/CheckoutScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Separate stack navigator for Stores screen
const StoresStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="StoresMain" component={StoresScreen} />
  </Stack.Navigator>
);

// NEW: Add a stack navigator for Map screen
const MapStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MapMain" component={MapScreen} />
  </Stack.Navigator>
);

const TabNavigator = () => {
  const isAuthorized = ['admin', 'coffee_shop'].includes(global.userRole);
  const isAdmin = global.userRole === 'admin';
  const isCoffeeShop = global.userRole === 'coffee_shop';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName;
          switch (route.name) {
            case 'StoresTab':
              iconName = 'map-marker';
              break;
            case 'MapTab': // Changed name to match the stack
              iconName = 'map';
              break;
            case 'Orders':
              iconName = 'shopping-bag';
              break;
            case 'StoreManagement':
              iconName = 'building';
              break;
            case 'MenuManagement':
              iconName = 'cutlery';
              break;
            case 'ActiveOrder':
              iconName = 'clock-o';
              break;
            case 'Profile':
              iconName = 'user';
              break;
            default:
              iconName = 'question';
          }
          return <FontAwesome name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8B4513',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: theme.white,
        },
        headerTintColor: theme.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      {!isAuthorized && (
        <>
          <Tab.Screen
            name="StoresTab"
            component={StoresStack}
            options={{ title: 'Stores' }}
          />
          <Tab.Screen
            name="MapTab" // Changed from Map to MapTab
            component={MapStack} // Use MapStack instead of MapScreen directly
            options={{
              title: 'Map View',
              headerTitle: 'Find Coffee'
            }}
          />
          <Tab.Screen
            name="ActiveOrder"
            component={ActiveOrderScreen}
            options={{
              title: 'My Order',
              headerTitle: 'Active Order'
            }}
          />
        </>
      )}

      {isAuthorized && (
        <Tab.Screen
          name="Orders"
          component={OrdersScreen}
          options={{
            title: 'All Orders',
            headerTitle: 'Manage Orders'
          }}
        />
      )}

      {isCoffeeShop && (
        <>
          <Tab.Screen
            name="MenuManagement"
            component={MenuManagement}
            options={{
              title: 'Menu',
              headerTitle: 'Manage Menu'
            }}
          />
          <Tab.Screen
            name="Dashboard"
            component={StoreOwnerDashboardScreen}
            options={{
              title: 'Dashboard',
              headerTitle: 'Store Dashboard',
              tabBarIcon: ({ color, size }) => (
                <FontAwesome name="dashboard" size={size} color={color} />
              )
            }}
          />
        </>
      )}

      {isAdmin && (
        <Tab.Screen
          name="StoreManagement"
          component={StoreManagementScreen}
          options={{
            title: 'Stores',
            headerTitle: 'Store Management'
          }}
        />
      )}

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerTitle: 'My Profile'
        }}
      />
    </Tab.Navigator>
  );
};

const navigationOptions = {
  headerShown: false,
  headerStyle: {
    backgroundColor: theme.white,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowOffset: { height: 2 },
    height: Platform.OS === 'ios' ? 96 : 56,
  },
  headerTitleStyle: {
    fontSize: 28,
    fontWeight: '600',
    color: theme.primary,
    letterSpacing: 0.5,
  },
  headerTitleAlign: 'left',
  headerLeftContainerStyle: {
    paddingLeft: 16,
  },
  headerRightContainerStyle: {
    paddingRight: 16,
  },
  headerShadowVisible: false,
  statusBar: {
    backgroundColor: theme.white,
    barStyle: 'dark-content',
  }
};

export default function App() {
  // Add useEffect for notifications setup
  React.useEffect(() => {
    configureNotifications();
    registerForPushNotifications();
  }, []);

  return (
    <CartProvider>
      <NavigationContainer>
        <StatusBar backgroundColor="red" barStyle="dark-content" />
        <View style={styles.container}>
          <ErrorBoundary>
            <ToastProvider>
              <Stack.Navigator screenOptions={navigationOptions}>
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="MainApp" component={TabNavigator} />
                <Stack.Screen
                  name="StoreMenuModal"
                  component={StoreMenuModal}
                  options={{
                    headerShown: false,
                  }}
                />
                <Stack.Screen name="OrderSummary" component={OrderSummaryScreen} options={{ headerShown: false }} />
                <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
              </Stack.Navigator>
            </ToastProvider>
          </ErrorBoundary>
        </View>
      </NavigationContainer>
    </CartProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});