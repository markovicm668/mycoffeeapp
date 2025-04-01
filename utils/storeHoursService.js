export const validateHours = (open, close) => {
  const [openHour, openMin] = open.split(':').map(Number);
  const [closeHour, closeMin] = close.split(':').map(Number);
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  // Handle overnight hours (e.g. 22:00 - 02:00)
  if (closeMinutes < openMinutes) {
    closeMinutes += 24 * 60; // Add 24 hours
  }

  return closeMinutes > openMinutes;
};

export const validateStoreHours = (hours) => {
  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

  if (!hours || typeof hours !== 'object') {
    throw new Error('Store hours must be provided');
  }

  DAYS.forEach(day => {
    if (!hours[day]) {
      throw new Error(`Hours for ${day} are required`);
    }

    const { open, close, isClosed } = hours[day];
    if (isClosed) return;

    if (!open || !close) {
      throw new Error(`Both open and close times are required for ${day}`);
    }

    if (!timeRegex.test(open) || !timeRegex.test(close)) {
      throw new Error(`Invalid time format for ${day}. Use HH:MM format`);
    }

    // Convert times to comparable values
    const [openHour, openMin] = open.split(':').map(Number);
    const [closeHour, closeMin] = close.split(':').map(Number);
    const openValue = openHour * 60 + openMin;
    const closeValue = closeHour * 60 + closeMin;

    if (closeValue <= openValue) {
      throw new Error(`Closing time must be after opening time for ${day}`);
    }
  });

  return true;
};

export const validateOpeningHours = (open, close) => {
  if (!open || !close) return false;
  
  const [openHour, openMin] = open.split(':').map(Number);
  const [closeHour, closeMin] = close.split(':').map(Number);
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  return closeMinutes > openMinutes;
};

