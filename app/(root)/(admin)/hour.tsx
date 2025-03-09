import { View, Text, Button, Alert, FlatList, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { databases } from '@/lib/appwrite';
import { Query } from 'react-native-appwrite';
import CustomButton from '@/components/CustomButton';
import {config} from '@/constants/config';

// export const config = {
//   platform: "com.jsm.ironcraft",
//   endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
//   projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
//   databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
//   contractorCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID,
//   hoursCollectionId: process.env.EXPO_PUBLIC_APPWRITE_HOURS_COLLECTION_ID,
//   jobsiteCollectionId: process.env.EXPO_PUBLIC_APPWRITE_JOB_SITES_COLLECTION_ID,
// }

const Hour = () => {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [loggedHours, setLoggedHours] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedStart, setExpandedStart] = useState(false);
  const [expandedEnd, setExpandedEnd] = useState(false);

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

  /*const handleStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };*/
  
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>View Contractors' Logged Hours</Text>
      
      <TouchableOpacity 
        style={styles.dateSection}
        onPress={() => setExpandedStart(!expandedStart)}
      >
        <View style={styles.dateSectionHeader}>
          <Text style={styles.dateLabel}>Start Date:</Text>
          <Text style={styles.dateValue}>
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
      styles.datePicker,
      { height: 300 } // Increased height for inline calendar
    ]}
  />
)}
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.dateSection}
        onPress={() => setExpandedEnd(!expandedEnd)}
      >
        <View style={styles.dateSectionHeader}>
          <Text style={styles.dateLabel}>End Date:</Text>
          <Text style={styles.dateValue}>
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
      styles.datePicker,
      { height: 300 } // Increased height for inline calendar
    ]}
  />
)}
      </TouchableOpacity>

      <CustomButton 
        title="Fetch Logged Hours"
        handlePress={fetchLoggedHours}
        containerStyles="mt-7 mb-5 bg-blue-500"
        isLoading={undefined} 
        textStyles={undefined}
      />
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={loggedHours}
          keyExtractor={(item) => item.contractor.$id}
          renderItem={({ item }) => (
            <View style={styles.contractorItem}>
              <Text style={styles.contractorName}>{item.contractor.name}</Text>
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
  contentContainerStyle={styles.listContainer}
/>

      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  datePickerContainer: {
    marginBottom: 20,
  },
  dateText: {
    color: 'white',
    textAlign: 'center',
    marginTop: 10,
  },
  loadingText: {
    color: 'white',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  contractorItem: {
    backgroundColor: '#444',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
  },
  contractorName: {
    color: 'white',
    fontSize: 18,
    marginBottom: 10,
  },
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateValue: {
    color: '#0061ff',
    fontSize: 16,
  },
  datePicker: {
    marginTop: 10,
    height: Platform.OS === 'ios' ? 120 : 40,
    backgroundColor: '#444',
  },
});

export default Hour;