const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const SALT_ROUNDS = 10;
const storeUtils = require('../screens/storeUtils');
const { configureReanimatedLogger } = require('react-native-reanimated');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d';

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      throw new Error('Authorization token required');
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log("Auth middleware: User not found for token"); // Log if user not found
      throw new Error('User not found');
    }
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error); // Log auth errors
    return res.status(401).json({ error: 'Please authenticate' });
  } finally {
  }
};

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee-shop', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected successfully'))
  .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'coffee_shop'],
    default: 'user',
    required: true
  },
  stores: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

// const MenuItem = mongoose.model('MenuItem', {
//   name: {
//     type: String,
//     required: true
//   },
//   description: {
//     type: String,
//     default: ''
//   },
//   price: {
//     type: Number,
//     required: true
//   },
//   imageUrl: {
//     type: String,
//     default: '' // Default empty string if no image provided
//   },
//   category: {
//     type: String,
//     default: 'coffee'
//   },
//   sizes: [{
//     name: String,
//     priceModifier: Number
//   }],
//   extras: [{
//     name: String,
//     price: Number
//   }],
//   isAvailable: {
//     type: Boolean,
//     default: true
//   },
//   store: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Store',
//     required: true
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// Update MenuItem schema
const MenuItem = mongoose.model('MenuItem', {
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  imageUrl: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    default: 'coffee'
  },
  sizes: [{
    name: String,
    priceModifier: Number
  }],
  extras: [{
    name: String,
    price: Number
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  position: {  // Add this field
    type: Number,
    default: 9999  // Default to a high number so new items appear at the end
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update StoreCategory model
const StoreCategory = mongoose.model('StoreCategory', {
  name: {
    type: String,
    required: true
  },
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  position: {  // Add this field
    type: Number,
    default: 1  // Start from 1 instead of 9999
  }
});

const storeHoursSchema = new mongoose.Schema({
  open: String,
  close: String,
  isClosed: { type: Boolean, default: false }
});

const Store = mongoose.model('Store', {
  name: { type: String, required: true },
  address: { type: String, required: true },
  images: [{
    url: String,
    caption: String
  }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }
  },
  hours: {
    monday: storeHoursSchema,
    tuesday: storeHoursSchema,
    wednesday: storeHoursSchema,
    thursday: storeHoursSchema,
    friday: storeHoursSchema,
    saturday: storeHoursSchema,
    sunday: storeHoursSchema
  },
  phone: String,
  isActive: { type: Boolean, default: true }
});

Store.collection.createIndex({ location: '2dsphere' });

// const StoreCategory = mongoose.model('StoreCategory', {
//   name: { type: String, required: true },
//   store: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Store',
//     required: true
//   }
// });

const Order = mongoose.model('Order', {
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  store: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
  items: [{
    menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    size: String,
    extras: [String],
    specialInstructions: String,
    finalPrice: Number
  }],
  status: {
    type: String,
    enum: ['pending', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  totalAmount: { type: Number, required: true, min: 0 },
  createdAt: { type: Date, default: Date.now },
  estimatedReadyTime: { type: Date },
  actualReadyTime: { type: Date }
});


// Add mongoose model for device tokens
const UserDevice = mongoose.model('UserDevice', {
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  token: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  deviceInfo: {
    type: Object
  }
});

// Add endpoint to save device token
app.post('/api/users/device-token', auth, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find existing token or create new one
    let userDevice = await UserDevice.findOne({
      user: req.user._id,
      token
    });

    if (!userDevice) {
      userDevice = new UserDevice({
        user: req.user._id,
        token,
        deviceInfo: req.body.deviceInfo || {}
      });
      await userDevice.save();
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving device token:', error);
    res.status(500).json({ error: 'Failed to save device token' });
  }
});

// Add notification sending function
const sendNotification = async (userId, title, body, data) => {
  try {
    // Find user's devices
    const userDevices = await UserDevice.find({ user: userId });

    if (!userDevices || userDevices.length === 0) {
      return false;
    }

    // Prepare messages for Expo push service
    const messages = userDevices.map(device => ({
      to: device.token,
      sound: 'default',
      title,
      body,
      data
    }));

    // Send notifications using Expo's API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages)
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

const checkActiveOrders = async (userId) => {
  const activeOrders = await Order.find({
    user: userId,
    status: { $in: ['pending', 'preparing', 'ready'] }
  });
  return activeOrders.length > 0;
};

const formatOrderResponse = (order) => {
  if (!order) return null;

  const now = new Date();
  const estimated = order.estimatedReadyTime ? new Date(order.estimatedReadyTime) : null;
  const timeRemaining = estimated ? Math.max(0, Math.round((estimated - now) / 60000)) : null;

  return {
    ...order.toObject(),
    timeRemaining,
    isLate: estimated ? now > estimated : false
  };
};

app.get('/api/stores/mine', auth, async (req, res) => {

  try {

    if (!req.user) {
      return res.status(401).json({ error: 'User authentication failed or user not found in req' }); // Explicit 401 if req.user is missing
    }

    const userStoresArray = req.user.stores; // Directly access stores array

    if (!Array.isArray(userStoresArray)) {
      return res.status(500).json({ error: 'User stores data is not in the expected array format' }); // 500 if not an array
    }

    const stores = await Store.find({ _id: { $in: userStoresArray }, isActive: true }); // Query - isActive:true back in

    res.json(stores); // Send the store array as JSON

  } catch (error) {
    console.error("Error in VERY VERY SIMPLE /api/stores/mine:", error);
    console.error("Error stack in VERY VERY SIMPLE /api/stores/mine:", error.stack);
    res.status(500).json({ error: 'Error fetching stores (very simple function)' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name, phoneNumber, role } = req.body;
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create new user with hashed password
    const user = new User({
      email,
      password: hashedPassword,  // Store the hashed password
      name,
      phoneNumber,
      role: role || 'user'
    });

    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user - make email case insensitive
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/auth/me', auth, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        phoneNumber: req.user.phoneNumber
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/stores/:id', async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json(store);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching store' });
  }
});

app.get('/api/stores', async (req, res) => {
  try {
    const { lat, lng, radius } = req.query;

    let query = { isActive: true };

    if (lat && lng && radius) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      };
    }

    const stores = await Store.find(query);
    res.json(stores);
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Error fetching stores' });
  }
});

app.post('/api/stores', auth, async (req, res) => {
  try {

    const { name, address, location, hours, phone, isActive } = req.body;

    // Validate required fields
    if (!name || !address || !location) {
      console.log('Validation failed:', { name, address, location });
      return res.status(400).json({ error: 'Name, address, and location are required' });
    }

    const store = new Store({
      name,
      address,
      location,
      hours,
      phone,
      isActive: true
    });

    await store.save();
    res.status(201).json(store);
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update existing menu fetch endpoint to sort by position
app.get('/api/menu', auth, async (req, res) => {
  try {
    let query = {};

    // If store ID is provided in query params, filter by that store
    if (req.query.storeId) {
      query.store = req.query.storeId;
    }
    // If coffee shop owner and no store ID provided, show only their stores
    else if (req.user.role === 'coffee_shop') {
      query.store = { $in: req.user.stores || [] };
    }

    // Sort by position
    const menuItems = await MenuItem.find(query).sort({ position: 1 });
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching menu items' });
  }
});

// Update categories endpoint to sort by position
app.get('/api/categories', auth, async (req, res) => {
  try {
    const query = req.user.role === 'coffee_shop'
      ? { store: { $in: req.user.stores || [] } }
      : {};

    const categories = await StoreCategory.find(query).sort({ position: 1 });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching categories' });
  }
});

// New endpoint for reordering menu items
app.post('/api/menu/reorder', auth, async (req, res) => {
  try {
    if (req.user.role !== 'coffee_shop' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'Items must be an array' });
    }

    // Process each item in the array
    const operations = items.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { position: item.position }
      }
    }));

    // Perform bulk update
    await MenuItem.bulkWrite(operations);

    res.json({ success: true, message: 'Menu items reordered successfully' });
  } catch (error) {
    console.error('Error reordering menu items:', error);
    res.status(500).json({ error: 'Failed to reorder menu items' });
  }
});

// New endpoint for reordering categories
app.post('/api/categories/reorder', auth, async (req, res) => {
  try {
    if (req.user.role !== 'coffee_shop' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Categories must be an array' });
    }

    // Process each category in the array
    const operations = categories.map(category => ({
      updateOne: {
        filter: { _id: category.id },
        update: { position: category.position }
      }
    }));

    // Perform bulk update
    await StoreCategory.bulkWrite(operations);

    res.json({ success: true, message: 'Categories reordered successfully' });
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

// Update category
app.patch('/api/categories/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Category name is required' });

    const category = await StoreCategory.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );

    if (!category) return res.status(404).json({ error: 'Category not found' });

    res.json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error updating category' });
  }
});

// Delete category
app.delete('/api/categories/:id', auth, async (req, res) => {
  try {
    const category = await StoreCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting category' });
  }
});

app.post('/api/menu', auth, async (req, res) => {
  try {
    if (req.user.role !== 'coffee_shop') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { store, name, price, sizes, extras, imageUrl, description, category, isAvailable } = req.body;

    if (!store || !req.user.stores.includes(store)) {
      return res.status(400).json({ error: 'Invalid store selection' });
    }

    const menuItem = new MenuItem({
      name,
      price,
      sizes,
      extras,
      imageUrl,
      description,
      category,
      isAvailable,
      store
    });

    await menuItem.save();

    res.status(201).json(menuItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/menu/batch', auth, async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'Updates must be an array' });
    }

    const results = await Promise.all(updates.map(async ({ id, ...updateData }) => {
      // Find the menu item
      const menuItem = await MenuItem.findById(id);
      if (!menuItem) return { id, success: false, error: 'Item not found' };

      // Verify ownership
      if (req.user.role !== 'admin') {
        const userStores = Array.isArray(req.user.stores) ? req.user.stores : [];
        const menuItemStoreId = menuItem.store.toString();

        if (!userStores.some(storeId => storeId.toString() === menuItemStoreId)) {
          return { id, success: false, error: 'Unauthorized' };
        }
      }

      // Apply updates
      Object.assign(menuItem, updateData);
      await menuItem.save();
      return { id, success: true };
    }));

    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to server.js - Batch update category for all items
app.post('/api/menu/batch-category', auth, async (req, res) => {
  try {
    const { oldCategory, newCategory, storeId } = req.body;

    if (!oldCategory || !newCategory || !storeId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify store ownership
    if (req.user.role !== 'admin' && (!req.user.stores || !req.user.stores.includes(storeId))) {
      return res.status(403).json({ error: 'Unauthorized to update items for this store' });
    }

    // Update all items at once
    const result = await MenuItem.updateMany(
      { category: oldCategory, store: storeId },
      { $set: { category: newCategory } }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} items`
    });
  } catch (error) {
    console.error('Batch category update error:', error);
    res.status(500).json({ error: 'Error updating items' });
  }
});

app.patch('/api/menu/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { store, name, price, sizes, extras, imageUrl, description, category, isAvailable } = req.body;

    // Find the menu item
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin') {
      const userStores = Array.isArray(req.user.stores) ? req.user.stores : [];
      const menuItemStoreId = menuItem.store.toString();

      if (!userStores.some(storeId => storeId.toString() === menuItemStoreId)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    // Update fields
    menuItem.name = name;
    menuItem.price = price;
    menuItem.sizes = sizes;
    menuItem.extras = extras;
    menuItem.imageUrl = imageUrl;
    menuItem.description = description;
    menuItem.category = category;
    menuItem.isAvailable = isAvailable;

    await menuItem.save();

    const updatedItem = await menuItem.save();
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/menu/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const menuItem = await MenuItem.findById(id);

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (req.user.role !== 'admin') {
      // For coffee shop owners, ensure they own the store
      const userStores = Array.isArray(req.user.stores) ? req.user.stores : [];

      // Convert both to strings and compare
      const menuItemStoreId = menuItem.store ? menuItem.store.toString() : null;

      if (userStores.length === 0 ||
        !userStores.some(storeId =>
          storeId.toString() === menuItemStoreId
        )) {
        return res.status(403).json({
          error: 'Unauthorized to delete this menu item',
          details: {
            userStores,
            menuItemStore: menuItemStoreId
          }
        });
      }
    }

    await MenuItem.deleteOne({ _id: id });


    res.json({
      message: 'Menu item disabled',
      menuItem
    });
  } catch (error) {
    console.log('menuItem');
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
});

app.post('/api/orders', auth, async (req, res) => {
  try {
    const { items, store, totalAmount } = req.body;

    // Check for active orders first
    const hasActiveOrders = await checkActiveOrders(req.user._id);
    if (hasActiveOrders) {
      return res.status(400).json({
        error: 'You have an active order in progress. Please wait for it to be completed before placing a new order.'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    if (!store) {
      return res.status(400).json({ error: 'Store is required' });
    }

    // Calculate estimated ready time
    const baseTime = 5;
    const perItemTime = 2;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const estimatedMinutes = baseTime + (perItemTime * totalItems);

    const estimatedReadyTime = new Date(Date.now() + estimatedMinutes * 60000);

    const order = new Order({
      user: req.user._id,
      store,
      items: items.map(item => ({
        menuItemId: item.menuItemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        size: item.size,
        extras: item.extras,
        specialInstructions: item.specialInstructions
      })),
      totalAmount,
      status: 'pending',
      estimatedReadyTime
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Error creating order' });
  }
});

app.get('/api/orders', auth, async (req, res) => {
  try {
    let query = {};

    // If user is a regular customer, show only their orders
    if (req.user.role === 'user') {
      query.user = req.user._id;
    }
    // If user is a coffee shop owner, show orders for their stores
    else if (req.user.role === 'coffee_shop' && req.user.stores) {
      query.store = { $in: req.user.stores };
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email')
      .populate('store', 'name address')
      .limit(50);

    const formattedOrders = orders.map(formatOrderResponse)
      .filter(order => order !== null);

    res.json(formattedOrders);
  } catch (error) {
    console.error('Server error fetching orders:', error);
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

app.patch('/api/orders/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'preparing', 'ready', 'delivered', 'cancelled'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Add new status to history
    order.statusHistory.push({
      status,
      timestamp: new Date()
    });

    // Update status
    order.status = status;

    // Set actualReadyTime if status is 'ready'
    if (status === 'ready') {
      order.actualReadyTime = new Date();
    }

    await order.save();

    // Send notification to user
    if (order.user) {
      const statusMessages = {
        preparing: "Your order is now being prepared!",
        ready: "Great news! Your order is ready for pickup.",
        delivered: "Your order has been delivered. Enjoy!",
        cancelled: "Your order has been cancelled."
      };

      if (statusMessages[status]) {
        await sendNotification(
          order.user,
          `Order #${order._id.toString().slice(-4)} Update`,
          statusMessages[status],
          { type: 'ORDER_UPDATE', orderId: order._id }
        );
      }
    }

    res.json(formatOrderResponse(order));
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Error updating order' });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByIdAndUpdate(
      id,
      { status: 'cancelled', updatedAt: Date.now() },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({ error: 'Error cancelling order' });
  }
});

app.patch('/api/users/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const allowedUpdates = ['name', 'phoneNumber'];
    const isValidOperation = Object.keys(updates).every(update =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates' });
    }

    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users/shop-owners', auth, authorize('admin'), async (req, res) => {
  try {
    const shopOwners = await User.find({
      role: 'coffee_shop'
    }).select('name email _id stores');

    res.json(shopOwners);
  } catch (error) {
    console.error('Error fetching shop owners:', error);
    res.status(500).json({ error: 'Failed to fetch shop owners' });
  }
});

app.post('/api/stores/create', auth, authorize('admin'), async (req, res) => {
  try {
    const { ownerId, ...storeData } = req.body;

    // Validate owner
    const owner = await User.findById(ownerId);
    if (!owner || owner.role !== 'coffee_shop') {
      return res.status(400).json({ error: 'Invalid store owner' });
    }

    // Create store
    const store = new Store({
      ...storeData,
      owner: ownerId
    });

    await store.save();

    // Add store to owner's stores array
    owner.stores = owner.stores || [];
    owner.stores.push(store._id);
    await owner.save();

    res.status(201).json(store);
  } catch (error) {
    console.error('Error creating store:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/active', auth, async (req, res) => {
  try {
    const query = {
      user: req.user._id,
      status: { $in: ['pending', 'preparing', 'ready'] }
    };

    const activeOrder = await Order.findOne(query)
      .sort({ createdAt: -1 })
      .populate('store', 'name address');

    if (!activeOrder) {
      return res.json(null);
    }

    res.json(formatOrderResponse(activeOrder));
  } catch (error) {
    console.error('Error fetching active order:', error);
    res.status(500).json({ error: 'Error fetching active order' });
  }
});

app.get('/api/store/dashboard', auth, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (req.user.role !== 'coffee_shop') {
      return res.status(403).json({ error: 'Only coffee shop owners can access this' });
    }

    // Safely check if stores exists and is an array with items
    if (!Array.isArray(req.user.stores) || req.user.stores.length === 0) {
      return res.status(403).json({ error: 'No stores found for this user' });
    }

    const storeIds = req.user.stores;
    const today = new Date();

    // Handle time filter from request
    const timeFilter = req.query.timeFilter || 'today';
    let startDate, endDate;

    // Set date range based on timeFilter
    switch (timeFilter) {
      case 'today':
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        endDate = new Date(today);
        break;
      case 'month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        endDate = new Date(today);
        break;
      case 'year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        endDate = new Date(today);
        break;
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    }

    // For backward compatibility with existing code
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Use try-catch for each database operation
    let deliveredOrders, allOrders, todayAllOrders, todayDeliveredOrders, activeOrders, topSellingItems;
    let salesTrendData, ordersByHourData, categoryBreakdownData;

    try {
      // Get all delivered orders (for revenue)
      deliveredOrders = await Order.find({
        store: { $in: storeIds },
        status: 'delivered'
      });

      // Get all orders (for counts)
      allOrders = await Order.find({
        store: { $in: storeIds }
      });

      // Today's orders
      todayAllOrders = await Order.find({
        store: { $in: storeIds },
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      });

      // Today's revenue
      todayDeliveredOrders = await Order.find({
        store: { $in: storeIds },
        status: 'delivered',
        createdAt: { $gte: startOfDay, $lt: endOfDay }
      });

      // Active orders
      activeOrders = await Order.find({
        store: { $in: storeIds },
        status: { $in: ['pending', 'preparing', 'ready'] }
      })
        .sort({ createdAt: -1 })
        .limit(5);

      // Top selling items
      topSellingItems = await Order.aggregate([
        { $match: { store: { $in: storeIds }, status: 'delivered' } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            count: { $sum: '$items.quantity' },
            revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      // CHART DATA GENERATION

      // 1. Sales Trend - Get sales by day of week for the selected time period
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const periodOrders = await Order.find({
        store: { $in: storeIds },
        status: 'delivered',
        createdAt: { $gte: startDate, $lte: endDate }
      });

      // Initialize days with 0 sales
      const dailySales = {};
      daysOfWeek.forEach(day => { dailySales[day] = 0 });

      // Sum up sales by day of week
      periodOrders.forEach(order => {
        const dayOfWeek = daysOfWeek[new Date(order.createdAt).getDay()];
        dailySales[dayOfWeek] += order.totalAmount || 0;
      });

      // Format for chart
      salesTrendData = Object.keys(dailySales).map(day => ({
        x: day,
        y: Math.round(dailySales[day])
      }));

      // 2. Orders By Hour - Get order distribution by hour of day
      const hourCounts = {};
      // Initialize hours with 0 orders
      for (let i = 0; i < 24; i++) {
        const hourLabel = i < 12 ? `${i || 12}AM` : `${i === 12 ? 12 : i - 12}PM`;
        hourCounts[hourLabel] = 0;
      }

      // Count orders by hour
      periodOrders.forEach(order => {
        const hour = new Date(order.createdAt).getHours();
        const hourLabel = hour < 12 ? `${hour || 12}AM` : `${hour === 12 ? 12 : hour - 12}PM`;
        hourCounts[hourLabel]++;
      });

      // Format for chart - only include business hours (8AM-10PM)
      const businessHours = [
        '8AM', '9AM', '10AM', '11AM', '12PM',
        '1PM', '2PM', '3PM', '4PM', '5PM',
        '6PM', '7PM', '8PM', '9PM', '10PM'
      ];

      ordersByHourData = businessHours.map(hour => ({
        x: hour,
        y: hourCounts[hour] || 0
      }));

      // 3. Category Breakdown - Get sales by menu item category
      // First, get all menu items to map them to categories
      const menuItems = await MenuItem.find({ store: { $in: storeIds } });
      const menuItemMap = {};
      menuItems.forEach(item => {
        menuItemMap[item._id.toString()] = item.category || 'Uncategorized';
      });

      // Count items by category
      const categoryCounts = {};
      let totalItems = 0;

      // Process all delivered order items
      for (const order of periodOrders) {
        for (const item of order.items) {
          // Try to find category by menuItemId
          let category = 'Other';
          if (item.menuItemId) {
            category = menuItemMap[item.menuItemId.toString()] || 'Other';
          }

          // Count items
          categoryCounts[category] = (categoryCounts[category] || 0) + (item.quantity || 1);
          totalItems += (item.quantity || 1);
        }
      }

      // Convert to percentages for pie chart
      categoryBreakdownData = Object.keys(categoryCounts).map(category => ({
        x: category,
        y: Math.round((categoryCounts[category] / Math.max(1, totalItems)) * 100)
      }));

      // Sort by percentage descending
      categoryBreakdownData.sort((a, b) => b.y - a.y);

      // Limit to top 5 categories and group the rest as "Other"
      if (categoryBreakdownData.length > 5) {
        const topCategories = categoryBreakdownData.slice(0, 4);
        const otherCategories = categoryBreakdownData.slice(4);
        const otherPercentage = otherCategories.reduce((sum, item) => sum + item.y, 0);

        categoryBreakdownData = [
          ...topCategories,
          { x: 'Other', y: otherPercentage }
        ];
      }

    } catch (dbError) {
      console.error('Database query error:', dbError);
      return res.status(500).json({ error: 'Database query failed' });
    }

    // Calculate stats
    const todayStats = {
      orders: todayAllOrders.length,
      revenue: todayDeliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    };

    const totalOrders = allOrders.length;
    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const averageOrderValue = deliveredOrders.length > 0 ? totalRevenue / deliveredOrders.length : 0;
    const completedOrders = deliveredOrders.length;

    // Format and send response
    res.json({
      totalOrders,
      dailyStats: {
        totalRevenue,
        averageOrderValue,
        completedOrders,
      },
      today: {
        orders: todayStats.orders,
        revenue: todayStats.revenue
      },
      activeOrders,
      topSellingItems: topSellingItems.map(item => ({
        name: item._id,
        count: item.count,
        revenue: item.revenue
      })),
      // Add chart data
      salesTrend: salesTrendData,
      ordersByHour: ordersByHourData,
      categoryBreakdown: categoryBreakdownData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

app.post('/api/categories', auth, async (req, res) => {
  try {
    const { name } = req.body;

    // Find highest current position value for this user's categories
    const highestPositionCategory = await StoreCategory.findOne({
      store: { $in: req.user.stores }
    }).sort({ position: -1 });

    // Set position as (highest current position + 1) or 1 if no categories exist
    const position = highestPositionCategory ? highestPositionCategory.position + 1 : 1;

    const category = new StoreCategory({
      name,
      store: req.user.stores[0],
      position
    });

    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: 'Error creating category' });
  }
});

app.patch('/api/stores/:id', auth, authorize('admin'), async (req, res) => {
  try {
    const store = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/stores/:id', auth, authorize('admin'), async (req, res) => {
  const storeId = req.params.id;
  if (!storeId || typeof storeId !== 'string') {
    return res.status(400).json({ error: 'Invalid store ID' });
  }
  try {
    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    // Remove store reference from owner's stores array
    await User.updateMany(
      { stores: store._id },
      { $pull: { stores: store._id } }
    );

    // Delete all menu items associated with the store
    await MenuItem.deleteMany({ store: store._id });

    // Delete all orders associated with the store
    await Order.deleteMany({ store: store._id });

    // Delete the store itself
    await Store.findByIdAndDelete(req.params.id);

    res.json({ message: 'Store deleted successfully' });
  } catch (error) {
    console.error('Error deleting store:', error);
    res.status(500).json({ error: 'Failed to delete store' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});