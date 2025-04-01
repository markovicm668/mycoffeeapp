import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import BASE_URL from './config';

const API_URL = `${BASE_URL}/api`;

const OrdersScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('active');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
    const pollInterval = setInterval(fetchOrders, 30000);
    return () => clearInterval(pollInterval);
  }, [activeFilter]);

  const filters = [
    { id: 'active', label: 'Active Orders', statuses: ['pending', 'preparing', 'ready'] },
    { id: 'all', label: 'All Orders' },
    { id: 'completed', label: 'Completed', statuses: ['delivered'] },
    { id: 'cancelled', label: 'Cancelled', statuses: ['cancelled'] }
  ];

  const storeStatus = {
    isOpen: true,  // This should come from your API
    activeOrders: orders.filter(o => ['pending', 'preparing', 'ready'].includes(o.status)).length
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.statusButtonHeader} onPress={() => {/* Implement Shop Status Toggle Logic Here */ }}>
          <View style={[styles.statusDot, {
            backgroundColor: storeStatus.isOpen ? theme.success : theme.error
          }]} />
          <Text style={styles.headerStatusText}>
            {storeStatus.isOpen ? 'Open' : 'Closed'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.activeOrdersHeader}>
          {storeStatus.activeOrders} Active Orders
        </Text>
        <TouchableOpacity style={styles.settingsButtonHeader} onPress={() => navigation.navigate('Profile')}>
          <FontAwesome name="cog" size={20} color={theme.secondary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`
        }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');

      let data = await response.json();

      const selectedFilter = filters.find(f => f.id === activeFilter);
      if (selectedFilter?.statuses) {
        data = data.filter(order => selectedFilter.statuses.includes(order.status));
      }

      // Sort orders - active orders first, then by date
      data.sort((a, b) => {
        const activeStatuses = ['pending', 'preparing', 'ready'];
        const aIsActive = activeStatuses.includes(a.status);
        const bIsActive = activeStatuses.includes(b.status);

        if (aIsActive && !bIsActive) return -1;
        if (!aIsActive && bIsActive) return 1;

        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const getOrderUrgency = (order) => {
    if (!order.estimatedReadyTime) return 'normal';

    const now = new Date();
    const estimatedTime = new Date(order.estimatedReadyTime);
    const timeDiff = (estimatedTime - now) / 1000 / 60; // minutes

    if (timeDiff < 0) return 'high';
    if (timeDiff < 15) return 'medium';
    return 'normal';
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      Alert.alert(
        'Update Order Status',
        `Mark order as ${newStatus}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              const response = await fetch(`${API_URL}/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                  'Authorization': `Bearer ${global.userToken}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
              });

              if (!response.ok) throw new Error('Failed to update order status');
              fetchOrders();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleCancelOrder = async (orderId) => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${API_URL}/orders/${orderId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${global.userToken}`
                },
              });

              if (!response.ok) throw new Error('Failed to cancel order');
              fetchOrders();
              Alert.alert('Success', 'Order cancelled successfully');
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          }
        }
      ]
    );
  };

  const renderOrderActions = (order) => {
    const isAuthorized = ['admin', 'coffee_shop'].includes(global.userRole);

    if (!isAuthorized) {
      return order.status === 'pending' ? (
        <View style={styles.orderActions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelOrder(order._id)}
          >
            <FontAwesome name="times" size={18} color="white" />
          </TouchableOpacity>
        </View>
      ) : null;
    }

    const nextStatus = {
      pending: 'preparing',
      preparing: 'ready',
      ready: 'delivered'
    };

    const statusButtonProps = {
      preparing: {
        icon: 'coffee',
        text: 'Start Preparing'
      },
      ready: {
        icon: 'check-circle',
        text: 'Mark Ready'
      },
      delivered: {
        icon: 'check',
        text: 'Mark Delivered'
      }
    };

    const nextStatusInfo = nextStatus[order.status];
    const buttonProps = nextStatusInfo ? statusButtonProps[nextStatusInfo] : null;

    return (
      <View style={styles.orderActions}>
        {buttonProps && (
          <TouchableOpacity
            style={styles.statusButton}
            onPress={() => handleStatusUpdate(order._id, nextStatus[order.status])}
          >
            <View style={styles.buttonContent}>
              <FontAwesome
                name={buttonProps.icon}
                size={16}
                color="white"
                style={styles.statusIcon}
              />
              <Text style={styles.statusButtonText}>{buttonProps.text}</Text>
            </View>
          </TouchableOpacity>
        )}
        {['pending', 'preparing'].includes(order.status) && (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelOrder(order._id)}
          >
            <View style={styles.buttonContent}>
              <FontAwesome name="times" size={16} color="white" style={styles.statusIcon} />
              <Text style={styles.cancelButtonText}>Cancel Order</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#FFB100';      // Warm yellow
      case 'preparing': return '#FF8C00';    // Deep orange
      case 'ready': return '#2ECC71';        // Bright green
      case 'delivered': return theme.secondary;
      case 'cancelled': return theme.error;
      default: return theme.border;
    }
  };


  const renderOrderItem = ({ item: order }) => {
    const urgency = getOrderUrgency(order);

    return (
      <View style={[
        styles.orderCard,
        urgency === 'high' && styles.urgentOrder,
        urgency === 'medium' && styles.mediumUrgencyOrder
      ]}>
        <View style={styles.orderHeaderCard}>
          <Text style={styles.orderIdCard}>
            Order #{order._id?.slice(-4)}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(order.status) }
          ]}>
            <Text style={styles.statusText}>
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.itemsListCard}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItemCard}>
              <Text style={styles.itemQuantityCard}>{item.quantity}x</Text>
              <View style={styles.itemDetailsCard}>
                <Text style={styles.itemNameCard}>{item.name}</Text>
                {item.size && (
                  <Text style={styles.itemCustomizationCard}>Size: {item.size}</Text>
                )}
                {item.extras?.length > 0 && (
                  <Text style={styles.itemCustomizationCard}>
                    Extras: {item.extras.join(', ')}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {order.estimatedReadyTime && (
          <Text style={[
            styles.estimatedTimeCard,
            urgency === 'high' && styles.urgentText
          ]}>
            Est. Ready:{' '}
            <Text style={styles.timeText}>
              {new Date(order.estimatedReadyTime).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </Text>
          </Text>
        )}

        {renderOrderActions(order)}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {isLoading ? (
        <ActivityIndicator size="large" color={theme.accent} style={styles.loader} />
      ) : (
        <>
          <FlatList
            data={orders}
            renderItem={renderOrderItem}
            keyExtractor={item => item._id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />}
            contentContainerStyle={[styles.listContent, orders.length === 0 && styles.emptyList]}
            ListEmptyComponent={<Text style={styles.emptyText}>No orders found</Text>}
          />
          <View style={styles.bottomFilters}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filters.map(filter => (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.filterChip, activeFilter === filter.id && styles.activeFilterChip]}
                  onPress={() => setActiveFilter(filter.id)}
                >
                  <Text style={[styles.filterChipText, activeFilter === filter.id && styles.activeFilterChipText]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  orderIdCard: {
    fontSize: 22, // Increased from 18
    fontWeight: '700',
    color: theme.primary,
  },

  itemNameCard: {
    fontSize: 18, // Increased from 16
    color: theme.primary,
    fontWeight: '600',
  },

  statusBadge: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: theme.accent,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  cancelButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: theme.error,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },

  cancelButtonText: {
    display: 'none', // Hide text, only show icon
  },

  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  statusButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 8,
  },

  statusIcon: {
    marginRight: 0, // Updated for cancel button icon centering
  },




  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: theme.white,
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // Keep for SafeArea on iOS
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    height: 80, // Fixed height for header - adjust if needed to ~10-15% of screen
    justifyContent: 'center', // Vertically center header content
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16, // Horizontal padding, reduce vertical if needed
  },

  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusButtonHeader: { // Style for the Shop Status button in header
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerStatusText: { // Style for "Open/Closed" text in header
    fontSize: 16,
    fontWeight: '500',
    color: theme.secondary,
    marginLeft: 8,
  },
  activeOrdersHeader: { // Style for "Active Orders" counter in header
    fontSize: 18, // Slightly larger font size
    fontWeight: 'bold',
    color: theme.primary,
  },
  settingsButtonHeader: { // Style for settings button in header
    padding: 8, // Add some padding around the icon for touch target
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  activeOrders: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.accent,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  activeFilterChip: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  filterChipText: {
    color: theme.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  activeFilterChipText: {
    color: theme.white,
  },
  bottomFilters: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderCard: {
    backgroundColor: 'white',
    marginHorizontal: 12, // Horizontal margin for card spacing
    marginVertical: 8,   // Vertical margin for card spacing
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  urgentOrder: { // Keep urgent/medium urgency styles
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  mediumUrgencyOrder: {
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  orderHeaderCard: { // Renamed from orderHeader
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemsListCard: { // Renamed from itemsList
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  orderItemCard: { // Renamed from orderItem
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemQuantityCard: { // Renamed from itemQuantity
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
    minWidth: 30,
  },
  itemDetailsCard: { // Renamed from itemDetails
    flex: 1,
  },
  itemCustomizationCard: { // Renamed from itemCustomization
    fontSize: 14, // Slightly larger customization text
    color: '#666',
    marginTop: 2,
  },
  estimatedTimeCard: { // Renamed from estimatedTime
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  itemsList: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
    minWidth: 30,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  itemCustomization: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  estimatedTimeCard: {
    fontSize: 18,
    color: theme.secondary,
    marginBottom: 16,
    marginTop: 12,
    width: '100%',
    textAlign: 'left',
    fontWeight: '500'
  },
  urgentText: {
    color: '#dc3545',
    fontWeight: '500',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.secondary,
    fontSize: 16,
    marginTop: 32
  },
  timeText: {
    fontWeight: '700',
    color: theme.primary
  }
});

export default OrdersScreen;