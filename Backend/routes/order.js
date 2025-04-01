// routes/order.js
const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/Items.js');

const router = express.Router();

// Create a new Order
router.post('/', async (req, res) => {
  const { items } = req.body;

  // Calculate total price based on items
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const order = await Order.create({ items, totalPrice });
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error creating order', error });
  }
});

// Get All Orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().populate('items.item');
    res.json(orders);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching orders', error });
  }
});

// Update Order Status
router.put('/:orderId/status', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body;

  try {
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Error updating order status', error });
  }
});

module.exports = router;
