// Store management screen:
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
  StyleSheet
} from 'react-native';

import { FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { theme } from './styles';
import BASE_URL from './config';
import * as storeUtils from './storeUtils';
import { validateStoreHours } from '../utils/storeHoursService';

const API_URL = `${BASE_URL}/api`;

export default function StoreManagementScreen({ navigation }) {
  const initialHours = {
    monday: { open: '08:00', close: '20:00' },
    tuesday: { open: '08:00', close: '20:00' },
    wednesday: { open: '08:00', close: '20:00' },
    thursday: { open: '08:00', close: '20:00' },
    friday: { open: '08:00', close: '20:00' },
    saturday: { open: '09:00', close: '18:00' },
    sunday: { open: '09:00', close: '18:00' }
  };
  const [imageUrls, setImageUrls] = useState(['']);
  const [isLoading, setIsLoading] = useState(false);
  const [shopOwners, setShopOwners] = useState([]);
  const [stores, setStores] = useState([]);
  const [editingStore, setEditingStore] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [showAddStoreForm, setShowAddStoreForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [storeData, setStoreData] = useState({
    name: '',
    address: '',
    phone: '',
    hours: initialHours,
  });

  useEffect(() => {
    fetchShopOwners();
    fetchAllStores();
  }, []);

  const DAYS = [
    'monday', 'tuesday', 'wednesday', 'thursday',
    'friday', 'saturday', 'sunday'
  ];

  const resetForm = () => {
    setStoreData({
      name: '',
      address: '',
      phone: '',
      hours: initialHours
    });
    setSelectedOwner(null);
    setIsDropdownOpen(false);
    setImageUrls(['']);
  };

  const fetchShopOwners = async () => {
    try {
      const response = await fetch(`${API_URL}/users/shop-owners`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch shop owners');
      }

      const data = await response.json();
      setShopOwners(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch shop owners');
    }
  };

  const fetchAllStores = async () => {
    try {
      const response = await fetch(`${API_URL}/stores`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stores');
      }

      const data = await response.json();
      setStores(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch stores');
    }
  };

  const handleChange = (name, value) => {
    setStoreData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleHoursChange = (day, type, value) => {
    // Format time string to ensure HH:MM format
    let formattedTime = value;
    if (value) {
      // Remove any non-digit characters
      const digits = value.replace(/\D/g, '');
      if (digits.length >= 4) {
        const hours = digits.substring(0, 2);
        const minutes = digits.substring(2, 4);
        formattedTime = `${hours}:${minutes}`;
      }
    }

    setStoreData(prev => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: {
          ...prev.hours[day],
          [type]: formattedTime
        }
      }
    }));
  };

  const getCoordinatesFromAddress = async (address) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const geocodedLocation = await Location.geocodeAsync(address);

      if (geocodedLocation.length > 0) {
        return {
          type: 'Point',
          coordinates: [geocodedLocation[0].longitude, geocodedLocation[0].latitude]
        };
      }
      throw new Error('Unable to find location coordinates');
    } catch (error) {
      throw new Error('Failed to get coordinates for address: ' + error.message);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsLoading(true);

      // Validate required fields
      if (!storeData.name?.trim()) {
        throw new Error('Store name is required');
      }
      if (!storeData.address?.trim()) {
        throw new Error('Store address is required');
      }
      if (!selectedOwner) {
        throw new Error('Please select a store owner');
      }

      // Validate store hours
      try {
        validateStoreHours(storeData.hours);
      } catch (error) {
        throw new Error(`Invalid store hours: ${error.message}`);
      }

      const location = await getCoordinatesFromAddress(storeData.address);
      const validImageUrls = imageUrls.filter(url => url.trim());

      const storePayload = {
        ...storeData,
        location,
        ownerId: selectedOwner._id,
        isActive: true,
        images: validImageUrls.map(url => ({ url }))
      };

      const response = await fetch(`${API_URL}/stores/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(storePayload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create store');
      }

      await fetchAllStores();
      await fetchShopOwners();

      resetForm();
      setShowAddStoreForm(false);
      Alert.alert('Success', 'Store created successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const renderOwnerStores = (owner) => {
    const ownerStores = stores.filter(store =>
      owner.stores?.includes(store._id)
    );

    return (
      <View key={owner._id} style={styles.ownerStoreContainer}>
        <View style={styles.ownerHeader}>
          <FontAwesome name="user" size={24} color={theme.accent} />
          <View style={styles.ownerInfo}>
            <Text style={styles.ownerName}>{owner.name}</Text>
            <Text style={styles.ownerEmail}>{owner.email}</Text>
          </View>
        </View>

        {ownerStores.length > 0 ? (
          <View style={styles.storesList}>
            {ownerStores.map(store => (
              <View key={store._id} style={styles.storeItem}>
                <View style={styles.storeInfo}>
                  <Text style={styles.storeName}>{store.name}</Text>
                  <Text style={styles.storeAddress}>{store.address}</Text>
                </View>
                <View style={styles.storeActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => handleStoreClick(store)}
                  >
                    <FontAwesome name="edit" size={16} color={theme.accent} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteStore(store)}
                  >
                    <FontAwesome name="trash" size={16} color={theme.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noStoresText}>No stores assigned</Text>
        )}
      </View>
    );
  };

  const handleDeleteStore = async (store) => {
    if (!store || !store._id) {
      console.error('Invalid store object:', store);
      Alert.alert('Error', 'Invalid store data');
      return;
    }
    Alert.alert(
      'Delete Store',
      `Are you sure you want to delete ${store.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              const response = await fetch(`${API_URL}/stores/${store._id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${global.userToken}`,
                  'Content-Type': 'application/json'
                }
              });

              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete store');
              }

              // Wait for both fetch operations to complete
              await Promise.all([
                fetchAllStores(),
                fetchShopOwners()
              ]);

              Alert.alert('Success', 'Store deleted successfully');
            } catch (error) {
              console.error('Delete store error:', error);
              Alert.alert(
                'Error',
                error.message || 'An error occurred while deleting the store'
              );
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleEditStore = async () => {
    try {
      setIsLoading(true);

      if (!storeData.name?.trim() || !storeData.address?.trim()) {
        throw new Error('Store name and address are required');
      }

      const location = await getCoordinatesFromAddress(storeData.address);
      const validImageUrls = imageUrls.filter(url => url.trim());

      const response = await fetch(`${API_URL}/stores/${editingStore._id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...storeData,
          location,
          images: validImageUrls.map(url => ({ url }))
        })
      });

      if (!response.ok) throw new Error('Failed to update store');
      await fetchAllStores();
      setShowAddStoreForm(false);
      setEditingStore(null);
      resetForm();
      Alert.alert('Success', 'Store updated successfully');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStoreClick = (store) => {
    setEditingStore(store);
    setStoreData({
      name: store.name,
      address: store.address,
      phone: store.phone || '',
      hours: store.hours || initialHours,
    });
    setImageUrls(store.images?.map(img => img.url) || ['']);
    setShowAddStoreForm(true);
  };

  if (!global.userRole === 'admin') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Access denied. Admin privileges required.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Store Management</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setSelectedOwner(null);
              setShowAddStoreForm(true);
            }}
          >
            <FontAwesome name="plus" size={20} color={theme.white} />
            <Text style={styles.addButtonText}>Add New Store</Text>
          </TouchableOpacity>
        </View>

        {shopOwners.map(owner => renderOwnerStores(owner))}

        <Modal
          visible={showAddStoreForm}
          animationType="slide"
          onRequestClose={() => setShowAddStoreForm(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <ScrollView style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingStore ? 'Edit Store' : 'Add New Store'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => {
                    setShowAddStoreForm(false);
                    setEditingStore(null);
                    resetForm();
                  }}
                >
                  <FontAwesome name="times" size={24} color={theme.secondary} />
                </TouchableOpacity>
              </View>

              {/* Owner Dropdown */}
              <View style={styles.dropdownContainer}>
                <Text style={styles.inputLabel}>Store Owner</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <Text style={selectedOwner ? styles.selectedText : styles.placeholderText}>
                    {selectedOwner ? selectedOwner.name : 'Select a store owner'}
                  </Text>
                  <FontAwesome
                    name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={theme.secondary}
                  />
                </TouchableOpacity>

                {isDropdownOpen && (
                  <View style={styles.dropdownList}>
                    {shopOwners.map((owner) => (
                      <TouchableOpacity
                        key={owner._id}
                        style={[
                          styles.dropdownItem,
                          selectedOwner?._id === owner._id && styles.selectedDropdownItem
                        ]}
                        onPress={() => {
                          setSelectedOwner(owner);
                          setIsDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.ownerName}>{owner.name}</Text>
                        <Text style={styles.ownerEmail}>{owner.email}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Store Name"
                placeholderTextColor={theme.secondary}
                value={storeData.name}
                onChangeText={(value) => handleChange('name', value)}
              />

              <TextInput
                style={styles.input}
                placeholder="Address"
                placeholderTextColor={theme.secondary}
                value={storeData.address}
                onChangeText={(value) => handleChange('address', value)}
                multiline
              />

              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={theme.secondary}
                value={storeData.phone}
                onChangeText={(value) => handleChange('phone', value)}
                keyboardType="phone-pad"
              />

              <Text style={styles.sectionTitle}>Store Hours</Text>
              {DAYS.map((day) => (
                <View key={`hours-${day}`} style={styles.hoursContainer}>
                  <Text style={styles.dayLabel}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </Text>
                  <View style={styles.hoursInputContainer}>
                    <TextInput
                      style={[styles.input, styles.timeInput]}
                      value={storeData.hours[day].open}
                      onChangeText={(value) => handleHoursChange(day, 'open', value)}
                      placeholder="09:00"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                    <Text style={styles.timeSeparator}>to</Text>
                    <TextInput
                      style={[styles.input, styles.timeInput]}
                      value={storeData.hours[day].close}
                      onChangeText={(value) => handleHoursChange(day, 'close', value)}
                      placeholder="17:00"
                      keyboardType="numeric"
                      maxLength={5}
                    />
                  </View>
                </View>
              ))}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Store Images</Text>
                {imageUrls.map((url, index) => (
                  <View key={index} style={styles.imageInputRow}>
                    <TextInput
                      style={[styles.input, styles.imageInput]}
                      value={url}
                      onChangeText={(value) => {
                        const newUrls = [...imageUrls];
                        newUrls[index] = value;
                        setImageUrls(newUrls);
                      }}
                      placeholder="Enter image URL"
                    />
                    {imageUrls.length > 1 && (
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
                      >
                        <FontAwesome name="trash" size={20} color={theme.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addImageButton}
                  onPress={() => setImageUrls([...imageUrls, ''])}
                >
                  <Text style={styles.addImageButtonText}>Add Another Image</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isLoading && styles.disabledButton]}
                onPress={editingStore ? handleEditStore : handleSubmit}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>
                  {isLoading ? 'Saving...' : editingStore ? 'Update Store' : 'Create Store'}
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    width: '100%', // Add full width
  },
  scrollView: {
    flex: 1,
    width: '100%', // Add full width
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    width: '100%', // Add full width
  },
  ownerStoreContainer: {
    backgroundColor: theme.white,
    marginHorizontal: 16,
    marginVertical: 8,
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
    width: undefined, // Remove fixed width if present
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.white,
    width: '100%', // Add full width
  },
  modalContent: {
    flex: 1,
    padding: 16,
    width: '100%', // Add full width
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.accent,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '500',
  },
  ownerStoreContainer: {
    backgroundColor: theme.white,
    margin: 16,
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
  ownerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  ownerInfo: {
    flex: 1,
  },
  ownerName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
  },
  ownerEmail: {
    fontSize: 14,
    color: theme.secondary,
  },
  storesList: {
    marginTop: 8,
  },
  storeItem: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.surface,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
    marginBottom: 4,
  },
  storeAddress: {
    fontSize: 14,
    color: theme.secondary,
  },
  noStoresText: {
    fontSize: 14,
    color: theme.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.white,
  },
  modalContent: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primary,
  },
  closeButton: {
    padding: 8,
  },
  ownerSelector: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectorLabel: {
    fontSize: 12,
    color: theme.secondary,
    marginBottom: 4,
  },
  selectedOwnerText: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '500',
  },
  placeholderText: {
    fontSize: 16,
    color: theme.secondary,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: theme.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginTop: 8,
    marginBottom: 16,
  },
  hoursContainer: {
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
    marginBottom: 8,
  },
  hoursInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
  },
  timeSeparator: {
    fontSize: 16,
    color: theme.secondary,
  },
  submitButton: {
    backgroundColor: theme.accent,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  submitButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.7,
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  ownerOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  ownerOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
    marginBottom: 4,
  },
  ownerOptionEmail: {
    fontSize: 14,
    color: theme.secondary,
  },
  pickerCloseButton: {
    backgroundColor: theme.accent,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  pickerCloseButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: theme.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  dropdownContainer: {
    marginBottom: 16,
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    backgroundColor: theme.white,
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
  selectedDropdownItem: {
    backgroundColor: theme.surface,
  },
  selectedText: {
    color: theme.primary,
    fontSize: 16,
  },
  placeholderText: {
    color: theme.secondary,
    fontSize: 16,
  },
  ownerName: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '500',
  },
  ownerEmail: {
    fontSize: 14,
    color: theme.secondary,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: theme.primary,
    backgroundColor: theme.white,
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
    textAlign: 'center',
  },
  imageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  imageInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeImageButton: {
    padding: 8,
  },
  addImageButton: {
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addImageButtonText: {
    color: theme.accent,
    fontWeight: '500',
  },
  imageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  imageInput: {
    flex: 1,
    marginBottom: 0,
  },
  addImageButton: {
    backgroundColor: theme.surface,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addImageButtonText: {
    color: theme.accent,
    fontWeight: '500',
  },
  storeActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  editButton: {
    borderColor: theme.accent,
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
  },
  deleteButton: {
    borderColor: theme.error,
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  storeItem: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    backgroundColor: theme.surface,
  },

});