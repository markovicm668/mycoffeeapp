import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Platform,
    ScrollView,
    FlatList,
    Image,
    Animated,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import { useCart } from './CartContext';
import { useFocusEffect } from '@react-navigation/native';

export default function OrderSummaryScreen({ navigation, route }) {
    const { store } = route.params;
    const { cartItems, removeFromCart, clearCart, updateCartItemQuantity } = useCart();
    const [fadeAnims] = useState(() => cartItems.map(() => new Animated.Value(1)));
    const [showEmptyCartConfirm, setShowEmptyCartConfirm] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            // Animation reset on screen focus
            fadeAnims.forEach(anim => anim.setValue(1));
        }, [fadeAnims])
    );

    const getPlaceholderImage = (name) => {
        const coffeeImages = {
            'Americano': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085',
            'Espresso': 'https://images.unsplash.com/photo-1510707577719-ae7f8f3b3497',
            'Latte': 'https://images.unsplash.com/photo-1570968915860-54d5c301fa93',
            'Cappuccino': 'https://images.unsplash.com/photo-1534778101976-62847782c213',
            'default': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93'
        };
        return coffeeImages[name] || coffeeImages.default;
    };

    const updateQuantity = (item, index, newQuantity) => {
        if (newQuantity === 0) {
            // Animate the item out before removing
            Animated.timing(fadeAnims[index], {
                toValue: 0,
                duration: 300,
                useNativeDriver: true
            }).start(() => {
                removeFromCart(item.orderId);
                if (cartItems.length === 1) {
                    navigation.goBack();
                }
            });
        } else {
            updateCartItemQuantity(item.orderId, newQuantity);
        }
    };

    const proceedToCheckout = () => {
        if (!cartItems || cartItems.length === 0) {
            Alert.alert('Empty Cart', 'Please add items to your order');
            return;
        }

        if (!store || !store._id) {
            Alert.alert('Error', 'Invalid store selected');
            return;
        }

        navigation.navigate('Checkout', { store });
    };

    const confirmClearCart = () => {
        setShowEmptyCartConfirm(true);
    };

    const handleClearCart = () => {
        clearCart();
        setShowEmptyCartConfirm(false);
        navigation.goBack();
    };

    const total = cartItems.reduce((sum, item) => {
        const itemPrice = item.itemFinalPrice || item.price;
        const quantity = item.quantity || 1;
        return sum + (itemPrice * quantity);
    }, 0);

    // Group cart items by category for better organization
    const groupedItems = cartItems.reduce((groups, item) => {
        const category = item.category || 'Other';
        if (!groups[category]) {
            groups[category] = [];
        }
        groups[category].push(item);
        return groups;
    }, {});

    // Convert grouped items to array for rendering
    const categorySections = Object.keys(groupedItems).map(category => ({
        title: category,
        data: groupedItems[category]
    }));

    const renderEmptyCart = () => (
        <View style={styles.emptyCartContainer}>
            <FontAwesome name="shopping-basket" size={64} color={theme.border} />
            <Text style={styles.emptyCartText}>Your cart is empty</Text>
            <TouchableOpacity
                style={styles.browseButton}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.browseButtonText}>Browse Menu</Text>
            </TouchableOpacity>
        </View>
    );

    // OrderSummaryScreen.js -> renderItem function

    const renderItem = ({ item, index }) => (
        <Animated.View
            style={[
                styles.itemContainer,
                { opacity: fadeAnims && fadeAnims[index] ? fadeAnims[index] : 1 }
            ]}
        >
            <View style={styles.itemImageContainer}>
                <Image
                    source={{ uri: item.imageUrl || getPlaceholderImage(item.name) }}
                    style={styles.itemImage}
                />
            </View>
            <View style={styles.itemDetails}>
                <View style={styles.itemHeader}>
                    {/* Keep numberOfLines for safety, but use original style name */}
                    <Text style={styles.itemName} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
                    <TouchableOpacity
                        style={styles.removeButton} // Use updated removeButton style if needed
                        onPress={() => updateQuantity(item, index, 0)}
                    >
                        <FontAwesome name="trash" size={16} color={theme.error} />
                    </TouchableOpacity>
                </View>

                {/* REVERT to original customization styles */}
                 {item.selectedSize && (
                     <View style={styles.customizationTag}>
                        <Text style={styles.customizationText}>Size: {item.selectedSize}</Text>
                     </View>
                 )}
                 {item.selectedExtras?.length > 0 && (
                     <View style={styles.customizationTag}>
                        <Text style={styles.customizationText} numberOfLines={1} ellipsizeMode="tail">
                             Extras: {item.selectedExtras.join(', ')}
                        </Text>
                     </View>
                 )}
                 {item.specialInstructions && (
                    <View style={styles.specialInstructionsTag}>
                         <FontAwesome name="comment" size={12} color={theme.accent} style={styles.noteIcon} />
                         <Text style={styles.specialInstructionsText} numberOfLines={1} ellipsizeMode="tail">
                             {item.specialInstructions}
                         </Text>
                    </View>
                 )}


                <View style={styles.itemFooter}>
                     <View style={styles.quantityControls}>
                         {/* Use original quantity styles if needed */}
                         <TouchableOpacity
                             style={styles.quantityButton}
                             onPress={() => updateQuantity(item, index, Math.max(0, (item.quantity || 1) - 1))}
                         >
                             <Text style={styles.quantityButtonText}>-</Text>
                         </TouchableOpacity>
                         <Text style={styles.quantityText}>{item.quantity || 1}</Text>
                         <TouchableOpacity
                             style={styles.quantityButton}
                             onPress={() => updateQuantity(item, index, (item.quantity || 1) + 1)}
                         >
                             <Text style={styles.quantityButtonText}>+</Text>
                         </TouchableOpacity>
                     </View>
                    <Text style={styles.itemPrice}>
                        {((item.itemFinalPrice || item.price) * (item.quantity || 1)).toFixed(2)} RSD
                    </Text>
                </View>
            </View>
        </Animated.View>
    );

    const renderSectionHeader = ({ section }) => (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <FontAwesome name="arrow-left" size={20} color={theme.primary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Your Order</Text>
                {cartItems.length > 0 && (
                    <TouchableOpacity
                        style={styles.clearCartButton}
                        onPress={confirmClearCart}
                    >
                        <FontAwesome name="trash" size={18} color={theme.error} />
                    </TouchableOpacity>
                )}
            </View>

            {cartItems.length === 0 ? (
                renderEmptyCart()
            ) : (
                <View style={{ flex: 1 }}>
                    <View style={styles.storeInfo}>
                        <FontAwesome name="coffee" size={18} color={theme.accent} style={styles.storeIcon} />
                        <Text style={styles.storeName}>{store.name}</Text>
                    </View>

                    <FlatList
                        data={cartItems}
                        renderItem={renderItem}
                        keyExtractor={(item) => item.orderId}
                        contentContainerStyle={styles.listContent}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
            )}

            {cartItems.length > 0 && (
                <View style={styles.footer}>
                    <View style={styles.footerContent}>
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalText}>Total</Text>
                            <Text style={styles.totalAmount}>{total.toFixed(2)} RSD</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.checkoutButton}
                            onPress={proceedToCheckout}
                        >
                            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
                            <FontAwesome name="arrow-right" size={18} color={theme.white} style={styles.checkoutIcon} />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Confirmation modal */}
            {showEmptyCartConfirm && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Clear Cart?</Text>
                        <Text style={styles.modalMessage}>
                            Are you sure you want to remove all items from your cart?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setShowEmptyCartConfirm(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleClearCart}
                            >
                                <Text style={styles.confirmButtonText}>Clear Cart</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 44 : 16,
        paddingBottom: 16,
        backgroundColor: theme.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.border,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.primary,
        flex: 1,
        textAlign: 'center',
    },
    clearCartButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    storeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.white,
        marginBottom: 8,
    },
    storeIcon: {
        marginRight: 8,
    },
    storeName: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.primary,
    },
    listContent: {
        padding: 16,
        paddingBottom: 120, // Extra padding for footer
    },
    sectionHeader: {
        backgroundColor: '#F8F8F8',
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.primary,
    },
    itemImageContainer: {
        width: 110, // Keep the fixed width
        height: 115,
        backgroundColor: '#eee' // Keep background for loading state
    },
    // --- Other styles remain the same ---
    itemImage: { // No changes needed here, height: '100%' will now work as intended
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    itemContainer: { // Ensure alignItems is not 'center' or 'flex-start' (default 'stretch' is good)
        backgroundColor: theme.white,
        borderRadius: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        flexDirection: 'row',
        overflow: 'hidden',
        // alignItems: 'stretch', // Default - explicitly setting is optional
    },
    itemDetails: {
        flex: 1,
        padding: 16, // INCREASED padding (matches StoreMenuModal)
        justifyContent: 'space-around', // Adjust justification if needed
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 6, // Adjusted margin
    },
    itemName: {
        fontSize: 18, // INCREASED font size (matches StoreMenuModal)
        fontWeight: '600',
        color: theme.primary,
        flex: 1,
        marginRight: 8,
    },
     removeButton: { // Revert/adjust size if needed
         width: 32,
         height: 32,
         borderRadius: 16,
         backgroundColor: 'rgba(255, 59, 48, 0.1)',
         justifyContent: 'center',
         alignItems: 'center',
         // marginLeft: 8, // Keep if needed
     },
    // customizationTag: {
    //     backgroundColor: '#F0F0F0',
    //     paddingHorizontal: 10,
    //     paddingVertical: 4,
    //     borderRadius: 12,
    //     marginBottom: 6,
    //     alignSelf: 'flex-start',
    // },
    // customizationText: {
    //     fontSize: 14,
    //     color: theme.secondary,
    // },
    // specialInstructionsTag: {
    //     flexDirection: 'row',
    //     alignItems: 'center',
    //     backgroundColor: 'rgba(139, 69, 19, 0.1)',
    //     paddingHorizontal: 10,
    //     paddingVertical: 4,
    //     borderRadius: 12,
    //     marginTop: 4,
    //     marginBottom: 12,
    //     alignSelf: 'flex-start',
    // },
    // noteIcon: {
    //     marginRight: 6,
    // },
    // specialInstructionsText: {
    //     fontSize: 14,
    //     color: theme.accent,
    //     fontStyle: 'italic',
    // },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 20,
        padding: 4,
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    quantityButtonText: {
        fontSize: 16,
        color: theme.accent,
        fontWeight: '600',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.primary,
        paddingHorizontal: 12,
    },
    itemPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: theme.accent,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
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
    footerContent: {
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    totalText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.primary,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: theme.accent,
    },
    checkoutButton: {
        backgroundColor: theme.accent,
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        flexDirection: 'row',
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
    checkoutButtonText: {
        color: theme.white,
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    checkoutIcon: {
        marginLeft: 4,
    },
    emptyCartContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyCartText: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.secondary,
        marginTop: 16,
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: theme.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    browseButtonText: {
        color: theme.white,
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: theme.white,
        borderRadius: 16,
        padding: 24,
        width: '80%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.primary,
        marginBottom: 12,
        textAlign: 'center',
    },
    modalMessage: {
        fontSize: 16,
        color: theme.secondary,
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 22,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F0F0F0',
        marginRight: 8,
    },
    confirmButton: {
        backgroundColor: theme.error,
        marginLeft: 8,
    },
    cancelButtonText: {
        color: theme.secondary,
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButtonText: {
        color: theme.white,
        fontSize: 16,
        fontWeight: '600',
    },
    // Append these to the styles object
    emptyCartContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyCartText: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.secondary,
        marginTop: 16,
        marginBottom: 24,
    },
    browseButton: {
        backgroundColor: theme.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
    },
    browseButtonText: {
        color: theme.white,
        fontSize: 16,
        fontWeight: '600',
    },


    

    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8, // Adjusted margin
    },
    quantityControls: { // Revert/adjust size if needed
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8F8F8',
        borderRadius: 20,
        padding: 2,
    },
    quantityButton: { // Revert/adjust size if needed
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: theme.white,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border,
    },
    quantityButtonText: { // Revert/adjust size if needed
        fontSize: 16,
        color: theme.accent,
        fontWeight: '600',
    },
    quantityText: { // Revert/adjust size if needed
        fontSize: 16,
        fontWeight: '600',
        color: theme.primary,
        paddingHorizontal: 12,
        minWidth: 24, // Ensure minimum width
        textAlign: 'center',
    },
    itemPrice: {
        fontSize: 18, // INCREASED font size
        fontWeight: '700',
        color: theme.accent,
        marginLeft: 8, // Keep margin if needed
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 8,
        // Keep paddingBottom large enough for footer
        paddingBottom: 150,
    },
});