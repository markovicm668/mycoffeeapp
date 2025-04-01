import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from './styles';
import { FontAwesome } from '@expo/vector-icons';

export default function OrderTimeline ({ order }) {
  const statusSteps = [
    'pending',
    'preparing',
    'ready',
    'delivered',
  ];

  const getStatusIndex = (status) => {
    return statusSteps.indexOf(status?.toLowerCase() || 'pending');
  };

  const currentStatusIndex = getStatusIndex(order?.status);

  return (
    <View style={timelineStyles.timeline}>
      {statusSteps.map((status, index) => (
        <View key={status} style={timelineStyles.stepContainer}>
          <View style={timelineStyles.stepIndicatorContainer}>
            {index > 0 && (
              <View
                style={[
                  timelineStyles.line,
                  index <= currentStatusIndex + 1
                    ? timelineStyles.activeLine
                    : timelineStyles.inactiveLine,
                ]}
              />
            )}
            <View
              style={[
                timelineStyles.stepIndicator,
                index < currentStatusIndex
                  ? timelineStyles.completedIndicator
                  : index === currentStatusIndex
                    ? timelineStyles.currentIndicator
                    : timelineStyles.upcomingIndicator,
              ]}
            >
              {index < currentStatusIndex && (
                <FontAwesome
                  name="check"
                  size={14}
                  color={theme.white}
                />
              )}
            </View>
            {index < statusSteps.length - 1 && (
              <View
                style={[
                  timelineStyles.line,
                  timelineStyles.bottomLine,
                  index < currentStatusIndex
                    ? timelineStyles.activeLine
                    : timelineStyles.inactiveLine,
                ]}
              />
            )}
          </View>
          <Text style={timelineStyles.stepLabel}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Text>
        </View>
      ))}
    </View>
  );
};

const timelineStyles = StyleSheet.create({
  timeline: {
    flexDirection: 'row', // Changed to row for horizontal timeline
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Align items to the start for better label positioning
    paddingVertical: 20,
  },
  stepContainer: {
    flex: 1, // Allow steps to take equal width
    alignItems: 'center',
  },
  stepIndicatorContainer: {
    alignItems: 'center',
  },
  stepIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.border,
    backgroundColor: theme.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  currentIndicator: {
    borderColor: theme.primary,
    backgroundColor: theme.primary,
  },
  completedIndicator: {
    borderColor: theme.success,
    backgroundColor: theme.success,
  },
  upcomingIndicator: {
    borderColor: theme.border,
    backgroundColor: theme.white,
  },
  line: {
    height: 20, // Adjust line height as needed
    width: 2,
    backgroundColor: theme.border,
    position: 'absolute',
    top: 0,
    left: 11, // Center the line with the indicator
  },
  bottomLine: {
    top: 22, // Start below the indicator
    height: 20, // Extend downwards
  },
  activeLine: {
    backgroundColor: theme.primary,
  },
  inactiveLine: {
    backgroundColor: theme.border,
  },
  stepLabel: {
    fontSize: 14,
    color: theme.secondary,
    textAlign: 'center',
    marginTop: 8,
    width: 80, // Adjust width for label wrapping if needed
  },
});
