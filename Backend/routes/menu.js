// routes/menu.js
const express = require('express');
const MenuItem = require('../models/Items.js');

const router = express.Router();

// Create a Menu Item
router.post('/', async (req, res) => {
  const { name, price, description, category } = req.body;
  try {
    const newItem = await MenuItem.create({ name, price, description, category });
    res.status(201).json(newItem);
  } catch (error) {
    res.status(400).json({ message: 'Error creating menu item', error });
  }
});

// Get All Menu Items
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find();
    res.json(items);
  } catch (error) {
    res.status(400).json({ message: 'Error fetching menu items', error });
  }
});

// Update a Menu Item
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, description, category } = req.body;

  try {
    const updatedItem = await MenuItem.findByIdAndUpdate(id, { name, price, description, category }, { new: true });
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ message: 'Error updating menu item', error });
  }
});

// Delete a Menu Item
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await MenuItem.findByIdAndDelete(id);
    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting menu item', error });
  }
});

module.exports = router;
