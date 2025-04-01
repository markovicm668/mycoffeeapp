import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Dimensions,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    Platform,
    StatusBar
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import * as storeUtils from './storeUtils';
import StoreMenuModal from './StoreMenuModal';
import BASE_URL from './config';
import { useCart } from './CartContext';

const API_URL = `${BASE_URL}/api`;
const { width, height } = Dimensions.get('window');

export default function MapScreen({ navigation }) {
    const [region, setRegion] = useState({
        latitude: 44.8125,
        longitude: 20.4612,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1
    });
    const [stores, setStores] = useState([]);
    const [selectedStore, setSelectedStore] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [userLocation, setUserLocation] = useState(null);
    const [mapError, setMapError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { cartItems, clearCart } = useCart();

    useEffect(() => {
        const init = async () => {
            await getCurrentLocation();
            await fetchStores();
            setIsLoading(false);
        };
        init();
    }, []);

    const getCurrentLocation = async () => {
        try {
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Location permission denied');
                return;
            }

            // Get current location
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced
            });

            setUserLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
            });

            // Set initial region to user's location
            setRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
            });
        } catch (error) {
            console.error('Error getting location:', error);
            setMapError(true);
        }
    };

    const fetchStores = async () => {
        try {
            const locationParams = userLocation ?
                `?lat=${userLocation.latitude}&lng=${userLocation.longitude}&radius=50` : '';

            const response = await fetch(`${API_URL}/stores${locationParams}`, {
                headers: {
                    'Authorization': `Bearer ${global.userToken}`
                }
            });

            if (!response.ok) throw new Error('Failed to fetch stores');
            
            const data = await response.json();
            setStores(data);

            // Calculate region to fit all stores if no user location
            if (!userLocation && data.length > 0) {
                calculateRegionForStores(data);
            }
        } catch (error) {
            console.error('Error fetching stores:', error);
            Alert.alert('Error', 'Failed to load stores. Please try again.');
        }
    };

    const calculateRegionForStores = (storesData) => {
        // Get all valid coordinates
        const coordinates = storesData
            .filter(store => store.location && store.location.coordinates)
            .map(store => ({
                latitude: store.location.coordinates[1],
                longitude: store.location.coordinates[0]
            }));

        if (coordinates.length === 0) return;

        // Find the bounding box
        let minLat = coordinates[0].latitude;
        let maxLat = coordinates[0].latitude;
        let minLng = coordinates[0].longitude;
        let maxLng = coordinates[0].longitude;

        coordinates.forEach(coord => {
            minLat = Math.min(minLat, coord.latitude);
            maxLat = Math.max(maxLat, coord.latitude);
            minLng = Math.min(minLng, coord.longitude);
            maxLng = Math.max(maxLng, coord.longitude);
        });

        // Add some padding
        const latDelta = (maxLat - minLat) * 1.5 + 0.02;
        const lngDelta = (maxLng - minLng) * 1.5 + 0.02;

        // Set region to include all stores
        setRegion({
            latitude: (minLat + maxLat) / 2,
            longitude: (minLng + maxLng) / 2,
            latitudeDelta: Math.max(latDelta, 0.05),
            longitudeDelta: Math.max(lngDelta, 0.05)
        });
    };

    const handleStoreSelect = (store) => {
      // If we have a previous store ID and it's different from current selection
      if (global.lastStoreId && global.lastStoreId !== store._id && cartItems.length > 0) {
          // Clear the cart when changing stores
          clearCart();
      }
      
      // Update the last store ID
      global.lastStoreId = store._id;
      
      // Use navigation to navigate to StoreMenuModal screen
      navigation.navigate('StoreMenuModal', { store });
  };

    const renderMap = () => {
        if (mapError) {
            return (
                <View style={styles.errorContainer}>
                    <FontAwesome name="map-o" size={60} color={theme.secondary} />
                    <Text style={styles.errorText}>Unable to load map</Text>
                    <TouchableOpacity 
                        style={styles.retryButton}
                        onPress={() => {
                            setMapError(false);
                            getCurrentLocation();
                            fetchStores();
                        }}
                    >
                        <Text style={styles.retryButtonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        if (isLoading) {
            return (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>Loading map...</Text>
                </View>
            );
        }

        return (
            <MapView
                style={styles.map}
                region={region}
                showsUserLocation={true}
                showsMyLocationButton={true}
            >
                {stores.map(store => {
                    const status = storeUtils.getStoreStatus(store.hours);
                    return (
                        <Marker
                            key={store._id}
                            coordinate={{
                                latitude: store.location.coordinates[1],
                                longitude: store.location.coordinates[0]
                            }}
                            pinColor={status.isOpen ? '#4CAF50' : '#FF5252'}
                            title={store.name}
                            description={status.isOpen ? 'Open' : 'Closed'}
                            onPress={() => handleStoreSelect(store)}
                        />
                    );
                })}
            </MapView>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Coffee Shop Map</Text>
                <TouchableOpacity 
                    style={styles.refreshButton}
                    onPress={() => {
                        getCurrentLocation();
                        fetchStores();
                    }}
                >
                    <FontAwesome name="refresh" size={20} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.container}>
                {renderMap()}
                
                <View style={styles.legendContainer}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
                        <Text style={styles.legendText}>Open</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, { backgroundColor: '#FF5252' }]} />
                        <Text style={styles.legendText}>Closed</Text>
                    </View>
                </View>
            </View>

            {/* Use the StoreMenuModal with modified props */}
            {selectedStore && (
                <StoreMenuModal
                    store={selectedStore}
                    navigation={navigation}
                    visible={showMenu}
                    onClose={() => {
                        setShowMenu(false);
                        setSelectedStore(null);
                    }}
                    fullScreen={true} // Add this new prop
                />
            )}
            
            <TouchableOpacity 
                style={styles.backButton}
                onPress={() => navigation.navigate('StoresTab')}
            >
                <FontAwesome name="arrow-left" size={20} color={theme.primary} />
                <Text style={styles.backButtonText}>Stores</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "white",
        paddingTop: StatusBar.currentHeight || 0
    },
    container: {
        flex: 1,
        backgroundColor: '#fff',
        position: 'relative',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.white,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.primary,
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    map: {
        flex: 1,
    },
    legendContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginHorizontal: 50,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 15,
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: theme.secondary,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
        padding: 20,
    },
    errorText: {
        color: theme.secondary,
        fontSize: 18,
        textAlign: 'center',
        marginTop: 12,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: theme.accent,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: theme.white,
        fontSize: 16,
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    loadingText: {
        color: theme.secondary,
        fontSize: 18,
    },
    backButton: {
        position: 'absolute',
        top: 80,
        left: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    backButtonText: {
        marginLeft: 6,
        fontSize: 16,
        color: theme.primary,
        fontWeight: '500',
    }
});