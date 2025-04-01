import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    ScrollView,
    Dimensions
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import BASE_URL from './config';
import { useCart } from './CartContext';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const API_URL = `${BASE_URL}/api`;
const { width } = Dimensions.get('window');

export default function CheckoutScreen({ navigation, route }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { cartItems, clearCart } = useCart();
    const { store } = route.params;
    const [userLocation, setUserLocation] = useState(null);
    const [region, setRegion] = useState(null);
    const [mapError, setMapError] = useState(false);
    
    const total = cartItems.reduce((sum, item) => {
        const itemPrice = item.itemFinalPrice || item.price;
        const quantity = item.quantity || 1;
        return sum + (itemPrice * quantity);
    }, 0);

    useEffect(() => {
        // Get user location when component mounts
        getUserLocation();
    }, []);

    const getUserLocation = async () => {
        try {
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setMapError(true);
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

            // Set map region to include both user and store
            if (store?.location?.coordinates) {
                const storeLocation = {
                    latitude: store.location.coordinates[1],
                    longitude: store.location.coordinates[0]
                };
                
                // Calculate region that includes both points
                const minLat = Math.min(location.coords.latitude, storeLocation.latitude);
                const maxLat = Math.max(location.coords.latitude, storeLocation.latitude);
                const minLng = Math.min(location.coords.longitude, storeLocation.longitude);
                const maxLng = Math.max(location.coords.longitude, storeLocation.longitude);
                
                // Add some padding
                const latDelta = (maxLat - minLat) * 1.5 + 0.01;
                const lngDelta = (maxLng - minLng) * 1.5 + 0.01;
                
                setRegion({
                    latitude: (minLat + maxLat) / 2,
                    longitude: (minLng + maxLng) / 2,
                    latitudeDelta: Math.max(latDelta, 0.02),
                    longitudeDelta: Math.max(lngDelta, 0.02)
                });
            }
        } catch (error) {
            console.error('Error getting location:', error);
            setMapError(true);
        }
    };

    const handleCheckout = async () => {
        try {
            if (!cartItems || cartItems.length === 0) {
                Alert.alert('Error', 'Please add items to your order');
                return;
            }

            if (!store || !store._id) {
                Alert.alert('Error', 'Invalid store selected');
                return;
            }

            setIsSubmitting(true);

            const formattedItems = cartItems.map(item => ({
                menuItemId: item._id,
                name: item.name,
                price: item.itemFinalPrice || item.price,
                quantity: item.quantity || 1,
                size: item.selectedSize || undefined,
                extras: item.selectedExtras || [],
                specialInstructions: item.specialInstructions || undefined
            }));

            const totalAmount = formattedItems.reduce((sum, item) =>
                sum + (item.price * item.quantity), 0
            );

            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${global.userToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    items: formattedItems,
                    store: store._id,
                    totalAmount: parseFloat(totalAmount.toFixed(2))
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to create order');
            }
            
            clearCart();
            navigation.navigate('MainApp', { screen: 'ActiveOrder' });
        } catch (error) {
            console.error('Order placement error:', error);
            Alert.alert('Error', error.message || 'Failed to place order');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const storeLocation = store?.location?.coordinates 
        ? {
            latitude: store.location.coordinates[1],
            longitude: store.location.coordinates[0]
          }
        : null;

    const renderMap = () => {
        if (mapError) {
            return (
                <View style={[styles.mapContainer, styles.mapErrorContainer]}>
                    <Text style={styles.mapErrorText}>Unable to load map</Text>
                </View>
            );
        }

        if (!region || !storeLocation) {
            return (
                <View style={[styles.mapContainer, styles.mapLoadingContainer]}>
                    <Text style={styles.mapLoadingText}>Loading map...</Text>
                </View>
            );
        }

        return (
            <View style={styles.mapContainer}>
                <MapView 
                    style={styles.map}
                    region={region}
                    // Remove the Google provider
                >
                    {/* Store marker - use standard marker with a different color */}
                    <Marker
                        coordinate={storeLocation}
                        title={store.name}
                        description={store.address}
                        pinColor="#8B4513" // Coffee brown color
                    />
                    
                    {/* User marker - use standard marker with a different color */}
                    {userLocation && (
                        <Marker
                            coordinate={userLocation}
                            title="Your Location"
                            pinColor="#4285F4" // Blue
                        />
                    )}
                </MapView>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <FontAwesome name="angle-left" size={24} color={theme.primary} />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
            </View>

            <ScrollView style={styles.content}>
                <Text style={styles.shopName}>{store.name}</Text>
                <Text style={styles.shopAddress}>{store.address}</Text>
                
                {renderMap()}
                
                <View style={styles.locationLegend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, {backgroundColor: '#8B4513'}]} />
                        <Text style={styles.legendText}>Coffee Shop</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendDot, {backgroundColor: '#4285F4'}]} />
                        <Text style={styles.legendText}>Your Location</Text>
                    </View>
                </View>
                
                <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Total:</Text>
                    <Text style={styles.totalAmount}>{total.toFixed(2)} RSD</Text>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={handleCheckout}
                    disabled={isSubmitting || cartItems.length === 0}
                    style={[
                        styles.checkoutButton,
                        (isSubmitting || cartItems.length === 0) && styles.disabledButton
                    ]}
                >
                    <Text style={styles.checkoutText}>
                        {isSubmitting ? 'PLACING ORDER...' : 'PLACE ORDER'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 44 : 16,
        height: Platform.OS === 'ios' ? 88 : 56,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    backButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backText: {
        fontSize: 17,
        color: theme.primary,
        marginLeft: 4,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.primary,
        marginLeft: 32,
    },
    content: {
        flex: 1,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.primary,
        marginBottom: 8,
    },
    shopName: {
        fontSize: 20,
        fontWeight: '700',
        color: theme.primary,
        marginBottom: 4,
    },
    shopAddress: {
        fontSize: 16,
        color: theme.secondary,
        marginBottom: 16,
    },
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 8,
        marginTop: 8,
        borderWidth: 1,
        borderColor: theme.border,
    },
    map: {
        width: '100%',
        height: '100%',
    },
    mapErrorContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    mapErrorText: {
        color: theme.secondary,
        fontSize: 16,
    },
    mapLoadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    mapLoadingText: {
        color: theme.secondary,
        fontSize: 16,
    },
    locationLegend: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 1,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
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
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    totalText: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.primary,
    },
    totalAmount: {
        fontSize: 28,
        fontWeight: '700',
        color: theme.accent,
    },
    footer: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
        backgroundColor: theme.white,
    },
    checkoutButton: {
        backgroundColor: theme.accent,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    checkoutText: {
        color: theme.white,
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    disabledButton: {
        opacity: 0.6,
    },
});