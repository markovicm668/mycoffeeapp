import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
  ScrollView,
  Alert,
  StatusBar
} from 'react-native';
import { theme } from './styles';
import OrderTimeline from './OrderTimeline';
import CompactOrderHistory from './CompactOrderHistory';
import BASE_URL from './config';

const API_URL = `${BASE_URL}/api`;

export default function ActiveOrderScreen({ navigation }) {
  const [activeOrder, setActiveOrder] = useState(null);
  const [previousOrders, setPreviousOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      // Fetch active order
      const activeResponse = await fetch(`${API_URL}/orders/active`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`
        }
      });

      // Fetch all orders for history
      const allOrdersResponse = await fetch(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`
        }
      });

      if (!activeResponse.ok || !allOrdersResponse.ok) {
        throw new Error('Failed to fetch orders');
      }

      const activeData = await activeResponse.json();
      const allOrders = await allOrdersResponse.json();

      setActiveOrder(activeData);

      // Filter and sort previous orders
      const previousOrdersList = allOrders
        .filter(order =>
          order.status === 'delivered' ||
          order.status === 'cancelled'
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5); // Show only last 5 orders

      setPreviousOrders(previousOrdersList);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderOrderDetails = () => {
    if (!activeOrder) return null;

    return (
      <View style={styles.orderContainer}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>
            Order #{activeOrder._id?.slice(-4)}
          </Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(activeOrder.status) }
          ]}>
            <Text style={styles.statusText}>
              {activeOrder.status?.charAt(0).toUpperCase() + activeOrder.status?.slice(1)}
            </Text>
          </View>
        </View>

        <OrderTimeline order={activeOrder} />

        <View style={styles.itemsContainer}>
          {activeOrder.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.size && (
                  <Text style={styles.itemDetail}>Size: {item.size}</Text>
                )}
                {item.extras?.length > 0 && (
                  <Text style={styles.itemDetail}>
                    Extras: {item.extras.join(', ')}
                  </Text>
                )}
              </View>
              <View style={styles.itemPricing}>
                <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                <Text style={styles.itemPrice}>
                  {(item.price).toFixed(2)} RSD
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>
            {activeOrder.totalAmount?.toFixed(2)} RSD
          </Text>
        </View>

        {activeOrder.estimatedReadyTime && (
          <Text style={styles.estimatedTime}>
            Ready around: {new Date(activeOrder.estimatedReadyTime).toLocaleTimeString()}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.header}>
        <Text style={styles.title}>My Order</Text>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.accent]}
          />
        }
      >
        {activeOrder ? (
          renderOrderDetails()
        ) : (
          <View style={styles.noOrderContainer}>
            <Text style={styles.noOrderText}>
              No active orders
            </Text>
          </View>
        )}

        {previousOrders.length > 0 && (
          <CompactOrderHistory orders={previousOrders} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return theme.warning;
    case 'preparing': return theme.success;
    case 'ready': return theme.primary;
    case 'delivered': return theme.secondary;
    case 'cancelled': return theme.error;
    default: return theme.border;
  }
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "white", // Changed from gray to white
    paddingTop: StatusBar.currentHeight
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 6, // Increased padding
    backgroundColor: theme.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 0,
    elevation: 3,
  },
  title: {
    fontSize: 28, // Increased font size
    fontWeight: '600',
    color: theme.primary,
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  orderContainer: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '500',
  },
  itemsContainer: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: theme.primary,
    fontWeight: '500',
  },
  itemDetail: {
    fontSize: 14,
    color: theme.secondary,
    marginTop: 2,
  },
  itemPricing: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuantity: {
    fontSize: 14,
    color: theme.secondary,
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 16,
    color: theme.accent,
    fontWeight: '500',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.accent,
  },
  estimatedTime: {
    marginTop: 12,
    fontSize: 14,
    color: theme.accent,
    textAlign: 'center',
  },
  noOrderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  noOrderText: {
    fontSize: 16,
    color: theme.secondary,
  }
});