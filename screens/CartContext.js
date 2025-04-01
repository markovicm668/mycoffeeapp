import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems(prevItems => [...prevItems, item]);
  };

  const removeFromCart = (itemId) => {
    setCartItems(prevItems => prevItems.filter(item => item.orderId !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const updateCartItemQuantity = (itemId, quantity) => {
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.orderId === itemId 
          ? { ...item, quantity: quantity }
          : item
      )
    );
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      clearCart,
      updateCartItemQuantity
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}