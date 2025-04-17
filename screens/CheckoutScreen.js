import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    ScrollView,
    ActivityIndicator,
    Image,
    Dimensions,
    Animated
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import BASE_URL from './config';
import { useCart } from './CartContext';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
// import LottieView from 'lottie-react-native';

const API_URL = `${BASE_URL}/api`;
const { width } = Dimensions.get('window');

export default function CheckoutScreen({ navigation, route }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const { cartItems, clearCart } = useCart();
    const { store } = route.params;
    const [userLocation, setUserLocation] = useState(null);
    const [region, setRegion] = useState(null);
    const [mapError, setMapError] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const animation = useRef(new Animated.Value(0)).current;
    const successAnimation = useRef(null);
    
    const total = cartItems.reduce((sum, item) => {
        const itemPrice = item.itemFinalPrice || item.price;
        const quantity = item.quantity || 1;
        return sum + (itemPrice * quantity);
    }, 0);

    useEffect(() => {
        // Get user location when component mounts
        getUserLocation();
        
        // Start entrance animation
        Animated.timing(animation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true
        }).start();
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
                    totalAmount: parseFloat(totalAmount.toFixed(2)),
                    paymentMethod
                })
            });

            const responseData = await response.json();

            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to create order');
            }
            
            // Show success animation
            setOrderComplete(true);
            
            // Wait for animation to complete before navigating
            setTimeout(() => {
                clearCart();
                navigation.navigate('MainApp', { screen: 'ActiveOrder' });
            }, 2500);
            
        } catch (error) {
            console.error('Order placement error:', error);
            Alert.alert('Error', error.message || 'Failed to place order');
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
                    <FontAwesome name="map-o" size={32} color={theme.secondary} />
                    <Text style={styles.mapErrorText}>Unable to load map</Text>
                </View>
            );
        }

        if (!region || !storeLocation) {
            return (
                <View style={[styles.mapContainer, styles.mapLoadingContainer]}>
                    <ActivityIndicator size="large" color={theme.accent} />
                    <Text style={styles.mapLoadingText}>Loading map...</Text>
                </View>
            );
        }

        return (
            <View style={styles.mapContainer}>
                <MapView 
                    style={styles.map}
                    region={region}
                >
                    {/* Store marker - use custom coffee marker */}
                    <Marker
                        coordinate={storeLocation}
                        title={store.name}
                        description={store.address}
                    >
                        <View style={styles.storeMarker}>
                            <FontAwesome name="coffee" size={18} color="white" />
                        </View>
                    </Marker>
                    
                    {/* User marker - use custom marker */}
                    {userLocation && (
                        <Marker
                            coordinate={userLocation}
                            title="Your Location"
                        >
                            <View style={styles.userMarker}>
                                <FontAwesome name="user" size={14} color="white" />
                            </View>
                        </Marker>
                    )}
                </MapView>
            </View>
        );
    };

    // Animation values
    const translateY = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 0]
    });
    const opacity = animation;

    // if (orderComplete) {
    //     return (
    //         <View style={styles.successContainer}>
    //             <LottieView
    //                 ref={successAnimation}
    //                 source={require('../assets/order-success.json')}
    //                 autoPlay
    //                 loop={false}
    //                 style={styles.successAnimation}
    //             />
    //             <Text style={styles.successTitle}>Order Placed!</Text>
    //             <Text style={styles.successMessage}>
    //                 Your order has been successfully placed. You can track its status in the Active Order screen.
    //             </Text>
    //         </View>
    //     );
    // }

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
                <Animated.View 
                    style={[
                        styles.detailsCard,
                        { 
                            opacity,
                            transform: [{ translateY }]
                        }
                    ]}
                >
                    <Text style={styles.sectionTitle}>Order Details</Text>
                    
                    <View style={styles.storeInfoContainer}>
                        <View style={styles.storeIconContainer}>
                            <FontAwesome name="coffee" size={24} color={theme.white} />
                        </View>
                        <View style={styles.storeTextContainer}>
                            <Text style={styles.storeName}>{store.name}</Text>
                            <Text style={styles.storeAddress}>{store.address}</Text>
                        </View>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.itemsContainer}>
                        <Text style={styles.itemsTitle}>Items ({cartItems.length})</Text>
                        {cartItems.map((item, index) => (
                            <View key={item.orderId} style={styles.itemRow}>
                                <View style={styles.itemQuantity}>
                                    <Text style={styles.quantityText}>{item.quantity}x</Text>
                                </View>
                                <Text style={styles.itemName} numberOfLines={1}>
                                    {item.name}
                                    {item.selectedSize && ` (${item.selectedSize})`}
                                </Text>
                                <Text style={styles.itemPrice}>
                                    {((item.itemFinalPrice || item.price) * (item.quantity || 1)).toFixed(2)} RSD
                                </Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>
                
                <Animated.View 
                    style={[
                        styles.mapCard,
                        { 
                            opacity,
                            transform: [{ translateY: Animated.multiply(translateY, 1.2) }]
                        }
                    ]}
                >
                    <Text style={styles.sectionTitle}>Location</Text>
                    {renderMap()}
                    
                    <View style={styles.locationLegend}>
                        <View style={styles.legendItem}>
                            <View style={styles.storeDot} />
                            <Text style={styles.legendText}>Coffee Shop</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={styles.userDot} />
                            <Text style={styles.legendText}>Your Location</Text>
                        </View>
                    </View>
                </Animated.View>
                
                <Animated.View 
                    style={[
                        styles.paymentCard,
                        { 
                            opacity,
                            transform: [{ translateY: Animated.multiply(translateY, 1.4) }]
                        }
                    ]}
                >
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    
                    <View style={styles.paymentOptions}>
                        <TouchableOpacity 
                            style={[
                                styles.paymentOption,
                                paymentMethod === 'cash' && styles.selectedPaymentOption
                            ]}
                            onPress={() => setPaymentMethod('cash')}
                        >
                            <View style={styles.paymentIconContainer}>
                                <FontAwesome 
                                    name="money" 
                                    size={24} 
                                    color={paymentMethod === 'cash' ? theme.white : theme.accent} 
                                />
                            </View>
                            <Text style={[
                                styles.paymentText,
                                paymentMethod === 'cash' && styles.selectedPaymentText
                            ]}>
                                Cash
                            </Text>
                            {paymentMethod === 'cash' && (
                                <View style={styles.selectedIndicator}>
                                    <FontAwesome name="check" size={14} color={theme.white} />
                                </View>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[
                                styles.paymentOption,
                                styles.disabledPaymentOption
                            ]}
                            disabled={true}
                        >
                            <View style={[styles.paymentIconContainer, styles.disabledPaymentIcon]}>
                                <FontAwesome name="credit-card" size={24} color={theme.border} />
                            </View>
                            <Text style={styles.disabledPaymentText}>
                                Card (Coming Soon)
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
                
                <Animated.View 
                    style={[
                        styles.summaryCard,
                        { 
                            opacity,
                            transform: [{ translateY: Animated.multiply(translateY, 1.6) }]
                        }
                    ]}
                >
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Subtotal</Text>
                        <Text style={styles.summaryValue}>{total.toFixed(2)} RSD</Text>
                    </View>
                    
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Service Fee</Text>
                        <Text style={styles.summaryValue}>0.00 RSD</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={styles.totalValue}>{total.toFixed(2)} RSD</Text>
                    </View>
                </Animated.View>
                
                <View style={styles.spacer} />
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
                    {isSubmitting ? (
                        <View style={styles.loadingButton}>
                            <ActivityIndicator size="small" color={theme.white} />
                            <Text style={styles.checkoutText}>PROCESSING...</Text>
                        </View>
                    ) : (
                        <Text style={styles.checkoutText}>PLACE ORDER</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    disabledPaymentIcon: {
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    paymentText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.primary,
        marginTop: 8,
    },
    selectedPaymentText: {
        color: theme.accent,
        fontWeight: '600',
    },
    disabledPaymentText: {
        fontSize: 16,
        color: theme.secondary,
        marginTop: 8,
    },
    selectedIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: theme.accent,
        justifyContent: 'center',
        alignItems: 'center',
    },
    summaryCard: {
        backgroundColor: theme.white,
        borderRadius: 16,
        padding: 20,
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
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryLabel: {
        fontSize: 16,
        color: theme.secondary,
    },
    summaryValue: {
        fontSize: 16,
        color: theme.primary,
        fontWeight: '500',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.primary,
    },
    totalValue: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.accent,
    },
    spacer: {
        height: 100,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
        backgroundColor: theme.white,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0, 0, 0, 0.05)',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 8,
    },
    checkoutButton: {
        backgroundColor: theme.accent,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: theme.accent,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    checkoutText: {
        color: theme.white,
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 1,
    },
    loadingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.6,
    },
    successContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.white,
        padding: 24,
    },
    successAnimation: {
        width: 200,
        height: 200,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.accent,
        marginTop: 24,
        marginBottom: 16,
    },
    successMessage: {
        fontSize: 16,
        color: theme.secondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    storeMarker: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: theme.accent,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 4,
    },
    userMarker: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#4285F4',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: theme.white,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 4,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 44 : 16,
        height: Platform.OS === 'ios' ? 88 : 56,
        backgroundColor: theme.white,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
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
        flex: 1,
        textAlign: 'center',
        marginRight: 40, // To center the title accounting for back button width
    },
    content: {
        flex: 1,
        padding: 16,
    },
    detailsCard: {
        backgroundColor: theme.white,
        borderRadius: 16,
        padding: 20,
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.primary,
        marginBottom: 16,
    },
    storeInfoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    storeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: theme.accent,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    storeTextContainer: {
        flex: 1,
    },
    storeName: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.primary,
        marginBottom: 4,
    },
    storeAddress: {
        fontSize: 14,
        color: theme.secondary,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        marginVertical: 16,
    },
    itemsContainer: {
        marginBottom: 8,
    },
    itemsTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.primary,
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    itemQuantity: {
        width: 30,
        marginRight: 8,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.secondary,
    },
    itemName: {
        flex: 1,
        fontSize: 16,
        color: theme.primary,
        marginRight: 8,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.accent,
    },
    mapCard: {
        backgroundColor: theme.white,
        borderRadius: 16,
        padding: 20,
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
    mapContainer: {
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
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
        marginTop: 8,
    },
    mapLoadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f8f8',
    },
    mapLoadingText: {
        color: theme.secondary,
        fontSize: 16,
        marginTop: 8,
    },
    locationLegend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 8,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 12,
    },
    storeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: theme.accent,
        marginRight: 8,
    },
    userDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4285F4',
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: theme.secondary,
    },
    paymentCard: {
        backgroundColor: theme.white,
        borderRadius: 16,
        padding: 20,
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
    paymentOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    paymentOption: {
        flex: 1,
        borderWidth: 1,
        borderColor: theme.border,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 6,
        alignItems: 'center',
        position: 'relative',
    },
    selectedPaymentOption: {
        borderColor: theme.accent,
        backgroundColor: 'rgba(139, 69, 19, 0.05)',
    },
    disabledPaymentOption: {
        opacity: 0.6,
    },
    paymentIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(139, 69, 19, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    successFallback: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(139, 69, 19, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
      },
      
      paymentIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(139, 69, 19, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
      }
    });
