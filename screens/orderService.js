// orderService.js
export const calculateEstimatedTime = (items) => {
  // Base preparation time in minutes
  const BASE_TIME = 5;

  // Additional time per item type
  const ITEM_TIMES = {
    coffee: 2,    // 2 minutes for coffee drinks
    food: 5,      // 5 minutes for food items
    dessert: 3,   // 3 minutes for desserts
    default: 2    // Default time for other items
  };

  // Calculate total preparation time
  const totalTime = items.reduce((total, item) => {
    const itemTime = ITEM_TIMES[item.category] || ITEM_TIMES.default;
    return total + (itemTime * item.quantity);
  }, BASE_TIME);

  // Add current time to get estimated completion time
  const estimatedTime = new Date();
  estimatedTime.setMinutes(estimatedTime.getMinutes() + totalTime);

  return {
    estimatedTime,
    preparationMinutes: totalTime
  };
};

export const validateOrderItems = (items, store) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new Error('Order must contain at least one item');
  }

  if (!store) {
    throw new Error('Store is required');
  }

  // Validate store hours
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = days[now.getDay()];
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

  const storeHours = store.hours?.[day];
  if (!storeHours || currentTime < storeHours.open || currentTime > storeHours.close) {
    throw new Error('Store is currently closed');
  }

  // Validate items
  items.forEach(item => {
    if (!item.menuItemId || !item.quantity || item.quantity < 1) {
      throw new Error('Invalid item in order');
    }

    if (item.size && !['Small', 'Medium', 'Large'].includes(item.size)) {
      throw new Error('Invalid size selected');
    }
  });

  return true;
};

export const formatOrderResponse = (order) => {
  return {
    ...order.toObject(),
    statusHistory: order.statusHistory || [],
    timeRemaining: calculateTimeRemaining(order.estimatedReadyTime),
    isLate: isOrderLate(order)
  };
};

const calculateTimeRemaining = (estimatedTime) => {
  if (!estimatedTime) return null;

  const now = new Date();
  const estimated = new Date(estimatedTime);
  const diffInMinutes = Math.round((estimated - now) / 60000);

  return diffInMinutes > 0 ? diffInMinutes : 0;
};

const isOrderLate = (order) => {
  if (!order.estimatedReadyTime || order.status === 'delivered' || order.status === 'cancelled') {
    return false;
  }

  const now = new Date();
  const estimated = new Date(order.estimatedReadyTime);
  return now > estimated;
};