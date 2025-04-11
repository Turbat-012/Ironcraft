import { StyleSheet, Platform, Dimensions } from 'react-native';
import { scaledSize } from '@/lib/textScaling';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const globalStyles = StyleSheet.create({
  // Container Styles
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  contentContainer: {
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: Platform.OS === 'ios' ? 90 : 80,
  },

   // Contractor Styles
  contractorList: {
    flex: 1,
  },
  contractorListContent: {
    paddingBottom: 16,
  },
  contractorItem: {
    padding: 16,
    backgroundColor: '#333333',
    marginBottom: 8,
    borderRadius: 5,
  },
  selectedContractorItem: {
    backgroundColor: '#0061FF',
  },
  contractorName: {
    color: 'white',
    fontSize: 16,
  },

  // Message Styles
  messageContainer: {
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  messageLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: '#333333',
    color: 'white',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    minHeight: Platform.OS === 'ios' ? 80 : 100,
    maxHeight: Platform.OS === 'ios' ? 100 : 120,
    textAlignVertical: 'top',
    textAlign: Platform.OS === 'ios' ? 'left' : 'left'
  },

  // Company Styles
  companyItem: {
    backgroundColor: '#333',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
  },
  companyName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  companyDetails: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 4,
  },
  companiesList: {
      padding: 16,
    },
    companyOption: {
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    selectedCompanyOption: {
      backgroundColor: '#0A84FF',
    },
    companyOptionText: {
      color: 'white',
      fontSize: 16,
    },
    selectedCompanyOptionText: {
      fontWeight: 'bold',
    },

  // Header Styles
  header: {
    height: 250,
    overflow: 'hidden',
  },
  headerTitle: {
    fontSize: scaledSize(18),
    color: '#ffffff',
    fontWeight: '600',
  },

  // Text Styles
  title: {
    fontSize: scaledSize(24),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: scaledSize(18),
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  bodyText: {
    fontSize: scaledSize(16),
    color: 'white',
  },
  label: {
    fontSize: scaledSize(14),
    color: '#999',
    marginBottom: 8,
  },
  errorText: {
    color: '#F75555',
    fontSize: scaledSize(12),
    marginTop: 4,
  },

  // Input Styles
  input: {
    backgroundColor: '#333333',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: scaledSize(16),
    marginBottom: 16,
    height: Platform.select({ ios: 44, android: 48 }),
  },
  textArea: {
    backgroundColor: '#333333',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: scaledSize(16),
    minHeight: Platform.select({ ios: 80, android: 100 }),
    textAlignVertical: 'top',
  },
  searchInput: {
    backgroundColor: '#333333',
    color: 'white',
    borderRadius: 5,
    padding: 12,
    fontSize: scaledSize(16),
    height: 44,
  },

  // Card Styles
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: scaledSize(18),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },

  // List Item Styles
  listItem: {
    backgroundColor: '#333',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedListItem: {
    backgroundColor: '#0061ff',
  },
  listContainer: {
    paddingBottom: 20,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    width: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: 'white',
    fontSize: scaledSize(18),
    fontWeight: 'bold',
  },

  // Button Styles
  button: {
    backgroundColor: '#0061ff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: Platform.select({ ios: 48, android: 52 }),
  },
  buttonText: {
    color: 'white',
    fontSize: scaledSize(16),
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#333',
  },
  dangerButton: {
    backgroundColor: '#F75555',
  },

  // Form Styles
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: scaledSize(14),
    color: 'white',
    marginBottom: 8,
  },

  // Loading States
  loadingText: {
    color: 'white',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Status Indicators
  success: {
    color: '#4CAF50',
  },
  warning: {
    color: '#FFA500',
  },
  error: {
    color: '#F75555',
  },

  // Date Picker Styles
  dateSection: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  dateSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    color: 'white',
    fontSize: scaledSize(16),
    fontWeight: 'bold',
  },
  dateValue: {
    color: '#0061ff',
    fontSize: scaledSize(16),
  },
  datePickerContainer: {
      marginBottom: 20,
  },
  datePicker: {
      marginTop: 10,
      height: Platform.OS === 'ios' ? 120 : 40,
      backgroundColor: '#444',
  },

  // Jobsite Style
  jobsiteItem: {
      backgroundColor: '#444',
      padding: 16,
      marginBottom: 10,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
  },
  jobsiteName: {
      color: 'white',
      fontSize: 18,
  },
  jobsiteAddress: {
      color: 'white',
      fontSize: 14,
  },

  // Button Style
  selectorButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectorButtonText: {
    color: 'white',
    fontSize: 16,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 20,
  },
});