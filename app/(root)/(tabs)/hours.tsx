import { View, Text, TextInput, Button, Alert, StyleSheet, Platform } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getLoggedHours, databases } from '@/lib/appwrite';
import CustomButton from '@/components/CustomButton';
import { Query } from 'react-native-appwrite';
import { config } from '@/constants/config';

// export const config = {
//   platform: "com.jsm.ironcraft",
//   endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
//   projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
//   databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
//   contractorCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID,
//   hoursCollectionId: process.env.EXPO_PUBLIC_APPWRITE_HOURS_COLLECTION_ID,
//   jobsiteCollectionId: process.env.EXPO_PUBLIC_APPWRITE_JOB_SITES_COLLECTION_ID,
//   assignmentCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ASSIGNMENT_COLLECTION_ID,
//   payCollectionId: process.env.EXPO_PUBLIC_APPWRITE_PAY_COLLECTION_ID,
// };

const Hours = () => {
  const { user } = useGlobalContext();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [totalHours, setTotalHours] = useState<number | null>(null);
  const [dailyHours, setDailyHours] = useState<{ date: string; hours: number; pay: number }[]>([]);
  const [totalPay, setTotalPay] = useState<number | null>(null);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(Platform.OS === 'ios');
    setStartDate(currentDate);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(Platform.OS === 'ios');
    setEndDate(currentDate);
  };

  const handleFetchHours = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found.');
      return;
    }

    try {
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];
      
      // Fetch hours
      const loggedHours = await getLoggedHours(user.$id, startDateString, endDateString);

      // Fetch pay records for the same period
      const payResponse = await databases.listDocuments(
        config.databaseId,
        config.payCollectionId,
        [
          Query.equal('contractor_id', user.$id),
          Query.greaterThanEqual('date', startDateString),
          Query.lessThanEqual('date', endDateString)
        ]
      );

      // Create a map of date to pay amount
      const payByDate = payResponse.documents.reduce((acc, pay) => {
        acc[pay.date] = pay.pay;
        return acc;
      }, {} as { [key: string]: number });

      const dailyHoursData = loggedHours.map(log => ({
        date: log.date,
        hours: parseFloat(log.hours),
        pay: payByDate[log.date] || 0
      }));

      const totalHoursSum = dailyHoursData.reduce((sum, log) => sum + log.hours, 0);
      const totalPaySum = dailyHoursData.reduce((sum, log) => sum + log.pay, 0);

      setTotalHours(totalHoursSum);
      setTotalPay(totalPaySum);
      setDailyHours(dailyHoursData);
    } catch (error) {
      console.error('Error fetching logged hours and pay:', error);
      Alert.alert('Error', 'An error occurred while fetching the data.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>View Logged Hours</Text>
        <View style={styles.datePickerContainer}>
          <Button title="Choose Start Date" onPress={() => setShowStartDatePicker(true)} />
          <Text style={styles.dateText}>{startDate.toDateString()}</Text>
        </View>
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={handleStartDateChange}
            maximumDate={new Date()}
          />
        )}
        <View style={styles.datePickerContainer}>
          <Button title="Choose End Date" onPress={() => setShowEndDatePicker(true)} />
          <Text style={styles.dateText}>{endDate.toDateString()}</Text>
        </View>
        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={handleEndDateChange}
            maximumDate={new Date()}
          />
        )}
        <CustomButton 
          title="Fetch Logged Hours" 
          handlePress={handleFetchHours} 
          containerStyles="mt-10 bg-blue-500"
          isLoading={undefined} textStyles={undefined}
          />
        {totalHours !== null && (
          <View style={styles.totalsContainer}>
            <Text style={styles.totalHoursText}>
              Total Hours Logged: {totalHours.toFixed(2)}
            </Text>
            <Text style={styles.totalPayText}>
              Total Pay: ${totalPay?.toFixed(2) || '0.00'}
            </Text>
          </View>
        )}
        {dailyHours.length > 0 && (
          <View style={styles.dailyHoursContainer}>
            {dailyHours.map((log, index) => (
              <View key={index} style={styles.dailyLogItem}>
                <Text style={styles.dailyHoursText}>
                  {new Date(log.date).toLocaleDateString()}
                </Text>
                <Text style={styles.dailyHoursText}>
                  Hours: {log.hours.toFixed(2)}
                </Text>
                <Text style={styles.dailyPayText}>
                  Pay: ${log.pay.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: 'white',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
  },
  innerContainer: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  datePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    color: ''
  },
  dateText: {
    marginLeft: 10,
    fontSize: 16,
    color: 'white',
  },
  totalHoursText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: 'white',
  },
  dailyHoursContainer: {
    marginTop: 20,
  },
  dailyHoursText: {
    fontSize: 16,
    color: 'white',
  },
  totalsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
  },
  totalPayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 8,
  },
  dailyLogItem: {
    backgroundColor: '#1e1e1e',
    padding: 12,
    marginVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dailyPayText: {
    fontSize: 16,
    color: '#4CAF50',
  }
});

export default Hours;