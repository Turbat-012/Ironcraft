import { 
  View, 
  Text, 
  Button, 
  Alert, 
  FlatList, 
  StyleSheet, 
  Platform, 
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { databases } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';
import CustomButton from '@/components/CustomButton';
import {config} from '@/constants/config';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { globalStyles } from '@/styles/globalStyles';

const Hour = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loggedHours, setLoggedHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedStart, setExpandedStart] = useState(false);
  const [expandedEnd, setExpandedEnd] = useState(false);
  interface Company {
    $id: string;
    name: string;
    abn?: string; // Add other properties as needed
  }
  
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);
  const BILLER_INFO = {
    name: "T&S Ironcraft Pty Ltd",
    abn: "38652947076",
    acn: "652 947 076",
    address: "A7/378 Beaufort St, Perth WA 6000",
    phone: "0455 535 378",
    bsb: "016370",
    account: "166957638"
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await databases.listDocuments(
        config.databaseId!,
        config.companiesCollectionId!
      );
      setCompanies(response.documents);
    } catch (error) {
      console.error('Error fetching companies:', error);
      Alert.alert('Error', 'Failed to fetch companies');
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setStartDate(currentDate);
    if (Platform.OS === 'android') {
      setExpandedStart(false);
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setEndDate(currentDate);
    if (Platform.OS === 'android') {
      setExpandedEnd(false);
    }
  };

  const fetchLoggedHours = async () => {
    setLoading(true);
    try {
      const startDateString = startDate.toISOString().split('T')[0] + 'T00:00:00.000+00:00';
      const endDateString = endDate.toISOString().split('T')[0] + 'T23:59:59.999+00:00';
  
      console.log('Truncated Start Date:', startDateString);
      console.log('Truncated End Date:', endDateString);
  
      const contractorsResponse = await databases.listDocuments(
        config.databaseId,
        config.contractorCollectionId
      );
  
      const contractors = contractorsResponse.documents;
      console.log('Contractors:', contractors);
  
      const loggedHoursPromises = contractors.map(async (contractor) => {
        const queryFilters = [
          Query.equal('contractor_id', contractor.contractor_id), // Match contractor_id field
          Query.greaterThanEqual('date', startDateString),
          Query.lessThanEqual('date', endDateString),
        ];
        console.log('Query Filters:', queryFilters);
  
        const hoursResponse = await databases.listDocuments(
          config.databaseId,
          config.hoursCollectionId,
          queryFilters
        );
  
        console.log(`Logs for contractor ${contractor.contractor_id}:`, hoursResponse.documents);
  
        // Calculate total hours for this contractor
        const totalHours = hoursResponse.documents.reduce((sum, log) => sum + log.hours, 0);
  
        return {
          contractor,
          hours: hoursResponse.documents, // Individual logs
          totalHours, // Total logged hours
        };
      });
  
      const loggedHoursData = await Promise.all(loggedHoursPromises);
      setLoggedHours(loggedHoursData);
    } catch (error) {
      console.error('Error fetching logged hours:', error);
      Alert.alert('Error', 'Failed to fetch logged hours.');
    } finally {
      setLoading(false);
    }
  };

  const generateInvoice = async () => {
    if (!selectedCompanyId) {
      Alert.alert('Error', 'Please select a company first');
      return;
    }

    setLoading(true);
    try {
      const company = companies.find(c => c.$id === selectedCompanyId);
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];

      // Get all jobsites for the selected company
      const jobsitesResponse = await databases.listDocuments(
        config.databaseId!,
        config.jobsiteCollectionId!,
        [Query.equal('companies_id', selectedCompanyId)]
      );

      let totalAmount = 0;
      const jobsiteData = [];

      // For each jobsite, get contractors and their hours
      for (const jobsite of jobsitesResponse.documents) {
        const hoursResponse = await databases.listDocuments(
          config.databaseId!,
          config.hoursCollectionId!,
          [
            Query.greaterThanEqual('date', startDateString),
            Query.lessThanEqual('date', endDateString),
            Query.equal('job_site_id', jobsite.$id)
          ]
        );

        if (hoursResponse.documents.length > 0) {
          const jobsiteHours = {
            name: jobsite.name,
            hours: hoursResponse.documents.map(hour => ({
              date: new Date(hour.date).toLocaleDateString(),
              contractorName: hour.contractor_name,
              hours: hour.hours,
              rate: hour.hourly_rate,
              amount: hour.pay
            }))
          };

          totalAmount += jobsiteHours.hours.reduce((sum, h) => sum + h.amount, 0);
          jobsiteData.push(jobsiteHours);
        }
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 20px; }
            .header { 
              text-align: center; 
              margin-bottom: 30px; 
            }
            .header h1 {
              margin-bottom: 15px;
            }
            .biller-info {
              display: flex;
              justify-content: center;
              flex-wrap: wrap;
              gap: 20px;
            }
            .biller-row {
              display: flex;
              justify-content: center;
              gap: 40px;
            }
            .biller-item {
              margin: 0;
            }
            .company-info { 
              margin-bottom: 20px;
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 5px;
              background-color: #f9f9f9;
            }
            .company-info h2 {
              margin-top: 0;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .company-info p {
              margin: 5px 0;
              color: #444;
            }
            .jobsite { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .total { 
              font-weight: bold; 
              text-align: right;
              padding: 15px;
              border-top: 2px solid #ddd;
            }
            .payment-info { 
              margin: 30px 0;
              border: 1px solid #ddd;
              padding: 20px;
              border-radius: 5px;
              background-color: #f9f9f9;
            }
            .payment-info h2 {
              margin-top: 0;
              color: #333;
              border-bottom: 1px solid #ddd;
              padding-bottom: 10px;
              margin-bottom: 15px;
            }
            .payment-info p {
              margin: 5px 0;
              color: #444;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${BILLER_INFO.name}</h1>
            <div class="biller-info">
              <div class="biller-row">
                <p class="biller-item">ABN: ${BILLER_INFO.abn}</p>
                <p class="biller-item">ACN: ${BILLER_INFO.acn}</p>
              </div>
              <div class="biller-row">
                <p class="biller-item">Phone: ${BILLER_INFO.phone}</p>
                <p class="biller-item">Email: ${BILLER_INFO.email}</p>
              </div>
            </div>
          </div>

          <div class="company-info">
            <h2>Bill To:</h2>
            <p><strong>${company.name}</strong></p>
            <p>ABN: ${company.abn}</p>
            <p><strong>Invoice Period:</strong> ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
          </div>

          ${jobsiteData.map(jobsite => `
            <div class="jobsite">
              <h3>${jobsite.name}</h3>
              <table>
                <tr>
                  <th>Date</th>
                  <th>Contractor</th>
                  <th>Hours</th>
                  <th>Rate</th>
                  <th>Amount</th>
                </tr>
                ${jobsite.hours.map(hour => `
                  <tr>
                    <td>${hour.date}</td>
                    <td>${hour.contractorName}</td>
                    <td>${hour.hours}</td>
                    <td>$${hour.rate}</td>
                    <td>$${hour.amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>
            </div>
          `).join('')}

          <div class="payment-info">
            <h2>Payment Information</h2>
            <p><strong>BSB:</strong> ${BILLER_INFO.bsb}</p>
            <p><strong>Account Number:</strong> ${BILLER_INFO.account}</p>
          </div>

          <div class="total">
            <h3>Total Amount: $${totalAmount.toFixed(2)}</h3>
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      await Sharing.shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf'
      });

    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const renderCompanyPicker = () => (
    <TouchableOpacity 
      style={styles.companySelector}
      onPress={() => setShowCompanyPicker(true)}
    >
      <Text style={styles.companySelectorLabel}>Select Company:</Text>
      <Text style={styles.companySelectorValue}>
        {companies.find(c => c.$id === selectedCompanyId)?.name || 'Select a company...'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <Text style={globalStyles.title}>View Contractors' Logged Hours</Text>
      
      <TouchableOpacity 
        style={globalStyles.dateSection}
        onPress={() => setExpandedStart(!expandedStart)}
      >
        <View style={globalStyles.dateSectionHeader}>
          <Text style={globalStyles.dateLabel}>Start Date:</Text>
          <Text style={globalStyles.dateValue}>
            {startDate.toLocaleDateString()}
          </Text>
        </View>
        {expandedStart && (
  <DateTimePicker
    value={startDate}
    mode="date"
    display="inline" // Changed from 'spinner' to 'inline'
    onChange={handleStartDateChange}
    maximumDate={new Date()}
    style={[
      globalStyles.datePicker,
      { height: 300 } // Increased height for inline calendar
    ]}
  />
)}
      </TouchableOpacity>

      <TouchableOpacity 
        style={globalStyles.dateSection}
        onPress={() => setExpandedEnd(!expandedEnd)}
      >
        <View style={globalStyles.dateSectionHeader}>
          <Text style={globalStyles.dateLabel}>End Date:</Text>
          <Text style={globalStyles.dateValue}>
            {endDate.toLocaleDateString()}
          </Text>
        </View>
        {expandedEnd && (
  <DateTimePicker
    value={endDate}
    mode="date"
    display="inline" // Changed from 'spinner' to 'inline'
    onChange={handleEndDateChange}
    maximumDate={new Date()}
    style={[
      globalStyles.datePicker,
      { height: 300 } // Increased height for inline calendar
    ]}
  />
)}
      </TouchableOpacity>

      {renderCompanyPicker()}

      <View style={styles.buttonContainer}>
        <CustomButton 
          title="View Hours"
          handlePress={fetchLoggedHours}
          containerStyles="mb-4 bg-blue-500"
          isLoading={loading}
        />
        <CustomButton 
          title="Generate Invoice"
          handlePress={generateInvoice}
          containerStyles="bg-green-500"
          isLoading={loading}
        />
      </View>

      {loading ? (
        <Text style={globalStyles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={loggedHours}
          keyExtractor={(item) => item.contractor.$id}
          renderItem={({ item }) => (
            <View style={globalStyles.contractorItem}>
              <Text style={globalStyles.contractorName}>{item.contractor.name}</Text>
              {item.hours.length > 0 ? (
                <>
                    {item.hours.map((log, index) => (
                    <Text key={index} style={styles.logText}>
                      {new Date(log.date).toLocaleDateString()}: {log.hours} hours
                    </Text>
                    ))}
                  <Text style={styles.totalHoursText}>
                    Total Logged Hours: {item.totalHours.toFixed(2)} hours
                  </Text>
                </>
              ) : (
                <Text style={styles.noLogsText}>No logs found for this period.</Text>
              )}
    </View>
  )}
  contentContainerStyle={globalStyles.listContainer}
/>

      )}

      <Modal
        visible={showCompanyPicker}
        transparent={true}
        animationType="slide"
      >
        <View style={globalStyles.modalOverlay}>
          <View style={globalStyles.modalContent}>
            <View style={globalStyles.modalHeader}>
              <Text style={globalStyles.modalTitle}>Select Company</Text>
              <TouchableOpacity 
                onPress={() => setShowCompanyPicker(false)}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {companies.map(company => (
                <TouchableOpacity
                  key={company.$id}
                  style={[
                    styles.companyOption,
                    company.$id === selectedCompanyId && styles.selectedCompanyOption
                  ]}
                  onPress={() => {
                    setSelectedCompanyId(company.$id);
                    setShowCompanyPicker(false);
                  }}
                >
                  <Text style={styles.companyOptionText}>{company.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({ 
  logText: {
    color: 'white',
    fontSize: 16,
  },
  noLogsText: {
    color: 'white',
    fontSize: 16,
    fontStyle: 'italic',
  },
  totalHoursText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },  
  companySelector: {
    backgroundColor: '#333',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  companySelectorLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  companySelectorValue: {
    color: '#0061ff',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  closeButton: {
    color: '#0061ff',
    fontSize: 24,
  },
  companyOption: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  selectedCompanyOption: {
    backgroundColor: '#0061ff',
  },
  companyOptionText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Hour;