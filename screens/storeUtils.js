const validateStoreHours = (hours) => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
    if (!hours || typeof hours !== 'object') {
      return { isValid: false, error: 'Store hours must be provided' };
    }
  
    for (const day of days) {
      if (!hours[day]) {
        return { isValid: false, error: `Hours for ${day} are required` };
      }
  
      const { open, close } = hours[day];
  
      if (!open || !close) {
        return { isValid: false, error: `Both open and close times are required for ${day}` };
      }
  
      if (!timeRegex.test(open) || !timeRegex.test(close)) {
        return { isValid: false, error: `Invalid time format for ${day}` };
      }
  
      // Convert times to comparable values
      const [openHour, openMin] = open.split(':').map(Number);
      const [closeHour, closeMin] = close.split(':').map(Number);
      const openValue = openHour * 60 + openMin;
      const closeValue = closeHour * 60 + closeMin;
  
      if (closeValue <= openValue) {
        return { isValid: false, error: `Closing time must be after opening time for ${day}` };
      }
    }
  
    return { isValid: true };
  };
  
  const getStoreStatus = (hours, checkTime = new Date()) => {
    if (!hours) {
      return { 
        isOpen: false, 
        message: 'Hours not available',
        nextOpening: null
      };
    }
  
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const day = days[checkTime.getDay()];
    const currentTime = checkTime.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  
    const todayHours = hours[day];
    if (!todayHours?.open || !todayHours?.close) {
      return { 
        isOpen: false, 
        message: 'Closed today',
        nextOpening: getNextOpeningTime(hours, checkTime)
      };
    }
  
    const isOpen = currentTime >= todayHours.open && currentTime < todayHours.close;
  
    return {
      isOpen,
      message: isOpen ? 'Open' : 'Closed',
      hours: `${formatTime(todayHours.open)} - ${formatTime(todayHours.close)}`,
      nextOpening: isOpen ? null : getNextOpeningTime(hours, checkTime)
    };
  };
  
  const getNextOpeningTime = (hours, fromTime) => {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let checkDate = new Date(fromTime);
    let daysChecked = 0;
  
    while (daysChecked < 7) {
      const dayName = days[checkDate.getDay()];
      const dayHours = hours[dayName];
  
      if (dayHours?.open) {
        const [openHour, openMin] = dayHours.open.split(':');
        const openingTime = new Date(checkDate);
        openingTime.setHours(parseInt(openHour, 10), parseInt(openMin, 10), 0);
  
        if (daysChecked === 0 && openingTime > fromTime) {
          return {
            date: openingTime,
            day: dayName,
            time: dayHours.open,
            isToday: true
          };
        } else if (daysChecked > 0) {
          return {
            date: openingTime,
            day: dayName,
            time: dayHours.open,
            isToday: false
          };
        }
      }
  
      checkDate.setDate(checkDate.getDate() + 1);
      daysChecked++;
    }
  
    return null;
  };
  
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };
  
  module.exports = {
    validateStoreHours,
    getStoreStatus,
    getNextOpeningTime,
    formatTime
  };