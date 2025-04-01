import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const theme = {
  primary: '#1A1A1A',    // Dark text
  secondary: '#757575',  // Secondary text
  accent: '#8B4513',     // Brown accent color
  white: '#FFFFFF',      // White
  border: '#E0E0E0',     // Light gray border
  surface: '#F5F5F5',    // Light background
  background: '#ffffff',
  success: '#008489', // Airbnb teal
  warning: '#FFB400',
  error: '#FF5A5F', // Airbnb red
};

const typography = {
  primary: Platform.select({
    ios: '-apple-system',
    android: 'Roboto'
  }),
};

const styles = StyleSheet.create({
  shopCard: {
    backgroundColor: theme.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  shopImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  shopContent: {
    padding: 16,
  },
  shopName: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shopAddress: {
    fontSize: 16,
    color: theme.secondary,
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: theme.white,
  },
  dropdownSelectedText: {
    fontSize: 16,
    color: theme.primary,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: theme.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  ownerOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  ownerOptionText: {
    fontSize: 16,
    color: theme.primary,
  },
  selectedOwnerOption: {
    color: theme.accent,
    fontWeight: '600',
  },
  modalCloseButton: {
    marginTop: 16,
    backgroundColor: theme.accent,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 16,
    color: theme.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  statusFilterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  statusFilterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
    marginRight: 8,
  },
  selectedStatusFilter: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  statusFilterText: {
    color: theme.secondary,
    fontSize: 14,
  },
  selectedStatusFilterText: {
    color: theme.white,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  statusButton: {
    flex: 1,
    backgroundColor: theme.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusButtonText: {
    color: theme.white,
    fontWeight: '500',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: theme.error,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: theme.white,
    fontWeight: '500',
  },
  customerName: {
    fontSize: 14,
    color: theme.secondary,
    marginBottom: 4,
  },
  roleContainer: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    color: theme.secondary,
    marginBottom: 8,
  },
  roleButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.border,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedRoleButton: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  roleButtonText: {
    color: theme.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedRoleButtonText: {
    color: theme.white,
  },
  shopCard: {
    backgroundColor: theme.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: theme.surface,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  shopInfo: {
    flex: 1,
  },
  shopName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 14,
    color: theme.secondary,
    marginBottom: 8,
  },
  shopDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  hoursText: {
    fontSize: 14,
    color: theme.secondary,
  },
  shopList: {
    padding: 16,
  },
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    fontSize: 24,
    fontWeight: '600',
    color: theme.primary,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: theme.white,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 16,
  },
  list: {
    paddingHorizontal: 24,
  },
  // Menu Item Styles
  menuItem: {
    backgroundColor: theme.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: 'hidden',
  },
  menuItemContent: {
    padding: 16,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    flex: 1,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.accent,
  },
  menuItemDescription: {
    fontSize: 14,
    color: theme.secondary,
    lineHeight: 20,
  },
  // Form Styles
  formContainer: {
    backgroundColor: theme.white,
    padding: 24,
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
    color: theme.primary,
    backgroundColor: theme.surface,
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    backgroundColor: theme.accent,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
  // Order Items
  orderItem: {
    backgroundColor: theme.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  orderItemContent: {
    padding: 16,
  },
  orderItems: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 15,
    color: theme.primary,
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: theme.secondary,
    marginHorizontal: 12,
  },
  // Status Styles
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: theme.white,
    fontSize: 12,
    fontWeight: '500',
  },
  // Totals
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
  },
  // Utility Styles
  emptyText: {
    textAlign: 'center',
    color: theme.secondary,
    fontSize: 16,
    paddingVertical: 24,
  },
  errorText: {
    color: theme.error,
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 15,
  },
  statusButton: {
    width: '100%',
    padding: 15,
    borderRadius: 5,
    marginVertical: 5,
    alignItems: 'center',
  },
  statusButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cancelButton: {
    width: '100%',
    padding: 15,
    borderRadius: 5,
    marginTop: 10,
    backgroundColor: '#ccc',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  storeItem: {
    backgroundColor: theme.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
  },
  storeStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  storeAddress: {
    fontSize: 14,
    color: theme.secondary,
    marginBottom: 16,
  },
  storeActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    backgroundColor: theme.surface,
  },
  orderButton: {
    backgroundColor: theme.accent,
    paddingHorizontal: 16,
  },
  storeActionText: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.accent,
  },
  hoursContainer: {
    marginBottom: 16,
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.primary,
    marginBottom: 8,
  },
  hoursInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeInput: {
    flex: 1,
    marginBottom: 0,
  },
  timeSeparator: {
    marginHorizontal: 8,
    color: theme.secondary,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  mapContainer: {
    height: 300,
    width: width,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  map: {
    flex: 1,
  },
  callout: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  calloutAddress: {
    fontSize: 14,
    color: theme.secondary,
    marginBottom: 10,
  },
  calloutButton: {
    backgroundColor: theme.accent,
    padding: 8,
    borderRadius: 5,
    alignItems: 'center',
  },
  calloutButtonText: {
    color: theme.white,
    fontWeight: 'bold',
  },// Replace the tabContainer styles in styles.js with:
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.white,
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'ios' ? 50 : 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: theme.accent,
  },
  tabText: {
    fontSize: 16,
    color: theme.secondary,
    fontWeight: '500',
  },
  activeTabText: {
    color: theme.accent,
    fontWeight: '600',
  }, orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  orderDate: {
    color: theme.secondary,
    fontSize: 14,
    marginTop: 8,
  },
  customizableTag: {
    color: theme.accent,
    fontSize: 12,
    marginTop: 4,
  },
  itemCustomization: {
    color: theme.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  menuItemsList: {
    marginTop: 16,
    marginBottom: 24,
  },
  menuItemCard: {
    backgroundColor: theme.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  menuItemForm: {
    marginBottom: 20,
  },
  removeButton: {
    backgroundColor: theme.error,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  removeButtonText: {
    color: theme.white,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: theme.accent,
  },
  refreshButton: {
    marginTop: 20,
    backgroundColor: theme.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  }
});

const tabStyles = {
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: theme.white,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    marginBottom: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: theme.accent,
  },
  tabText: {
    fontSize: 16,
    color: theme.secondary,
  },
  activeTabText: {
    color: theme.accent,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  ordersList: {
    padding: 20,
    paddingBottom: 100, // Add padding for logout button
  },
};

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: theme.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.primary,
    marginBottom: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  selectedOption: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  optionText: {
    color: theme.primary,
  },
  instructionsInput: {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: theme.primary,
  },
  quantity: {
    fontSize: 18,
    color: theme.primary,
    minWidth: 30,
    textAlign: 'center',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: theme.border,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.primary,
  },
  totalPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.accent,
  },
  addButton: {
    backgroundColor: theme.accent,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: theme.white,
    fontSize: 16,
    fontWeight: '600',
  },
});

const timelineStyles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: theme.white,
    borderRadius: 8,
    marginVertical: 8,
  },
  stepContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  line: {
    width: 30,
    height: 2,
    backgroundColor: theme.border,
    marginRight: 8,
  },
  completedLine: {
    backgroundColor: theme.accent,
  },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.white,
    borderWidth: 2,
    borderColor: theme.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completedDot: {
    backgroundColor: theme.accent,
    borderColor: theme.accent,
  },
  currentDot: {
    borderColor: theme.accent,
    backgroundColor: theme.accent,
  },
  stepContent: {
    flex: 1,
  },
  stepLabel: {
    fontSize: 16,
    color: theme.secondary,
  },
  completedStepLabel: {
    color: theme.primary,
    fontWeight: '500',
  },
  currentStepLabel: {
    color: theme.accent,
    fontWeight: '600',
  },
  estimatedTime: {
    fontSize: 14,
    color: theme.accent,
    marginTop: 4,
  },
});

export { styles, theme, typography, tabStyles, modalStyles, timelineStyles };