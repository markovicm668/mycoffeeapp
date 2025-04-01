  export const validateStoreHours = (hours) => {
    const errors = {};
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
      if (!hours[day]) {
        errors[day] = 'Hours required for all days';
        return;
      }
  
      const { open, close } = hours[day];
  
      if (!timeRegex.test(open) || !timeRegex.test(close)) {
        errors[day] = 'Invalid time format (use HH:MM)';
        return;
      }
  
      const [openHour, openMin] = open.split(':').map(Number);
      const [closeHour, closeMin] = close.split(':').map(Number);
      
      if ((closeHour * 60 + closeMin) <= (openHour * 60 + openMin)) {
        errors[day] = 'Closing time must be after opening time';
      }
    });
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  export const validateProfile = (profileData) => {
    const errors = {};
    
    if (!profileData.email?.trim()) {
      errors.email = 'Email is required';
    }
  
    if (!profileData.password?.trim()) {
      errors.password = 'Password is required';
    }
    
    if (!profileData.name?.trim()) {
      errors.name = 'Name is required';
    }
  
    // Make phone number validation optional and less strict
    if (profileData.phoneNumber && profileData.phoneNumber.trim()) {
      // Accept any string of numbers with optional plus sign, spaces, or dashes
      // that's at least 6 digits long
      const phoneRegex = /^[\d\s\-\+]{6,}$/;
      if (!phoneRegex.test(profileData.phoneNumber.trim())) {
        errors.phoneNumber = 'Please enter a valid phone number';
      }
    }
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  export const validateOrder = (orderData) => {
    const errors = {};
  
    // Skip validation if item has no sizes array
    if (!orderData.items[0].sizes?.length) {
      return {
        isValid: true,
        errors: {}
      };
    }
  
    // Validate if sizes exist but no selection made
    orderData.items.forEach((item, index) => {
      if (item.sizes?.length > 0 && !item.selectedSize) {
        errors[`item${index}`] = `Size selection required for ${item.name}`;
      }
    });
  
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  export const formatValidationErrors = (errors = {}) => {
    return Object.entries(errors).map(([field, message]) => ({
      field,
      message,
      key: field.replace(/\./g, '_')
    }));
  };