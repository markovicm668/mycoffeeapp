import React, { useState, useEffect, useRef, createRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  SectionList
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import CustomizationModal from './CustomizationModal';
import BASE_URL from './config';
import * as storeUtils from './storeUtils';
import { getStoreImages } from './storeImageUtils';
import { useCart } from './CartContext';
import * as Location from 'expo-location';

const API_URL = `${BASE_URL}/api`;
const { width: screenWidth } = Dimensions.get('window');

export default function StoreMenuModal({ navigation, route }) {
  const store = route.params?.store;
  const [menuItems, setMenuItems] = useState([]);
  const [menuSections, setMenuSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCustomization, setShowCustomization] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [storeStatus, setStoreStatus] = useState({ isOpen: false, text: '', nextOpeningTime: null });
  const { cartItems, addToCart } = useCart();
  const [activeIndex, setActiveIndex] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const scrollPosition = useRef(new Animated.Value(0)).current;
  const sectionListRef = useRef(null);

  useEffect(() => {
    if (store) {
      fetchMenuItems();
      const status = getStoreStatus(store);
      setStoreStatus(status);
    }
  }, [store]);

  useEffect(() => {
    if (menuItems.length > 0) {
      // Group menu items by category and create sections
      const categoriesMap = {};
      menuItems.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!categoriesMap[category]) {
          categoriesMap[category] = [];
        }
        categoriesMap[category].push(item);
      });

      // Convert to sections array format
      const sections = Object.keys(categoriesMap).map(category => {
        // Sort items within each category by position
        const sortedItems = categoriesMap[category].sort((a, b) => {
          // First sort by position if available
          if (a.position !== undefined && b.position !== undefined) {
            return a.position - b.position;
          }
          // Fall back to name sorting
          return a.name.localeCompare(b.name);
        });

        return {
          title: category.charAt(0).toUpperCase() + category.slice(1),
          data: sortedItems,
          key: category,
          // Store position for sorting categories (get from first item)
          position: sortedItems[0]?.position !== undefined
            ? sortedItems[0].position
            : 9999
        };
      });

      // Sort sections by position instead of alphabetically
      sections.sort((a, b) => {
        // Get category positions from the actual category objects
        const posA = a.position !== undefined ? a.position : 9999;
        const posB = b.position !== undefined ? b.position : 9999;
        return posA - posB;
      });

      setMenuSections(sections);
      setCategories(sections.map(section => section.key));

      // Set the first category as selected by default
      if (sections.length > 0 && !selectedCategory) {
        setSelectedCategory(sections[0].key);
      }
    }
  }, [menuItems]);

  useEffect(() => {
    const getUserLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;

        const location = await Location.getCurrentPositionAsync({});
        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getUserLocation();
  }, []);

  const getStoreStatus = (store) => {
    if (!store || !store.hours) {
      return {
        isOpen: false,
        text: 'Hours not available',
        nextOpeningTime: null
      };
    }

    const status = storeUtils.getStoreStatus(store.hours);
    return {
      isOpen: status.isOpen,
      text: status.message,
      nextOpeningTime: status.nextOpening,
      hours: status.hours
    };
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);

    // Find the section index
    const sectionIndex = menuSections.findIndex(section => section.key === category);

    if (sectionIndex !== -1 && sectionListRef.current) {
      // Add a small delay to ensure the UI has updated
      setTimeout(() => {
        try {
          // Using scrollToLocation to position the section header at the top
          sectionListRef.current.scrollToLocation({
            sectionIndex,
            itemIndex: 0,
            viewPosition: 0, // Aligns the section header at the very top
            viewOffset: 0,   // No additional offset
            animated: true,
          });
        } catch (error) {
          console.error("Error scrolling to section:", error);
        }
      }, 50);
    }
  };

  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader} testID={`section-${section.key}`}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
    </View>
  );

  const StoreImageCarousel = ({ store }) => {
    const images = getStoreImages(store);
    if (!images.length) return null;

    // Don't animate if there are few items
    const isMinimalContent = menuItems.length <= 3;

    const imageHeight = isMinimalContent
      ? 120 // Fixed height for few items
      : scrollPosition.interpolate({
        inputRange: [0, 20, 80, 100],
        outputRange: [240, 220, 140, 120],
        extrapolate: 'clamp'
      });

    return (
      <Animated.View style={[
        styles.carouselContainer,
        isMinimalContent ? { height: 120 } : { height: imageHeight }
      ]}>
        <Animated.Image
          source={{ uri: images[0] }}
          style={[
            styles.carouselImage,
            isMinimalContent ? { height: 120, width: screenWidth } : { height: imageHeight, width: screenWidth }
          ]}
        />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <FontAwesome name="angle-left" size={20} color="white" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const fetchMenuItems = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch(`${API_URL}/menu?storeId=${store._id}`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch menu items');
      }

      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setError('Unable to load menu items. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

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

  const renderMenuItem = ({ item }) => {
    return (
      <TouchableOpacity
        style={[styles.menuItem]}
        onPress={() => {
          if (!item.isAvailable) {
            Alert.alert('Not Available', 'This item is currently unavailable.');
            return;
          }
          setSelectedItem(item);
          setShowCustomization(true);
        }}
      >
        <View style={styles.menuItemContentWrapper}>
          <View style={styles.menuItemTextContent}>
            <Text style={styles.menuItemName}>{item.name}</Text>
            <Text style={styles.menuItemPrice}>{item.price.toFixed(2)} RSD</Text>
            {item.description && (
              <Text style={styles.menuItemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: item.imageUrl || getPlaceholderImage(item.name) }}
              style={styles.itemImage}
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleViewOrder = () => {
    if (cartItems.length > 0) {
      navigation.navigate('OrderSummary', {
        store
      });
    }
  };

  const total = cartItems.reduce((sum, item) => {
    const itemPrice = item.itemFinalPrice || item.price;
    const quantity = item.quantity || 1;
    return sum + (itemPrice * quantity);
  }, 0);

  const calculateDistance = (userLocation, storeLoc) => {
    if (!userLocation || !storeLoc || !storeLoc.coordinates) return null;

    const lat1 = userLocation.latitude;
    const lon1 = userLocation.longitude;
    const lat2 = storeLoc.coordinates[1];
    const lon2 = storeLoc.coordinates[0];

    // Haversine formula
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

  const formatDistance = (distance) => {
    if (distance === null) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m away`;
    }
    return `${distance.toFixed(1)}km away`;
  };

  const getClosingTime = (store) => {
    if (!store?.hours) return null;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = new Date().getDay(); // 0 is Sunday
    const dayName = days[today];

    const todayHours = store.hours[dayName];
    if (!todayHours || !todayHours.close) return null;

    return todayHours.close;
  };

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      const firstVisibleSection = viewableItems[0].section;
      if (firstVisibleSection && firstVisibleSection.key !== selectedCategory) {
        setSelectedCategory(firstVisibleSection.key);
      }
    }
  }).current;

  return (
    <View style={styles.modalContainer}>
      <StatusBar
        translucent={true}
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <StoreImageCarousel store={store} />

      <SafeAreaView style={styles.contentContainer}>
        <View style={styles.storeInfo}>
          <Text style={styles.storeName}>{store?.name}</Text>

          <View style={styles.storeDetailsContainer}>
            <Text style={styles.storeAddress}>{store?.address}</Text>

            {userLocation && (
              <Text style={styles.distanceText}>
                {formatDistance(calculateDistance(userLocation, store?.location))}
              </Text>
            )}
          </View>

          <View style={styles.categoryList}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={menuSections}
              keyExtractor={(item) => item.key}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryButton,
                    selectedCategory === item.key && styles.selectedCategory
                  ]}
                  onPress={() => handleCategorySelect(item.key)}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategory === item.key && styles.selectedCategoryText
                  ]}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading menu items...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <SectionList
              ref={sectionListRef}
              sections={menuSections}
              keyExtractor={(item, index) => item._id?.toString() || index.toString()}
              renderItem={renderMenuItem}
              renderSectionHeader={renderSectionHeader}
              stickySectionHeadersEnabled={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No menu items available</Text>
              }
              contentContainerStyle={styles.listContent}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollPosition } } }],
                { useNativeDriver: false }
              )}
              onViewableItemsChanged={handleViewableItemsChanged}
              viewabilityConfig={{
                viewAreaCoveragePercentThreshold: 30,
                minimumViewTime: 200,
              }}
              scrollEventThrottle={16}
            />
          )}
        </KeyboardAvoidingView>

        {cartItems.length > 0 && (
          <View style={styles.viewOrderButton}>
            <TouchableOpacity
              style={styles.orderButton}
              onPress={handleViewOrder}
            >
              <View style={styles.orderButtonContent}>
                <Text style={styles.orderButtonText}>
                  View Cart
                </Text>
                <Text style={styles.orderButtonPrice}>
                  {total.toFixed(2)} RSD
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

      </SafeAreaView>
      <CustomizationModal
        visible={showCustomization}
        item={selectedItem}
        onClose={() => {
          setShowCustomization(false);
          setSelectedItem(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.error,
    textAlign: 'center',
  },
  carouselContainer: {
    width: '100%',
    height: 240,
    backgroundColor: theme.primary,
    position: 'relative',
    marginTop: 0,
    paddingTop: 0,
  },
  carouselImage: {
    width: screenWidth,
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 40,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 10,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 6,
    borderRadius: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: theme.white,
  },
  storeInfo: {
    backgroundColor: theme.white,
    paddingHorizontal: 16,
    paddingBottom: 5,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 6,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategory: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  categoryText: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.secondary,
  },
  selectedCategoryText: {
    color: theme.white,
  },
  menuItem: {
    backgroundColor: theme.white,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
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
  menuItemContentWrapper: {
    padding: 16,
    flexDirection: 'row',
    gap: 16,
  },
  menuItemTextContent: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 4,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.accent,
    marginBottom: 8,
  },
  menuItemDescription: {
    fontSize: 14,
    color: theme.secondary,
    lineHeight: 20,
  },
  imageWrapper: {
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F8F8F8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  listContent: {
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 16,
    color: theme.secondary,
    textAlign: 'center',
    marginTop: 32,
  },
  viewOrderButton: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  orderButton: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    padding: 16,
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
  storeName: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.primary,
    marginBottom: 6,
  },
  storeDetailsContainer: {
    marginBottom: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  storeAddress: {
    fontSize: 15,
    color: theme.secondary,
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '500',
  },
  openUntilText: {
    fontSize: 14,
    color: theme.success,
    fontWeight: '500',
    marginLeft: 4,
  },
  closedText: {
    fontSize: 14,
    color: theme.error,
    fontWeight: '500',
    marginLeft: 4,
  },
  categoryList: {
    backgroundColor: theme.white,
    paddingVertical: 8,
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5', // Light gray background like in your images
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0, // Remove border
    marginTop: 0, // Remove margin
    // Make sure header sticks to top during scrolling
    position: 'sticky',
    top: 0,
    zIndex: 10, // Ensure it appears above list items
  },
  sectionHeaderText: {
    fontSize: 24, // Larger font size to match your images
    fontWeight: '700',
    color: theme.primary,
  },
});