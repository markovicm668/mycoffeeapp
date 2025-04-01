import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import { useCart } from './CartContext';

export default function CustomizationModal({
  visible,
  item,
  onClose,
}) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (item) {
      setSelectedSize(item.sizes?.[0]?.name || '');
      setSelectedExtras([]);
      setSpecialInstructions('');
      setQuantity(1);
    }

    // Add keyboard listeners
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardShown(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardShown(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [item]);

  const calculateItemPrice = () => {
    if (!item) return 0;

    let itemPrice = item.price;

    // Add size price modifier
    const sizeOption = item.sizes?.find(s => s.name === selectedSize);
    if (sizeOption) {
      itemPrice += sizeOption.priceModifier;
    }

    // Add extras
    selectedExtras.forEach(extraName => {
      const extraOption = item.extras?.find(e => e.name === extraName);
      if (extraOption) {
        itemPrice += extraOption.price;
      }
    });

    return itemPrice;
  };

  const calculateTotalPrice = () => {
    return calculateItemPrice() * quantity;
  };

  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={[
          styles.content,
          keyboardShown && styles.keyboardOpen
        ]}>
          <View style={styles.header}>
            <Text style={styles.title}>{item.name}</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <FontAwesome name="close" size={24} color={theme.secondary} />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {item.sizes && item.sizes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Size</Text>
                <View style={styles.optionsContainer}>
                  {item.sizes.map((size) => (
                    <TouchableOpacity
                      key={size.name}
                      style={[
                        styles.optionButton,
                        selectedSize === size.name && styles.selectedOption
                      ]}
                      onPress={() => setSelectedSize(size.name)}
                    >
                      <Text style={[
                        styles.optionText,
                        selectedSize === size.name && styles.selectedOptionText
                      ]}>
                        {size.name}
                        {size.priceModifier > 0 && ` (+${size.priceModifier} RSD)`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Extras Selection */}
            {item.extras && item.extras.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Extras</Text>
                <View style={styles.optionsContainer}>
                  {item.extras.map((extra) => (
                    <TouchableOpacity
                      key={extra.name}
                      style={[
                        styles.optionButton,
                        selectedExtras.includes(extra.name) && styles.selectedOption
                      ]}
                      onPress={() => {
                        setSelectedExtras(prev =>
                          prev.includes(extra.name)
                            ? prev.filter(e => e !== extra.name)
                            : [...prev, extra.name]
                        );
                      }}
                    >
                      <Text style={[
                        styles.optionText,
                        selectedExtras.includes(extra.name) && styles.selectedOptionText
                      ]}>
                        {extra.name} (+{extra.price} RSD)
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Special Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Special Instructions</Text>
              <TextInput
                style={styles.instructionsInput}
                placeholder="Any special requests?"
                value={specialInstructions}
                onChangeText={setSpecialInstructions}
                multiline
                maxLength={200}
              />
            </View>

            {/* Quantity */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Quantity</Text>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Text style={styles.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.quantity}>{quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => setQuantity(quantity + 1)}
                >
                  <Text style={styles.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Total Price */}
            <View style={styles.totalContainer}>
              <Text style={styles.totalText}>Total:</Text>
              <Text style={styles.totalPrice}>
                {calculateItemPrice() * quantity} RSD
              </Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              const customizedItem = {
                ...item,
                selectedSize,
                selectedExtras,
                specialInstructions,
                quantity,
                itemFinalPrice: calculateItemPrice(),
                finalPrice: calculateTotalPrice(),
                orderId: Date.now().toString() // More reliable unique ID
              };

              addToCart(customizedItem);
              onClose();
            }}
          >
            <Text style={styles.addButtonText}>Add to Order</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  keyboardOpen: {
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
    letterSpacing: 0.25,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 16,
    letterSpacing: 0.25,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedOption: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
    shadowColor: theme.accent,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  optionText: {
    color: theme.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: theme.white,
    fontWeight: '600',
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 16,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: 'top',
    backgroundColor: '#FAFAFA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 16,
  },
  quantityButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  quantityButtonText: {
    fontSize: 24,
    color: theme.accent,
    fontWeight: '600',
  },
  quantity: {
    fontSize: 24,
    color: theme.primary,
    minWidth: 48,
    textAlign: 'center',
    fontWeight: '600',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
    marginHorizontal: -24,
    paddingHorizontal: 24,
    backgroundColor: theme.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 4,
  },
  totalText: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primary,
    letterSpacing: 0.25,
  },
  totalPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.accent,
    letterSpacing: 0.5,
  },
  addButton: {
    backgroundColor: theme.accent,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: theme.accent,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  addButtonText: {
    color: theme.white,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});