import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import BASE_URL from './config';
import { useCart } from './CartContext';

const API_URL = `${BASE_URL}/api`;

export default function OrderSummaryScreen({ navigation, route }) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { store } = route.params;
    const { cartItems, removeFromCart, clearCart, updateCartItemQuantity } = useCart();

    const updateQuantity = (item, newQuantity) => {
        if (newQuantity === 0) {
            Alert.alert(
                "Remove Item",
                "Are you sure you want to remove this item from your order?",
                [
                    {
                        text: "Cancel",
                        style: "cancel"
                    },
                    {
                        text: "Remove",
                        onPress: () => {
                            removeFromCart(item.orderId);
                            if (cartItems.length === 1) {
                                navigation.goBack();
                            }
                        },
                        style: "destructive"
                    }
                ]
            );
        } else {
            updateCartItemQuantity(item.orderId, newQuantity);
        }
    };

    const proceedToCheckout = () => {
        if (!cartItems || cartItems.length === 0) {
            Alert.alert('Error', 'Please add items to your order');
            return;
        }

        if (!store || !store._id) {
            Alert.alert('Error', 'Invalid store selected');
            return;
        }

        navigation.navigate('Checkout', { store });
    };

    const placeOrder = async () => {
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

    const total = cartItems.reduce((sum, item) => {
        const itemPrice = item.itemFinalPrice || item.price;
        const quantity = item.quantity || 1;
        return sum + (itemPrice * quantity);
    }, 0);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <FontAwesome name="angle-left" size={24} color={theme.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Cart</Text>
            </View>

            <ScrollView style={styles.content}>
                {cartItems.map((item) => {
                    const customizationKey = `${item._id}-${item.selectedSize || 'nosize'}-${(item.selectedExtras || []).sort().join('-')}-${item.orderId}`;
                    return (
                        <View
                            key={customizationKey}
                            style={[styles.summaryItem]}
                        >
                            <View style={styles.summaryItemContent}>
                                <View style={styles.leftSection}>
                                    <View style={styles.quantityControls}>
                                        <TouchableOpacity
                                            style={styles.quantityButton}
                                            onPress={() => updateQuantity(item, Math.max(0, (item.quantity || 1) - 1))}
                                        >
                                            <Text style={styles.quantityButtonText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.quantityText}>{item.quantity || 1}</Text>
                                        <TouchableOpacity
                                            style={styles.quantityButton}
                                            onPress={() => updateQuantity(item, (item.quantity || 1) + 1)}
                                        >
                                            <Text style={styles.quantityButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={styles.itemDetails}>
                                    <Text style={styles.summaryItemName}>{item.name}</Text>
                                    {item.selectedSize && (
                                        <Text style={styles.itemCustomization}>{item.selectedSize}</Text>
                                    )}
                                    {item.selectedExtras?.map((extra, index) => (
                                        <Text key={index} style={styles.itemCustomization}>
                                            {extra}
                                        </Text>
                                    ))}
                                    {item.specialInstructions && (
                                        <Text style={styles.itemCustomization}>
                                            Note: {item.specialInstructions}
                                        </Text>
                                    )}
                                    <Text style={styles.summaryItemPrice}>
                                        {((item.itemFinalPrice || item.price) * (item.quantity || 1)).toFixed(2)} RSD
                                    </Text>
                                </View>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity
                    onPress={proceedToCheckout}
                    disabled={cartItems.length === 0}
                    style={[
                        styles.placeOrderButton,
                        cartItems.length === 0 && styles.disabledButton
                    ]}
                >
                    <View style={styles.orderButtonContent}>
                        <Text style={styles.orderButtonText}>
                            Go to checkout
                        </Text>
                        <Text style={styles.orderButtonPrice}>
                            {total.toFixed(2)} RSD
                        </Text>
                    </View>
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
        borderBottomWidth: 0,
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
    summaryItem: {
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    summaryItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    leftSection: {
        marginRight: 16,
    },
    itemDetails: {
        flex: 1,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    quantityButton: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.accent,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
    quantityButtonText: {
        fontSize: 18,
        color: theme.white,
        fontWeight: '600',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.primary,
        minWidth: 24,
        textAlign: 'center',
    },
    summaryItemName: {
        fontSize: 16,
        color: theme.primary,
        fontWeight: '600',
        marginBottom: 4,
    },
    itemCustomization: {
        fontSize: 14,
        color: theme.secondary,
        marginBottom: 2,
    },
    summaryItemPrice: {
        fontSize: 16,
        color: theme.accent,
        fontWeight: '600',
        marginTop: 4,
    },
    summaryItemQuantity: {
        fontSize: 15,
        color: theme.secondary,
        marginHorizontal: 8,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 0,
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
        borderTopWidth: 0,
        borderTopColor: 'rgba(0, 0, 0, 0.1)',
        backgroundColor: theme.white,
    },
    placeOrderButton: {
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
    placeOrderText: {
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
    summaryItemTouchable: {
        position: 'relative',
        overflow: 'hidden',
    },
    removeHint: {
        fontSize: 12,
        color: theme.error,
        marginTop: 8,
        textAlign: 'right',
        fontStyle: 'italic',
    },
    orderButtonContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      },
      orderButtonText: {
        color: theme.white,
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 1,
      },
      orderButtonPrice: {
        color: theme.white,
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1,
      },
});