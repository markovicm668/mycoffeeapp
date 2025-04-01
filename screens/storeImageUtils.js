// storeImageUtils.js - Updated with improved type checking for Android compatibility

const storeImagePlaceholders = [
  'https://images.unsplash.com/photo-1453614512568-c4024d13c247',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
  'https://images.unsplash.com/photo-1444418776041-9c7e33cc5a9c',
  'https://images.unsplash.com/photo-1521017432531-fbd92d768814'
];

export const getStorePlaceholderImage = (storeId) => {
  try {
    // Ensure we have a valid index even if storeId is not as expected
    const index = (storeId && typeof storeId === 'string') ? 
      Math.abs(storeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % storeImagePlaceholders.length 
      : Math.floor(Math.random() * storeImagePlaceholders.length);
    
    // Make sure we return a valid string
    return storeImagePlaceholders[index] || storeImagePlaceholders[0];
  } catch (error) {
    console.error('Error in getStorePlaceholderImage:', error);
    // Fallback to first placeholder if any error occurs
    return storeImagePlaceholders[0];
  }
};

export const getStoreImages = (store) => {
  // If store is falsy, return a single default image
  if (!store) return [storeImagePlaceholders[0]];
  
  // If store has images, ensure we properly extract URLs
  if (store.images && Array.isArray(store.images) && store.images.length > 0) {
    return store.images
      .filter(img => img && typeof img === 'object' && img.url)
      .map(img => String(img.url)); // Ensure URLs are strings
  }
  
  // Fallback to placeholder
  return [getStorePlaceholderImage(store._id)];
};