import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from './styles';

const CompactOrderHistory = ({ orders }) => {
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'delivered':
        return { backgroundColor: theme.surface, color: theme.secondary };
      case 'cancelled':
        return { backgroundColor: '#FEE2E2', color: theme.error };
      default:
        return { backgroundColor: '#E1F0FF', color: theme.accent };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Previous Orders</Text>
      {orders.map((order) => (
        <View key={order._id} style={styles.orderCard}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>#{order._id.slice(-4)}</Text>
            <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
          </View>

          <View style={styles.orderDetails}>
            <View style={styles.orderInfo}>
              <Text style={styles.itemCount}>
                {order.items.reduce((acc, item) => acc + (item.quantity || 1), 0)} items
              </Text>
              <Text style={styles.itemNames}>
                {order.items.map(item => item.name).slice(0, 2).join(', ')}
                {order.items.length > 2 ? '...' : ''}
              </Text>
            </View>

            <View style={styles.orderStatus}>
              <Text style={styles.orderAmount}>
                {order.totalAmount.toFixed(2)} RSD
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusStyle(order.status).backgroundColor }
              ]}>
                <Text style={[
                  styles.statusText,
                  { color: getStatusStyle(order.status).color }
                ]}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 12,
  },
  orderCard: {
    backgroundColor: theme.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.primary,
  },
  orderDate: {
    fontSize: 13,
    color: theme.secondary,
  },
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfo: {
    flex: 1,
  },
  itemCount: {
    fontSize: 14,
    color: theme.primary,
    marginBottom: 2,
  },
  itemNames: {
    fontSize: 13,
    color: theme.secondary,
  },
  orderStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.primary,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default CompactOrderHistory;