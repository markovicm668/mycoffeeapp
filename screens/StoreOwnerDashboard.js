import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Alert,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from './styles';
import BASE_URL from './config';

import {
  LineChart,
  BarChart,
  PieChart,
  ContributionGraph
} from 'react-native-chart-kit';

const API_URL = `${BASE_URL}/api`;
const { width } = Dimensions.get('window');

const StatCard = ({ title, value, subtitle, icon, onPress }) => (
  <TouchableOpacity
    style={styles.statCard}
    onPress={onPress}
    disabled={!onPress}
  >
    <Text style={styles.statTitle}>{title}</Text>
    <FontAwesome name={icon} size={24} color={theme.accent} style={styles.statIcon} />
    <Text style={styles.statValue}>{value}</Text>
    {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
  </TouchableOpacity>
);

const timeFilters = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'month', label: 'This Month' },
  { id: 'year', label: 'This Year' }
];

const StoreOwnerDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState('today');
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState({
    totalOrders: 0,
    dailyStats: {
      totalRevenue: 0,
      averageOrderValue: 0,
      completedOrders: 0
    },
    today: {
      orders: 0,
      revenue: 0,
      completed: 0
    },
    activeOrders: [],
    topSellingItems: [],
    // Sample data for charts - would be replaced with real data from API
    salesTrend: [
      { x: 'Mon', y: 2500 },
      { x: 'Tue', y: 3000 },
      { x: 'Wed', y: 2800 },
      { x: 'Thu', y: 3500 },
      { x: 'Fri', y: 4000 },
      { x: 'Sat', y: 4200 },
      { x: 'Sun', y: 3800 }
    ],
    ordersByHour: [
      { x: '8AM', y: 5 },
      { x: '10AM', y: 12 },
      { x: '12PM', y: 25 },
      { x: '2PM', y: 18 },
      { x: '4PM', y: 15 },
      { x: '6PM', y: 22 },
      { x: '8PM', y: 14 }
    ],
    categoryBreakdown: [
      { x: "Coffee", y: 35 },
      { x: "Tea", y: 20 },
      { x: "Pastries", y: 15 },
      { x: "Sandwiches", y: 10 },
      { x: "Other", y: 20 }
    ]
  });

  const categoryColorsRef = useRef({});

  const fetchDashboardData = useCallback(async (filter = timeFilter) => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_URL}/store/dashboard?timeFilter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${global.userToken}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();

      // Initialize with defaults in case data is missing fields
      setDashboardData(prevData => ({
        totalOrders: data.totalOrders || 0,
        dailyStats: {
          totalRevenue: data.dailyStats?.totalRevenue || 0,
          averageOrderValue: data.dailyStats?.averageOrderValue || 0,
          completedOrders: data.dailyStats?.completedOrders || 0
        },
        today: {
          orders: data.today?.orders || 0,
          revenue: data.today?.revenue || 0,
          completed: data.today?.completed || 0
        },
        activeOrders: data.activeOrders || 0,
        topSellingItems: data.topSellingItems || 0,
        salesTrend: data.salesTrend || prevData.salesTrend, // Assuming your API now provides salesTrend
        ordersByHour: data.ordersByHour || prevData.ordersByHour, // Update with API data
        categoryBreakdown: data.categoryBreakdown || prevData.categoryBreakdown // Update with API data
      }));

    } catch (error) {
      console.error('Dashboard error:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleTimeFilterChange = (filter) => {
    setTimeFilter(filter);
    fetchDashboardData(filter);
  };

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {timeFilters.map(filter => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterTab,
              timeFilter === filter.id && styles.activeFilterTab
            ]}
            onPress={() => handleTimeFilterChange(filter.id)}
          >
            <Text
              style={[
                styles.filterTabText,
                timeFilter === filter.id && styles.activeFilterTabText
              ]}
            >
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderActiveOrders = () => (
    <View style={styles.chartSection}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Orders</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <FontAwesome name="chevron-right" size={12} color={theme.accent} />
        </TouchableOpacity>
      </View>
      {dashboardData.activeOrders?.length > 0 ? (
        dashboardData.activeOrders.map((order) => (
          <View key={order._id} style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderNumber}>#{order._id.slice(-4)}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                <Text style={styles.statusText}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.orderItems}>
              {order.items.map((item, index) => (
                <Text key={index} style={styles.orderItem}>
                  {item.quantity}x {item.name}
                </Text>
              ))}
            </View>
            <View style={styles.orderFooter}>
              <Text style={styles.orderTotal}>
                Total: {order.totalAmount?.toFixed(2)} RSD
              </Text>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Update Status</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No active orders</Text>
      )}
    </View>
  );

  const renderSalesChart = () => (
    <View style={styles.chartSection}>
      <Text style={styles.sectionTitle}>Sales Trend</Text>
      <LineChart
        data={{
          labels: dashboardData.salesTrend.map(item => item.x),
          datasets: [{
            data: dashboardData.salesTrend.map(item => item.y)
          }]
        }}
        width={width - 60}
        height={220}
        chartConfig={{
          backgroundColor: theme.white,
          backgroundGradientFrom: theme.white,
          backgroundGradientTo: theme.white,
          decimalPlaces: 0,
          color: () => theme.accent,
          labelColor: () => theme.secondary,
        }}
        bezier
        style={{
          marginVertical: 8,
          borderRadius: 8
        }}
      />
    </View>
  );

  const renderPeakHoursChart = () => {
    return (
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Peak Hours</Text>

        <View style={styles.chartContainer}>
          <BarChart
            data={{
              // Show every other label to prevent crowding
              labels: dashboardData.ordersByHour.map((item, index) =>
                index % 2 === 0 ? item.x : ''
              ),
              datasets: [{
                data: dashboardData.ordersByHour.map(item => item.y)
              }]
            }}
            width={width - 40}
            height={220}
            chartConfig={{
              backgroundColor: theme.white,
              backgroundGradientFrom: theme.white,
              backgroundGradientTo: theme.white,
              decimalPlaces: 0,
              color: () => theme.accent,
              labelColor: () => theme.secondary,
              barPercentage: 0.7,
              propsForLabels: {
                fontSize: 10
              },
              formatYLabel: (value) => Math.round(value).toString(),
            }}
            style={{
              marginVertical: 8,
              borderRadius: 8,
              marginLeft: -59, // Subtle shift to improve positioning
            }}
            fromZero={true}
            showValuesOnTopOfBars={true}
            withInnerLines={true}
            segments={5}
          />
        </View>

        <Text style={styles.chartCaption}>
          Orders distribution throughout business hours (8AM-10PM)
        </Text>
      </View>
    );
  };

  const renderCategoryBreakdown = () => {
    dashboardData.categoryBreakdown.forEach(item => {
      if (!categoryColorsRef.current[item.x]) {
        categoryColorsRef.current[item.x] = generateCoffeeColor();
      }
    });

    return (
      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Product Categories</Text>
        <PieChart
          data={dashboardData.categoryBreakdown.map(item => ({
            name: `${item.x}`, // Add count to the name in legend
            value: item.y, // Use actual count
            color: categoryColorsRef.current[item.x],
            legendFontColor: theme.secondary,
            legendFontSize: 12
          }))}
          width={width - 60}
          height={220}
          chartConfig={{
            backgroundColor: theme.white,
            backgroundGradientFrom: theme.white,
            backgroundGradientTo: theme.white,
            color: () => theme.accent,
          }}
          accessor="value"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute // Use absolute values instead of calculating percentages
        />
      </View>
    );
  };

  const generateCoffeeColor = () => {
    // Coffee colors are in the brown spectrum
    const hue = 25 + Math.floor(Math.random() * 15); // Brown hues (25-40)
    const saturation = 60 + Math.floor(Math.random() * 30); // Medium-high saturation (60-90%)
    const lightness = 20 + Math.floor(Math.random() * 40); // Medium darkness (20-60%)

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const renderTopSellingItems = () => (
    <View style={styles.chartSection}>
      <Text style={styles.sectionTitle}>Top Selling Items</Text>
      {dashboardData.topSellingItems?.length > 0 ? (
        dashboardData.topSellingItems.map((item, index) => {
          // Calculate percentage relative to top item (max 95% to prevent overflow)
          const maxPercentage = 95;
          const percentage = dashboardData.topSellingItems[0]?.count
            ? Math.min(maxPercentage, (item.count / dashboardData.topSellingItems[0].count) * 100)
            : 0;

          return (
            <View key={index} style={styles.topItemRow}>
              <View style={styles.topItemRank}>
                <Text style={styles.topItemRankText}>{index + 1}</Text>
              </View>

              <View style={styles.topItemContent}>
                {/* Item name and count */}
                <View style={styles.topItemHeader}>
                  <Text style={styles.topItemName} numberOfLines={1} ellipsizeMode="tail">
                    {item.name || 'Unnamed Item'}
                  </Text>
                  <Text style={styles.topItemCount}>
                    {item.count} sold
                  </Text>
                </View>

                {/* Progress bar container - fixed width */}
                <View style={styles.progressBarContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${percentage}%` }
                    ]}
                  />
                </View>

                {/* Revenue amount */}
                <Text style={styles.topItemRevenue}>
                  {item.revenue.toFixed(0)} RSD
                </Text>
              </View>
            </View>
          );
        })
      ) : (
        <Text style={styles.emptyText}>No sales data available</Text>
      )}
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <FontAwesome
          name="dashboard"
          size={18}
          color={activeTab === 'overview' ? theme.accent : theme.secondary}
        />
        <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
          Overview
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'sales' && styles.activeTab]}
        onPress={() => setActiveTab('sales')}
      >
        <FontAwesome
          name="line-chart"
          size={18}
          color={activeTab === 'sales' ? theme.accent : theme.secondary}
        />
        <Text style={[styles.tabText, activeTab === 'sales' && styles.activeTabText]}>
          Sales
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'orders' && styles.activeTab]}
        onPress={() => setActiveTab('orders')}
      >
        <FontAwesome
          name="list"
          size={18}
          color={activeTab === 'orders' ? theme.accent : theme.secondary}
        />
        <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
          Orders
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderTabs()}
      {renderFilterTabs()}

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.accent]}
          />
        }
      >
        {activeTab === 'overview' && (
          <>
            {/* Today's Stats */}
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>
                {timeFilter === 'today' ? "Today's Stats" :
                  timeFilter === 'week' ? "This Week's Stats" :
                    timeFilter === 'month' ? "This Month's Stats" : "This Year's Stats"}
              </Text>
              <View style={styles.statsContainer}>
                <StatCard
                  title="Orders"
                  value={dashboardData.today.orders.toString()}
                  icon="shopping-bag"
                  onPress={() => setActiveTab('orders')}
                />
                <StatCard
                  title="Revenue"
                  value={`${dashboardData.today.revenue.toFixed(2)} RSD`}
                  icon="money"
                  onPress={() => setActiveTab('sales')}
                />
                <StatCard
                  title="Avg. Order"
                  value={`${(dashboardData.today.revenue / (dashboardData.today.orders || 1)).toFixed(2)} RSD`}
                  icon="calculator"
                />
                <StatCard
                  title="Active Orders"
                  value={(dashboardData.activeOrders?.length || 0).toString()}
                  icon="clock-o"
                />
              </View>
            </View>

            {/* All Time Stats */}
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>All Time Performance</Text>
              <View style={styles.statsContainer}>
                <StatCard
                  title="Total Orders"
                  value={dashboardData.totalOrders.toString()}
                  icon="history"
                />
                <StatCard
                  title="Total Revenue"
                  value={`${dashboardData.dailyStats.totalRevenue.toFixed(2)} RSD`}
                  icon="line-chart"
                />
                <StatCard
                  title="Avg. Order"
                  value={`${dashboardData.dailyStats.averageOrderValue.toFixed(2)} RSD`}
                  icon="calculator"
                />
                <StatCard
                  title="Completed"
                  value={dashboardData.dailyStats.completedOrders.toString()}
                  subtitle={`${((dashboardData.dailyStats.completedOrders /
                    (dashboardData.totalOrders || 1)) * 100).toFixed(1)}%`}
                  icon="check-circle"
                />
              </View>
            </View>

            {/* Charts Overview */}
            {renderSalesChart()}
            {renderCategoryBreakdown()}
          </>
        )}

        {activeTab === 'sales' && (
          <>
            {renderSalesChart()}
            {renderPeakHoursChart()}
            {renderCategoryBreakdown()}
            {renderTopSellingItems()}
          </>
        )}

        {activeTab === 'orders' && (
          <>
            {renderActiveOrders()}
            <View style={styles.chartSection}>
              <Text style={styles.sectionTitle}>Order Metrics</Text>
              <View style={styles.statsContainer}>
                <StatCard
                  title="Avg. Preparation"
                  value="12 min"
                  icon="hourglass-half"
                />
                <StatCard
                  title="Order Accuracy"
                  value="98.5%"
                  icon="check"
                />
                <StatCard
                  title="Peak Time"
                  value="12-2PM"
                  icon="clock-o"
                />
                <StatCard
                  title="Cancellations"
                  value="2.3%"
                  icon="times-circle"
                />
              </View>
            </View>
            {renderPeakHoursChart()}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return theme.warning;
    case 'preparing': return theme.accent;
    case 'ready': return theme.success;
    default: return theme.secondary;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.accent,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statTitle: {
    fontSize: 16,
    color: theme.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.primary,
    marginTop: 4,
  },
  statSubtitle: {
    fontSize: 14,
    color: theme.secondary,
    marginTop: 4,
  },
  statIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    color: theme.accent,
  },
  topItemRow: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  topItemRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topItemRankText: {
    color: theme.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  topItemContent: {
    flex: 1,
  },
  topItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 6,
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.accent,
    borderRadius: 4,
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
    marginBottom: 4,
  },
  topItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topItemCount: {
    fontSize: 14,
    color: theme.secondary,
  },
  topItemRevenue: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.accent,
  },
  topItemPercentage: {
    height: 4,
    backgroundColor: theme.border,
    width: '100%',
    borderRadius: 2,
    marginTop: 8,
  },
  percentageBar: {
    height: 4,
    backgroundColor: theme.accent,
    borderRadius: 2,
  },
  orderCard: {
    backgroundColor: theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '500',
  },
  orderItems: {
    marginBottom: 8,
  },
  orderItem: {
    fontSize: 15,
    color: theme.primary,
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.accent,
  },
  actionButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionButtonText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '500',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.secondary,
    fontSize: 16,
    paddingVertical: 16,
  },
  chartSection: {
    backgroundColor: theme.white,
    margin: 16,
    borderRadius: 16,
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
  filterContainer: {
    backgroundColor: theme.white,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: theme.surface,
  },
  activeFilterTab: {
    backgroundColor: theme.accent,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.secondary,
  },
  activeFilterTabText: {
    color: theme.white,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    flexDirection: 'row',
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.accent,
  },
  tabText: {
    fontSize: 14,
    color: theme.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.accent,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 250,
    marginVertical: 10,
    width: '100%',
    overflow: 'hidden',
  },
  pieChartContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendContainer: {
    width: '40%',
    paddingLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: theme.secondary,
  },

  chartPlaceholder: {
    height: 200,
    backgroundColor: theme.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: theme.secondary,
    marginBottom: 16,
  },
  chartCaption: {
    fontSize: 12,
    color: theme.secondary,
    textAlign: 'center',
    marginTop: 4
  }
});

export default StoreOwnerDashboard;