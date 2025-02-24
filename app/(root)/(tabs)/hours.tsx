import { View, Text, TextInput, Button, Alert, StyleSheet, Platform } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getLoggedHours } from '@/lib/appwrite';
import CustomButton from '@/components/CustomButton';

const Hours = () => {
  const { user } = useGlobalContext();
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [totalHours, setTotalHours] = useState<number | null>(null);
  const [dailyHours, setDailyHours] = useState<{ date: string; hours: number }[]>([]);

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

    console.log(user?.privilege);
    console.log(user?.name);
    console.log('2');
    console.log('comes from hours.tsx');

    if (!user) {
      Alert.alert('Error', 'User not found.');
      return;
    }

    try {
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];
      const loggedHours = await getLoggedHours(user.$id, startDateString, endDateString);

      const total = loggedHours.reduce((sum, log) => sum + parseFloat(log.hours), 0);
      setTotalHours(total);

      const dailyHoursData = loggedHours.map(log => ({
        date: log.date,
        hours: parseFloat(log.hours),
      }));
      setDailyHours(dailyHoursData);
    } catch (error) {
      console.error('Error fetching logged hours:', error);
      Alert.alert('Error', 'An error occurred while fetching the logged hours.');
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
          <Text style={styles.totalHoursText}>Total Hours Logged: {totalHours.toFixed(2)}</Text>
        )}
        {dailyHours.length > 0 && (
          <View style={styles.dailyHoursContainer}>
            {dailyHours.map((log, index) => (
              <Text key={index} style={styles.dailyHoursText}>
                {new Date(log.date).toLocaleDateString()}: {log.hours.toFixed(2)} hours
              </Text>
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
});

export default Hours;