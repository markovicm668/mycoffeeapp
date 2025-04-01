
// SafeImage.js - A more robust image component to prevent Android crashes
import React, { useState } from 'react';
import { Image, View } from 'react-native';

const SafeImage = ({ source, style, fallbackColor = '#ccc', ...props }) => {
  const [hasError, setHasError] = useState(false);
  
  // Determine a safe source object
  let safeSource = null;
  
  try {
    // Handle different source formats safely
    if (typeof source === 'string') {
      // If direct string URL provided
      safeSource = { uri: source };
    } 
    else if (source && typeof source === 'object') {
      if (source.uri) {
        // If { uri: ... } object provided, ensure uri is a string
        safeSource = { ...source, uri: String(source.uri) };
      } 
      else if (source.default) {
        // For require('./image.jpg') sources
        safeSource = source;
      }
    }
    
    // If still no valid source, use undefined (will show fallback)
    if (!safeSource || (safeSource.uri && !safeSource.uri.trim())) {
      safeSource = undefined;
    }
  } catch (error) {
    console.error('Error processing image source:', error);
    safeSource = undefined;
  }
  
  // Show fallback colored box if error or no valid source
  if (hasError || !safeSource) {
    return <View style={[style, { backgroundColor: fallbackColor }]} />;
  }
  
  return (
    <Image
      source={safeSource}
      style={style}
      {...props}
      onError={(e) => {
        console.log('Image failed to load:', e.nativeEvent.error);
        setHasError(true);
        if (props.onError) props.onError(e);
      }}
    />
  );
};

export default SafeImage;