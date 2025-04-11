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
import { generateInvoice } from '@/lib/invoice_utility';
import { globalStyles } from '@/styles/globalStyles';

const Hours = () => {
  const { user } = useGlobalContext();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [totalHours, setTotalHours] = useState<number | null>(null);
  const [dailyHours, setDailyHours] = useState<{ date: string; hours: number; pay: number; jobsite: string; hourlyRate: number }[]>([]);
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
    try {
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];

      const hoursResponse = await databases.listDocuments(
        config.databaseId!,
        config.hoursCollectionId!,
        [
          Query.equal('contractor_id', user.$id),
          Query.greaterThanEqual('date', startDateString),
          Query.lessThanEqual('date', endDateString)
        ]
      );

      // Fetch jobsite names for each entry
      const dailyHoursData = await Promise.all(
        hoursResponse.documents.map(async log => {
          try {
            const jobsite = await databases.getDocument(
              config.databaseId!,
              config.jobsiteCollectionId!,
              log.job_site_id  // Changed from jobsite_id to job_site_id
            );
            
            return {
              date: log.date,
              hours: parseFloat(log.hours),
              hourlyRate: log.hourly_rate,
              pay: log.pay,
              jobsite: jobsite.name
            };
          } catch (error) {
            console.error('Error fetching jobsite:', error);
            return {
              date: log.date,
              hours: parseFloat(log.hours),
              hourlyRate: log.hourly_rate,
              pay: log.pay,
              jobsite: 'Unknown Site'
            };
          }
        })
      );

      setDailyHours(dailyHoursData);
      setTotalHours(dailyHoursData.reduce((sum, log) => sum + log.hours, 0));
      setTotalPay(dailyHoursData.reduce((sum, log) => sum + log.pay, 0));
    } catch (error) {
      console.error('Error fetching logged hours:', error);
      Alert.alert('Error', 'An error occurred while fetching the data.');
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      // If no hours data, fetch it first
      if (dailyHours.length === 0) {
        await handleFetchHours();
        
        if (dailyHours.length === 0) {
          Alert.alert('Error', 'No hours found for selected date range.');
          return;
        }
      }

      // Format daily hours directly from our existing dailyHours state
      const formattedDailyHours = dailyHours.map(day => ({
        date: new Date(day.date).toISOString().split('T')[0],
        jobsite: day.jobsite,
        hours: day.hours,
        hourly_rate: day.hourlyRate,
        pay: day.pay
      }));

      const invoiceData = {
        contractorName: user.contractorData.name,
        abn: user.contractorData.abn,
        bsb: user.contractorData.bsb,
        accountNumber: user.contractorData.accountNumber,
        dailyHours: formattedDailyHours,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      await generateInvoice(invoiceData);
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', 'Failed to generate invoice');
    }
  };

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={styles.innerContainer}>
        <Text style={globalStyles.title}>View Logged Hours</Text>
        <View style={globalStyles.datePickerContainer}>
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
        <View style={globalStyles.datePickerContainer}>
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
        <CustomButton 
          title="Generate Invoice" 
          handlePress={handleGenerateInvoice}
          containerStyles="mt-4 bg-green-500"
          isLoading={undefined}
          textStyles={undefined}
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
                <View>
                  <Text style={styles.dailyHoursText}>
                    {new Date(log.date).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.dailyHoursText, { fontSize: 14, color: '#888' }]}>
                    {log.jobsite}
                  </Text>
                  <Text style={[styles.dailyHoursText, { fontSize: 14, color: '#888' }]}>
                    Rate: ${log.hourlyRate}/hr
                  </Text>
                </View>
                <Text style={styles.dailyHoursText}>
                  Hours: {log.hours.toFixed(2)}
                </Text>
                <Text style={styles.dailyPayText}>
                  Pay: ${(log.hours * log.hourlyRate).toFixed(2)}
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
  innerContainer: {
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
    marginVertical: 24,
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
  },
});

export default Hours;