import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import BASE_URL from './config';
import { LoadingOverlay } from '../utils/loading-state';
import ErrorBoundary from '../utils/error-boundary';
import { useNavigation } from '@react-navigation/native';

const API_URL = `${BASE_URL}/api`;

export default function MenuManagement() {
  const navigation = useNavigation();
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'coffee',
    isAvailable: true,
    imageUrl: '',
    sizes: [{ name: '', priceModifier: '' }],
    extras: [{ name: '', price: '' }]
  });
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedFilterStore, setSelectedFilterStore] = useState(null);
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardShown, setKeyboardShown] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [imageUrl, setImageUrl] = useState('');

  // Add state for reordering mode
  const [isReorderingMode, setIsReorderingMode] = useState(false);
  const [reorderingCategory, setReorderingCategory] = useState(null);
  const [categorizedItems, setCategorizedItems] = useState({});

  // Add these near the other state variables
  const [isEditCategoryModalVisible, setIsEditCategoryModalVisible] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isDeleteCategoryModalVisible, setIsDeleteCategoryModalVisible] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  useEffect(() => {
    if (global.userRole !== 'coffee_shop') {
      Alert.alert(
        'Unauthorized Access',
        'Only coffee shop owners can access this section',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      return;
    }
    fetchStores();
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedFilterStore) {
      fetchMenuItems();
    }
  }, [selectedFilterStore]);

  useEffect(() => {
    if (menuItems.length > 0) {
      // Group items by category
      const itemsByCategory = {};
      menuItems.forEach(item => {
        const category = item.category || 'Uncategorized';
        if (!itemsByCategory[category]) {
          itemsByCategory[category] = [];
        }
        itemsByCategory[category].push(item);
      });
      setCategorizedItems(itemsByCategory);
    }
  }, [menuItems]);

  useEffect(() => {
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
  }, []);

  const fetchStores = async () => {
    setIsLoading(true);
    try {
      const apiUrl = `${API_URL}/stores/mine`;

      const headers = {
        'Authorization': `Bearer ${global.userToken}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers
      });


      if (!response.ok) {
        const errorText = await response.text();
        console.log("Frontend Fetch - Response Error Text:", errorText);
        const errorMessage = `Failed to fetch stores. Status: ${response.status}. Server message: ${errorText}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setStores(data);
      if (data.length > 0) {
        setSelectedFilterStore(data[0]);
        setSelectedStore(data[0]);
      } else {
        Alert.alert('No Stores', 'You have no stores assigned');
      }

    } catch (error) {
      console.error("Frontend Fetch - Error:", error);
      Alert.alert('Error', 'Error fetching store');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await fetch(`${API_URL}/menu?storeId=${selectedFilterStore._id}`, {
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

  const renderStoreFilter = () => (
    <View style={styles.storeFilter}>
      <TouchableOpacity
        style={styles.simpleDropdownButton}
        onPress={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
        disabled={isReorderingMode} // Disable when reordering
      >
        <Text style={styles.selectedText}>
          {selectedFilterStore ? selectedFilterStore.name : 'Select Store'}
        </Text>
        <FontAwesome
          name={isFilterDropdownOpen ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={theme.secondary}
        />
      </TouchableOpacity>

      {isFilterDropdownOpen && (
        <View style={styles.simpleDropdownList}>
          {stores.map((store) => (
            <TouchableOpacity
              key={store._id}
              style={styles.simpleDropdownItem}
              onPress={() => {
                setSelectedFilterStore(store);
                setIsFilterDropdownOpen(false);
              }}
            >
              <Text style={styles.storeName}>{store.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const moveItem = (item, direction, categoryName) => {
    // Create a copy of the items in this category
    const categoryItems = [...categorizedItems[categoryName]];
    const currentIndex = categoryItems.findIndex(i => i._id === item._id);

    if (currentIndex === -1) return;

    // Check bounds
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categoryItems.length - 1)
    ) {
      return; // Can't move further
    }

    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Swap the items
    const temp = categoryItems[currentIndex];
    categoryItems[currentIndex] = categoryItems[swapIndex];
    categoryItems[swapIndex] = temp;

    // Update positions
    categoryItems.forEach((item, index) => {
      item.position = index;
    });

    // Update the categorized items
    setCategorizedItems({
      ...categorizedItems,
      [categoryName]: categoryItems
    });

    // Also update the menuItems array for consistency
    const newMenuItems = [...menuItems];
    const menuIndex = newMenuItems.findIndex(i => i._id === item._id);
    const swapMenuIndex = direction === 'up' ? menuIndex - 1 : menuIndex + 1;

    // Only swap if both items are from the same category
    if (
      menuIndex !== -1 &&
      swapMenuIndex >= 0 &&
      swapMenuIndex < newMenuItems.length &&
      newMenuItems[swapMenuIndex].category === categoryName
    ) {
      const temp = newMenuItems[menuIndex];
      newMenuItems[menuIndex] = newMenuItems[swapMenuIndex];
      newMenuItems[swapMenuIndex] = temp;
      setMenuItems(newMenuItems);
    }
  };

  const handleEditCategory = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      setCategoryToEdit(category);
      setNewCategoryName(category.name);
      setIsEditCategoryModalVisible(true);
    }
  };

  const handleDeleteCategory = (categoryName) => {
    const category = categories.find(c => c.name === categoryName);
    if (category) {
      setCategoryToDelete(category);
      setIsDeleteCategoryModalVisible(true);
    }
  };

  const submitCategoryEdit = async () => {
    if (!categoryToEdit || !newCategoryName.trim() || newCategoryName === categoryToEdit.name) {
      setIsEditCategoryModalVisible(false);
      return;
    }
  
    // Check for duplicate name
    if (categories.some(c => c.name.toLowerCase() === newCategoryName.toLowerCase() && c._id !== categoryToEdit._id)) {
      Alert.alert('Error', 'A category with this name already exists');
      return;
    }
  
    try {
      setIsSaving(true);
      
      // First update the category
      const response = await fetch(`${API_URL}/categories/${categoryToEdit._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newCategoryName })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }
  
      // Update category in local state immediately
      const oldCategoryName = categoryToEdit.name;
      const newUpdatedCategories = categories.map(cat => 
        cat._id === categoryToEdit._id ? {...cat, name: newCategoryName} : cat
      );
      setCategories(newUpdatedCategories);
      
      // Update items in the local state
      const updatedMenuItems = menuItems.map(item => 
        item.category === oldCategoryName ? {...item, category: newCategoryName} : item
      );
      setMenuItems(updatedMenuItems);
      
      // Update categorizedItems
      const newCategorizedItems = {...categorizedItems};
      if (newCategorizedItems[oldCategoryName]) {
        // Move items from old category to new category
        newCategorizedItems[newCategoryName] = newCategorizedItems[oldCategoryName].map(item => ({
          ...item, 
          category: newCategoryName
        }));
        // Remove old category
        delete newCategorizedItems[oldCategoryName];
      }
      setCategorizedItems(newCategorizedItems);
  
      // Batch update all items at once
      if (updatedMenuItems.some(item => item.category === newCategoryName)) {
        try {
          const batchResponse = await fetch(`${API_URL}/menu/batch-category`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${global.userToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              oldCategory: oldCategoryName,
              newCategory: newCategoryName,
              storeId: selectedFilterStore._id
            })
          });
          
          if (!batchResponse.ok) {
            console.warn('Failed to batch update items, but UI was updated');
          }
        } catch (err) {
          console.warn('Error in batch update, but UI was updated:', err);
        }
      }
  
      Alert.alert('Success', 'Category updated successfully');
      setIsEditCategoryModalVisible(false);
      
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to update category');
      // Refresh to ensure UI is in sync with backend
      await fetchCategories();
      await fetchMenuItems();
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) {
      setIsDeleteCategoryModalVisible(false);
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch(`${API_URL}/categories/${categoryToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${global.userToken}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }

      // Move items to "Uncategorized"
      const itemsToUpdate = menuItems.filter(item => item.category === categoryToDelete.name);

      if (itemsToUpdate.length > 0) {
        const itemUpdatePromises = itemsToUpdate.map(item =>
          fetch(`${API_URL}/menu/${item._id}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${global.userToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ category: 'Uncategorized' })
          })
        );

        await Promise.all(itemUpdatePromises);
      }

      Alert.alert('Success', 'Category deleted successfully');
      setIsDeleteCategoryModalVisible(false);

      // Refresh data
      await fetchCategories();
      await fetchMenuItems();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to delete category');
    } finally {
      setIsSaving(false);
    }
  };

  const moveCategory = (categoryName, direction) => {
    // Work directly with the categories array since it has the proper category objects with IDs
    const categoryIndex = categories.findIndex(cat => cat.name === categoryName);

    if (categoryIndex === -1) return;

    // Check bounds
    if (
      (direction === 'up' && categoryIndex === 0) ||
      (direction === 'down' && categoryIndex === categories.length - 1)
    ) {
      return; // Can't move further
    }

    const swapIndex = direction === 'up' ? categoryIndex - 1 : categoryIndex + 1;

    // Create a copy of categories array to modify
    const updatedCategories = [...categories];

    // Swap the categories
    const temp = updatedCategories[categoryIndex];
    updatedCategories[categoryIndex] = updatedCategories[swapIndex];
    updatedCategories[swapIndex] = temp;

    // Set new positions explicitly
    updatedCategories.forEach((cat, index) => {
      cat.position = index;
    });

    // Update the categories state
    setCategories(updatedCategories);
  }

  const saveItemOrder = async (categoryName) => {
    try {
      setIsSaving(true);

      // Get items for this category with their new positions
      const itemsToUpdate = categorizedItems[categoryName].map((item, index) => ({
        id: item._id,
        position: index
      }));

      const response = await fetch(`${API_URL}/menu/reorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: itemsToUpdate })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save item order');
      }

      Alert.alert('Success', 'Menu item order has been updated');

      // Exit reordering mode
      setReorderingCategory(null);

      // Refresh menu items to get the new order
      fetchMenuItems();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const saveCategoryOrder = async () => {
    try {
      setIsSaving(true);

      // Format categories for the API - use position directly from categories array
      const categoriesToUpdate = categories.map((cat, index) => ({
        id: cat._id,
        position: index // Use the index as the position to ensure proper order
      }));

      const response = await fetch(`${API_URL}/categories/reorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ categories: categoriesToUpdate })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save category order');
      }

      Alert.alert('Success', 'Category order has been updated');

      // Exit reordering mode
      setIsReorderingMode(false);

      // Refresh data with await to ensure they complete before continuing
      await fetchCategories();
      await fetchMenuItems();
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to save category order');
    } finally {
      setIsSaving(false);
    }
  }

  const renderCategorySection = ({ category, items }) => {
    // Find the category object from our categories state
    const categoryObj = categories.find(cat => cat.name === category);
    const categoryPosition = categoryObj?.position;

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <Text style={styles.categoryTitle}>
            {category} {isReorderingMode && !reorderingCategory &&
              <Text style={styles.positionText}>(Position: {categoryPosition})</Text>}
          </Text>

          <View style={styles.categoryActions}>
            {isReorderingMode && !reorderingCategory ? (
              <View style={styles.reorderActions}>
                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => moveCategory(category, 'up')}
                >
                  <FontAwesome name="arrow-up" size={18} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reorderButton}
                  onPress={() => moveCategory(category, 'down')}
                >
                  <FontAwesome name="arrow-down" size={18} color={theme.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.reorderItemsButton}
                  onPress={() => setReorderingCategory(category)}
                >
                  <FontAwesome name="list" size={16} color={theme.white} />
                  <Text style={styles.reorderItemsText}>Reorder Items</Text>
                </TouchableOpacity>
              </View>
            ) : (
              !isReorderingMode && (
                <View style={styles.categoryManageActions}>
                  <TouchableOpacity
                    style={styles.categoryActionButton}
                    onPress={() => handleEditCategory(category)}
                  >
                    <FontAwesome name="pencil" size={16} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.categoryActionButton}
                    onPress={() => handleDeleteCategory(category)}
                  >
                    <FontAwesome name="trash" size={16} color={theme.error} />
                  </TouchableOpacity>
                </View>
              )
            )}
          </View>
        </View>

        {items.map(item => renderMenuItem({ item, category }))}
      </View>
    );
  };

  const renderMenuItem = ({ item, category }) => {
    // If we're reordering a specific category, only show items from that category
    if (reorderingCategory && category !== reorderingCategory) {
      return null;
    }

    return (
      <View key={item._id} style={styles.menuItem}>
        {reorderingCategory ? (
          // Reordering view for items
          <View style={styles.reorderItemContainer}>
            <Text style={styles.menuItemName}>{item.name}</Text>
            <View style={styles.reorderItemActions}>
              <TouchableOpacity
                style={styles.reorderButton}
                onPress={() => moveItem(item, 'up', category)}
              >
                <FontAwesome name="arrow-up" size={18} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reorderButton}
                onPress={() => moveItem(item, 'down', category)}
              >
                <FontAwesome name="arrow-down" size={18} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Normal view
          <TouchableOpacity
            style={styles.menuItemContent}
            onPress={() => {
              if (isReorderingMode) return; // Disable editing when reordering

              setEditingItem(item);
              setFormData({
                name: item.name,
                description: item.description || '',
                price: item.price.toString(),
                category: item.category,
                isAvailable: item.isAvailable,
                imageUrl: item.imageUrl || '',
                sizes: item.sizes?.length > 0 ? item.sizes : [{ name: '', priceModifier: '' }],
                extras: item.extras?.length > 0 ? item.extras : [{ name: '', price: '' }]
              });
              setImageUrl(item.imageUrl || '');
              setSelectedStore(stores.find(store => store._id === item.store));
              setIsModalVisible(true);
            }}
          >
            <View style={styles.menuItemHeader}>
              <Text style={styles.menuItemName}>{item.name}</Text>
              <Text style={styles.menuItemPrice}>{item.price.toFixed(2)} RSD</Text>
            </View>

            {item.imageUrl && (
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.menuItemImage}
              />
            )}

            {item.description && (
              <Text style={styles.menuItemDescription}>{item.description}</Text>
            )}

            <View style={styles.menuItemFooter}>
              <View style={styles.statusContainer}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: item.isAvailable ? theme.success : theme.error }
                ]} />
                <Text style={styles.statusText}>
                  {item.isAvailable ? 'Available' : 'Unavailable'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.price || !selectedStore) {
        Alert.alert('Error', 'Name, price and store are required');
        return;
      }

      setIsLoading(true);

      const validSizes = formData.sizes
        .filter(size => size.name && size.priceModifier)
        .map(size => ({
          name: size.name,
          priceModifier: parseFloat(size.priceModifier)
        }));

      const validExtras = formData.extras
        .filter(extra => extra.name && extra.price)
        .map(extra => ({
          name: extra.name,
          price: parseFloat(extra.price)
        }));

      const response = await fetch(`${API_URL}/menu`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: imageUrl || '',
          store: selectedStore._id,
          price: parseFloat(formData.price),
          sizes: validSizes,
          extras: validExtras
        })
      });

      if (!response.ok) throw new Error('Failed to create menu item');

      await fetchMenuItems();
      setIsModalVisible(false);
      resetForm();
      Alert.alert('Success', 'Item added successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSizesSection = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Sizes</Text>
      {formData.sizes.map((size, index) => (
        <View key={index} style={styles.extraRow}>
          <TextInput
            style={[styles.input, styles.extraInput]}
            value={size.name}
            placeholder="Size name"
            onChangeText={(value) => {
              const newSizes = [...formData.sizes];
              newSizes[index] = { ...size, name: value };
              setFormData(prev => ({ ...prev, sizes: newSizes }));
            }}
          />
          <TextInput
            style={[styles.input, styles.extraInput]}
            value={size.priceModifier}
            placeholder="Price modifier"
            keyboardType="numeric"
            onChangeText={(value) => {
              const newSizes = [...formData.sizes];
              newSizes[index] = { ...size, priceModifier: value };
              setFormData(prev => ({ ...prev, sizes: newSizes }));
            }}
          />
          <TouchableOpacity
            style={styles.removeExtraButton}
            onPress={() => {
              const newSizes = formData.sizes.filter((_, i) => i !== index);
              setFormData(prev => ({ ...prev, sizes: newSizes }));
            }}
          >
            <FontAwesome name="trash" size={20} color={theme.error} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={styles.addExtraButton}
        onPress={() => {
          setFormData(prev => ({
            ...prev,
            sizes: [...prev.sizes, { name: '', priceModifier: '' }]
          }));
        }}
      >
        <Text style={styles.addExtraButtonText}>Add Size</Text>
      </TouchableOpacity>
    </View>
  );

  const renderExtrasSection = () => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>Extras</Text>
      {formData.extras.map((extra, index) => (
        <View key={index} style={styles.extraRow}>
          <TextInput
            style={[styles.input, styles.extraInput]}
            value={extra.name}
            placeholder="Extra name"
            onChangeText={(value) => {
              const newExtras = [...formData.extras];
              newExtras[index] = { ...extra, name: value };
              setFormData(prev => ({ ...prev, extras: newExtras }));
            }}
          />
          <TextInput
            style={[styles.input, styles.extraInput]}
            value={extra.price}
            placeholder="Price"
            keyboardType="numeric"
            onChangeText={(value) => {
              const newExtras = [...formData.extras];
              newExtras[index] = { ...extra, price: value };
              setFormData(prev => ({ ...prev, extras: newExtras }));
            }}
          />
          <TouchableOpacity
            style={styles.removeExtraButton}
            onPress={() => {
              const newExtras = formData.extras.filter((_, i) => i !== index);
              setFormData(prev => ({ ...prev, extras: newExtras }));
            }}
          >
            <FontAwesome name="trash" size={20} color={theme.error} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        style={styles.addExtraButton}
        onPress={() => {
          setFormData(prev => ({
            ...prev,
            extras: [...prev.extras, { name: '', price: '' }]
          }));
        }}
      >
        <Text style={styles.addExtraButtonText}>Add Extra</Text>
      </TouchableOpacity>
    </View>
  );

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: 'coffee',
      isAvailable: true,
      imageUrl: '',
      sizes: [{ name: '', priceModifier: '' }],
      extras: [{ name: '', price: '' }]
    });
    setImageUrl('');
    setNewCategory('');
    setSelectedStore(stores.length > 0 ? stores[0] : null);
  };

  const handleBatchAvailability = async (available) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/menu/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          updates: Array.from(selectedItems).map(id => ({
            id,
            isAvailable: available
          }))
        })
      });

      if (!response.ok) throw new Error('Failed to update items');

      await fetchMenuItems();
      setSelectedItems(new Set());
      Alert.alert('Success', `Items ${available ? 'enabled' : 'disabled'}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      const data = await response.json();

      // Sort categories by position first to ensure they're in the correct order
      const sortedData = [...data].sort((a, b) => {
        // If positions exist, sort by them
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        // Fall back to name sorting if positions aren't available
        return a.name.localeCompare(b.name);
      });

      console.log('Fetched categories:', sortedData.map(c => c.name));
      setCategories(sortedData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      const response = await fetch(`${API_URL}/categories`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newCategory })
      });

      if (!response.ok) throw new Error('Failed to add category');

      await fetchCategories();
      setNewCategory('');
      setShowCategoryInput(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const handleEdit = async () => {
    try {
      if (!formData.name || !formData.price || !selectedStore) {
        Alert.alert('Error', 'Name, price and store are required');
        return;
      }

      setIsLoading(true);

      const validSizes = formData.sizes
        .filter(size => size.name && size.priceModifier)
        .map(size => ({
          name: size.name,
          priceModifier: parseFloat(size.priceModifier)
        }));

      const validExtras = formData.extras
        .filter(extra => extra.name && extra.price)
        .map(extra => ({
          name: extra.name,
          price: parseFloat(extra.price)
        }));

      const response = await fetch(`${API_URL}/menu/${editingItem._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          imageUrl: imageUrl || '',
          store: selectedStore._id,
          price: parseFloat(formData.price),
          sizes: validSizes,
          extras: validExtras
        })
      });

      if (!response.ok) throw new Error('Failed to update menu item');

      await fetchMenuItems();
      setIsModalVisible(false);
      setEditingItem(null);
      resetForm();
      Alert.alert('Success', 'Item updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingItem) return;

    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await fetch(`${API_URL}/menu/${editingItem._id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${global.userToken}`
                }
              });

              if (!response.ok) throw new Error('Failed to delete menu item');

              await fetchMenuItems();
              setIsModalVisible(false);
              setEditingItem(null);
              resetForm();
              Alert.alert('Success', 'Item deleted successfully');
            } catch (error) {
              Alert.alert('Error', error.message);
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  // Render the header with appropriate action buttons
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {renderStoreFilter()}
      <View style={styles.headerButtons}>
        {isReorderingMode ? (
          // Reordering mode buttons
          reorderingCategory ? (
            // Buttons when reordering items within a category
            <View style={styles.reorderingModeButtons}>
              <TouchableOpacity
                style={styles.cancelReorderButton}
                onPress={() => setReorderingCategory(null)}
              >
                <Text style={styles.cancelReorderText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveReorderButton}
                onPress={() => saveItemOrder(reorderingCategory)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Text style={styles.saveReorderText}>Saving...</Text>
                ) : (
                  <Text style={styles.saveReorderText}>Save Order</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.reorderingModeButtons}>
              <TouchableOpacity
                style={styles.cancelReorderButton}
                onPress={() => setIsReorderingMode(false)}
              >
                <Text style={styles.cancelReorderText}>Exit Reordering</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveReorderButton}
                onPress={saveCategoryOrder}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Text style={styles.saveReorderText}>Saving...</Text>
                ) : (
                  <Text style={styles.saveReorderText}>Save Order</Text>
                )}
              </TouchableOpacity>
            </View>
          )
        ) : (
          <View style={styles.normalModeButtons}>
            <TouchableOpacity
              style={styles.reorderModeButton}
              onPress={() => setIsReorderingMode(true)}
            >
              <FontAwesome name="sort" size={20} color={theme.primary} />
              <Text style={styles.reorderModeText}>Reorder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addButtonHeader}
              onPress={() => {
                resetForm();
                setIsModalVisible(true);
                setEditingItem(null);
              }}
            >
              <FontAwesome name="plus" size={30} color={theme.accent} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        {renderHeader()}

        {reorderingCategory ? (
          <View style={styles.reorderingContent}>
            <Text style={styles.reorderingTitle}>Reordering Items: {reorderingCategory}</Text>
            {categorizedItems[reorderingCategory]?.map(item =>
              renderMenuItem({ item, category: reorderingCategory })
            )}
          </View>
        ) : (
          <FlatList
            data={categories
              .map(cat => ({
                category: cat.name,
                categoryId: cat._id,
                position: cat.position,
                items: categorizedItems[cat.name] || []
              }))
              .filter(cat => cat.items.length > -1)
              .sort((a, b) => (a.position || 9999) - (b.position || 9999))
            }
            renderItem={({ item }) => renderCategorySection(item)}
            keyExtractor={item => item.category}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                No menu items. Click "+" to add your first item.
              </Text>
            }
          />
        )}

        <Modal
          visible={isModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={[
              styles.modalContainer,
              keyboardShown && styles.modalContainerKeyboard
            ]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setIsModalVisible(false);
                    setEditingItem(null);
                    resetForm();
                  }}
                >
                  <FontAwesome name="times" size={24} color={theme.secondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>

                <View style={styles.dropdownContainer}>
                  <Text style={styles.inputLabel}>Select Store</Text>
                  <TouchableOpacity
                    style={styles.simpleDropdownButton}
                    onPress={() => setIsStoreDropdownOpen(!isStoreDropdownOpen)}
                  >
                    <Text style={selectedStore ? styles.selectedText : styles.placeholderText}>
                      {selectedStore ? selectedStore.name : 'Select a store'}
                    </Text>
                    <FontAwesome
                      name={isStoreDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.secondary}
                    />
                  </TouchableOpacity>

                  {isStoreDropdownOpen && (
                    <View style={styles.simpleDropdownList}>
                      {stores.map((store) => (
                        <TouchableOpacity
                          key={store._id}
                          style={styles.simpleDropdownItem}
                          onPress={() => {
                            setSelectedStore(store);
                            setIsStoreDropdownOpen(false);
                          }}
                        >
                          <Text style={styles.storeName}>{store.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Name</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, name: value }))}
                    placeholder="Enter item name"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Price (RSD)</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, price: value }))}
                    placeholder="Enter price"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(value) => setFormData(prev => ({ ...prev, description: value }))}
                    placeholder="Enter item description"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.availabilityRow}>
                    <Text style={styles.inputLabel}>Available</Text>
                    <Switch
                      value={formData.isAvailable}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, isAvailable: value }))}
                      trackColor={{ false: theme.border, true: theme.accent }}
                    />
                  </View>
                </View>

                <View style={styles.imageInputContainer}>
                  <Text style={styles.inputLabel}>Image URL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter image URL"
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                  {imageUrl ? (
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.imagePreview}
                      onError={() => Alert.alert('Error', 'Invalid image URL')}
                    />
                  ) : null}
                </View>

                <View style={styles.categoryDropdownContainer}>
                  <Text style={styles.inputLabel}>Category</Text>
                  <TouchableOpacity
                    style={styles.categoryDropdownButton}
                    onPress={() => {
                      setIsCategoryDropdownOpen(!isCategoryDropdownOpen);
                      setShowCategoryInput(false);
                    }}
                  >
                    <Text style={formData.category ? styles.selectedText : styles.placeholderText}>
                      {formData.category || 'Select category'}
                    </Text>
                    <FontAwesome
                      name={isCategoryDropdownOpen ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={theme.secondary}
                    />
                  </TouchableOpacity>

                  {isCategoryDropdownOpen && (
                    <View style={styles.categoryDropdownList}>
                      {showCategoryInput && (
                        <View style={styles.newCategoryInput}>
                          <TextInput
                            style={styles.categoryInput}
                            placeholder="New category name"
                            value={newCategory}
                            onChangeText={setNewCategory}
                          />
                          <TouchableOpacity
                            style={styles.addCategoryButton}
                            onPress={handleAddCategory}
                          >
                            <FontAwesome name="plus" size={16} color={theme.white} />
                          </TouchableOpacity>
                        </View>
                      )}

                      <ScrollView style={styles.categoryScrollView}>
                        {categories.map(cat => (
                          <TouchableOpacity
                            key={cat._id}
                            style={styles.categoryDropdownItem}
                            onPress={() => {
                              setFormData(prev => ({ ...prev, category: cat.name }));
                              setIsCategoryDropdownOpen(false);
                            }}
                          >
                            <Text>{cat.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>

                      {!showCategoryInput && (
                        <TouchableOpacity
                          style={styles.addCategoryRow}
                          onPress={() => setShowCategoryInput(true)}
                        >
                          <FontAwesome name="plus" size={14} color={theme.accent} />
                          <Text style={styles.addCategoryText}>Add New Category</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {renderSizesSection()}
                {renderExtrasSection()}

              </ScrollView>
              <View style={styles.modalFooter}>
                {editingItem && (
                  <TouchableOpacity
                    style={[styles.submitButton, styles.deleteButton]}
                    onPress={handleDelete}
                  >
                    <Text style={styles.submitButtonText}>Delete Item</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => {
                    if (editingItem) {
                      handleEdit();
                    } else {
                      handleSubmit();
                    }
                  }}
                  disabled={isLoading}
                >
                  <Text style={styles.submitButtonText}>
                    {editingItem ? 'Update Item' : 'Add Item'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <Modal
          visible={isEditCategoryModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsEditCategoryModalVisible(false)}
        >
          <View style={styles.centeredModalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalCardTitle}>Edit Category</Text>
              <TextInput
                style={styles.modalInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Category name"
              />
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsEditCategoryModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={submitCategoryEdit}
                  disabled={isSaving}
                >
                  <Text style={styles.confirmButtonText}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <Modal
          visible={isDeleteCategoryModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setIsDeleteCategoryModalVisible(false)}
        >
          <View style={styles.centeredModalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalCardTitle}>Delete Category</Text>
              <Text style={styles.modalText}>
                Are you sure you want to delete the "{categoryToDelete?.name}" category?
                Items in this category will be moved to "Uncategorized".
              </Text>
              <View style={styles.modalButtonRow}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsDeleteCategoryModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={confirmDeleteCategory}
                  disabled={isSaving}
                >
                  <Text style={styles.confirmButtonText}>
                    {isSaving ? 'Deleting...' : 'Delete'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: theme.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  normalModeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reorderingModeButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  reorderModeText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.primary,
  },
  cancelReorderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  cancelReorderText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.secondary,
  },
  saveReorderButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.accent,
  },
  saveReorderText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.white,
  },
  addButtonHeader: {
    padding: 8,
  },
  reorderingContent: {
    flex: 1,
    padding: 16,
  },
  reorderingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.white,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
  },
  reorderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reorderButton: {
    padding: 8,
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  reorderItemsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: theme.accent,
    borderRadius: 8,
  },
  reorderItemsText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.white,
  },
  reorderItemContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  reorderItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: theme.white,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 3
  },
  menuItemContent: {
    flex: 1,
    padding: 16,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.accent
  },
  menuItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    fontSize: 14,
    color: theme.secondary
  },
  menuItemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
    resizeMode: 'cover',
  },
  menuItemDescription: {
    fontSize: 14,
    color: theme.secondary,
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  dropdownContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 15,
  },
  modalContainer: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primary
  },
  closeButton: {
    padding: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16
  },
  availabilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24
  },
  submitButton: {
    flex: 1,
    backgroundColor: theme.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center'
  },
  submitButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600'
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  extraInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeExtraButton: {
    padding: 8,
  },
  addExtraButton: {
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addExtraButtonText: {
    color: theme.accent,
    fontWeight: '500',
  },
  modalContainerKeyboard: {
    maxHeight: '80%'
  },
  categoryContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  selectedText: {
    color: theme.primary,
    fontSize: 16,
  },
  placeholderText: {
    color: theme.secondary,
    fontSize: 16,
  },
  addCategoryButtonText: {
    color: theme.white,
    fontSize: 14,
    fontWeight: '500',
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  headerButton: {
    padding: 8
  },
  deleteButton: {
    marginRight: 8,
    backgroundColor: theme.error
  },
  storeFilter: {
    backgroundColor: theme.white,
    marginBottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  simpleDropdownButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.surface,
  },
  simpleDropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    marginTop: 5,
    maxHeight: 200,
    overflow: 'hidden',
    zIndex: 1001,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  simpleDropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  inputGroup: {
    marginBottom: 16
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border
  },
  modalContent: {
    paddingBottom: 30,
  },
  categoryDropdownContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 16,
  },
  categoryDropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.surface,
  },
  categoryDropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    maxHeight: 200,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  categoryScrollView: {
    maxHeight: 150,
  },
  categoryDropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  newCategoryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  categoryInput: {
    flex: 1,
    marginRight: 8,
  },
  addCategoryButton: {
    backgroundColor: theme.accent,
    padding: 8,
    borderRadius: 8,
  },
  addCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  addCategoryText: {
    color: theme.accent,
    marginLeft: 8,
  },
  imageInputContainer: {
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginTop: 8,
    resizeMode: 'cover',
  },
  list: {
    paddingVertical: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: theme.secondary,
    padding: 24,
  },
  inputLabel: {
    fontSize: 16,
    color: theme.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },

  // Add these to your styles object
  categoryManageActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryActionButton: {
    padding: 8,
    backgroundColor: theme.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  centeredModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalCard: {
    backgroundColor: theme.white,
    borderRadius: 12,
    padding: 16,
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modalCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalText: {
    fontSize: 16,
    color: theme.secondary,
    marginBottom: 16,
  },
  modalButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  confirmButton: {
    backgroundColor: theme.accent,
  },
  cancelButtonText: {
    color: theme.secondary,
    fontWeight: '500',
  },
  confirmButtonText: {
    color: theme.white,
    fontWeight: '600',
  },
});