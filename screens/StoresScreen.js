import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Image,
  StyleSheet,
  StatusBar,
  Animated,
  PanResponder,
  Platform,
  Dimensions
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import BASE_URL from './config';
import StoreMenuModal from './StoreMenuModal';
import * as storeUtils from './storeUtils';
import { getStoreImages } from './storeImageUtils';
import * as Location from 'expo-location';
import { RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCart } from './CartContext';

const API_URL = `${BASE_URL}/api`;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function StoresScreen() {
  const navigation = useNavigation();
  const { cartItems, clearCart } = useCart();
  const [shops, setShops] = useState([]);
  const [previousStore, setPreviousStore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);

  useEffect(() => {
    const init = async () => {
      await getCurrentLocation();
      fetchShops();
    };
    init();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchShops();
    }
  }, [userLocation]);

  useFocusEffect(
    useCallback(() => {
      const currentStore = global.selectedStoreId;
      
      setPreviousStore(currentStore);
    }, [cartItems.length, clearCart])
  );


  // Modify openMenu function to track the selected store
  const openMenu = useCallback((store) => {
    // If we have a previous store ID and it's different from current selection
    if (global.lastStoreId && global.lastStoreId !== store._id && cartItems.length > 0) {
      // Clear the cart when changing stores
      clearCart();
    }
    
    // Update the last store ID
    global.lastStoreId = store._id;
    
    // Navigate to the store menu
    navigation.navigate('StoreMenuModal', { store: store });
  }, [navigation, cartItems, clearCart]);

  const fetchShops = async () => {
    try {
      setIsLoading(true);
      const locationParams = userLocation ?
        `?lat=${userLocation.coords.latitude}&lng=${userLocation.coords.longitude}&radius=50` : '';

      const response = await fetch(`${API_URL}/stores${locationParams}`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shops');
      }

      let data = await response.json();

      // If we have user location, calculate and add distance to each shop
      if (userLocation) {
        data = data.map(shop => {
          if (shop.location && shop.location.coordinates) {
            // Calculate distance (if not already provided by API)
            if (shop.distance == null) {
              const distance = calculateDistance(
                userLocation.coords.latitude,
                userLocation.coords.longitude,
                shop.location.coordinates[1], // latitude
                shop.location.coordinates[0]  // longitude
              );
              return { ...shop, distance };
            }
          }
          return shop;
        });

        // Sort shops by distance
        data.sort((a, b) => {
          // Handle null distances - put them at the end
          if (a.distance == null && b.distance == null) return 0;
          if (a.distance == null) return 1;
          if (b.distance == null) return -1;
          return a.distance - b.distance;
        });
      } else {
        // If no location, sort by name
        data.sort((a, b) => a.name.localeCompare(b.name));
      }

      setShops(data);
    } catch (error) {
      setError('Unable to load shops. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status);

      if (status !== 'granted') {
        console.log('Location permission not granted');
        // Still fetch shops but without location
        fetchShops();
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced
      });
      setUserLocation(location);
      fetchShops();
    } catch (error) {
      console.error('Error getting location:', error);
      // Still fetch shops but without location
      fetchShops();
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchShops();
  }, []);

  const renderShopItem = ({ item: shop }) => {
    const storeStatus = storeUtils.getStoreStatus(shop.hours);
    const images = getStoreImages(shop);

    return (
      <TouchableOpacity
        style={styles.shopCard}
        onPress={() => openMenu(shop)}
        activeOpacity={0.7}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: images[0] }}
            style={styles.shopImage}
          />
          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: storeStatus.isOpen ? theme.success : theme.error }
              ]}
            />
            <Text style={styles.statusText}>
              {storeStatus.isOpen ? 'Open' : 'Closed'}
            </Text>
          </View>
        </View>

        <View style={styles.shopContent}>
          <View style={styles.shopHeader}>
            <Text style={styles.shopName} numberOfLines={1}>
              {shop.name}
            </Text>
            {shop.distance != null && (
              <Text style={styles.distanceText}>
                {formatDistance(shop.distance)}
              </Text>
            )}
          </View>

          <View style={styles.locationContainer}>
            <View style={styles.addressRow}>
              <FontAwesome
                name="map-marker"
                size={16}
                color={theme.secondary}
                style={styles.locationIcon}
              />
              <Text style={styles.shopAddress} numberOfLines={2}>
                {shop.address}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={fetchShops}
        >
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.safeArea}>

        <View style={styles.header}>
          <Text style={styles.title}>Coffee Shops</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="search" size={20} color={theme.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <FontAwesome name="heart" size={20} color={theme.primary} />
            </TouchableOpacity>
          </View>
        </View>


        <View style={styles.container}>
          <FlatList
            data={shops}
            renderItem={renderShopItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.shopList}
          />
        </View>

      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  safeArea: {
    flex: 1,
    backgroundColor: "white", // Changed from gray to white
    paddingTop: StatusBar.currentHeight
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 0, // Increased padding
    backgroundColor: theme.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 3,
  },
  title: {
    fontSize: 28, // Increased font size
    fontWeight: '600',
    color: theme.primary,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  shopList: {
    padding: 16,
    backgroundColor: "#F5F5F5",
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    color: theme.secondary,
    textAlign: 'center',
  },
  shopCard: {
    backgroundColor: theme.white,
    borderRadius: 16,
    marginBottom: 16,
    // overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  imageContainer: {
    position: 'relative',
  },
  shopImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  shopContent: {
    padding: 16,
  },
  shopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    flex: 1,
    marginRight: 8,
    letterSpacing: 0.25,
  },
  locationContainer: {
    marginTop: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  locationIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  shopAddress: {
    fontSize: 14,
    color: theme.secondary,
    flex: 1,
    lineHeight: 20,
  },
  statusContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  distanceText: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '500',
    backgroundColor: theme.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  button: {
    backgroundColor: theme.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  buttonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '500',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: theme.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },


  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
  overlayTouch: {
    flex: 1,
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: theme.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: -2,
          height: 0,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 25,
      },
    }),
  },
});