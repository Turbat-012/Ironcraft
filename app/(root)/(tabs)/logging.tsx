import { View, Text, TextInput, Button, Alert, StyleSheet, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import React, { useState, useEffect } from 'react';  // Add useEffect to imports
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from '@/components/CustomButton';
import { logHours, databases } from '@/lib/appwrite';
import { ID, Query } from 'react-native-appwrite';
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

const Logging = () => {
  const { user } = useGlobalContext();
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hourlyRate, setHourlyRate] = useState('');
  const [assignedJobsite, setAssignedJobsite] = useState<{ id: string; name: string } | null>(null);

  const handleHoursChange = (text: string) => {
    setHours(text);
  };

  const handleMinutesChange = (text: string) => {
    setMinutes(text);
  };

  const handleRateChange = (text: string) => {
    setHourlyRate(text);
  };

  // Update the fetchJobsiteForDate function
  const fetchJobsiteForDate = async (selectedDate: Date) => {
    try {
      // Format date to match the stored format (YYYY-MM-DD)
      const dateString = selectedDate.toISOString().split('T')[0];
      console.log('Searching assignments for date:', dateString);
  
      // First, get all posted assignments for this contractor
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [
          Query.equal('contractor_id', user.$id),
          Query.equal('posted', true)
        ]
      );
  
      // console.log('All assignments found:', assignmentsResponse.documents);
  
      // Find assignment matching the selected date
      const matchingAssignment = assignmentsResponse.documents.find(
        assignment => assignment.date.split('T')[0] === dateString
      );
  
      if (matchingAssignment) {
        // console.log('Matching assignment found:', matchingAssignment);
  
        // Get jobsite details
        const jobsite = await databases.getDocument(
          config.databaseId!,
          config.jobsiteCollectionId!,
          matchingAssignment.job_site_id
        );
  
        // console.log('Jobsite details:', jobsite);
  
        if (jobsite) {
          setAssignedJobsite({
            id: jobsite.$id,
            name: jobsite.name
          });
        } else {
          console.log('No jobsite found for assignment');
          setAssignedJobsite(null);
        }
      } else {
        console.log('No assignment found for date:', dateString);
        setAssignedJobsite(null);
      }
    } catch (error) {
      console.error('Error in fetchJobsiteForDate:', error);
      setAssignedJobsite(null);
    }
  };

  // Update the useEffect to properly handle date changes
  useEffect(() => {
    if (user && date) {
      console.log('Fetching jobsite for user:', user.$id);
      fetchJobsiteForDate(date);
    }
  }, [user, date]);

  // Update handleDateChange to be more robust
  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      console.log('Date selected:', selectedDate);
      setDate(selectedDate);
      fetchJobsiteForDate(selectedDate);
    }
  };

  const handleSubmit = async () => {
    if (!assignedJobsite) {
      Alert.alert('Error', 'No jobsite assignment found for this date.');
      return;
    }
  
    if (!hours.trim() && !minutes.trim()) {
      Alert.alert('Validation Error', 'Input cannot be empty.');
      return;
    }
  
    if (!hourlyRate.trim()) {
      Alert.alert('Validation Error', 'Please enter your hourly rate.');
      return;
    }
  
    const totalHours = parseFloat(hours || '0') + parseFloat(minutes || '0') / 60;
    const rate = parseFloat(hourlyRate);
  
    try {
      setIsSubmitting(true);
      
      // Format date consistently
      const formattedDate = date.toISOString().split('T')[0];
      console.log('Submitting for date:', formattedDate); // Debug log
      
      // Log hours
      const hoursResponse = await logHours(
        user.$id, 
        totalHours, 
        formattedDate,
        rate
      );
  
      // Log pay with jobsite
      if (hoursResponse) {
        const payResponse = await databases.createDocument(
          config.databaseId!,
          config.payCollectionId!,
          ID.unique(),
          {
            contractor_id: user.$id,
            jobsite_id: assignedJobsite.id,
            date: formattedDate,
            pay: totalHours * rate
          }
        );
  
        if (payResponse) {
          Alert.alert('Success', 'Hours and pay logged successfully!');
          setHours('');
          setMinutes('');
          setHourlyRate('');
        }
      }
    } catch (error) {
      console.error('Error logging hours and pay:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'An error occurred while logging hours');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View className='w-full justify-center min-h-[60vh] px-4 my-6'>
          <Text style={styles.title}>Log Working Hours</Text>
          <TextInput
            style={styles.input}
            value={hourlyRate}
            onChangeText={handleRateChange}
            placeholder="Enter hourly rate"
            placeholderTextColor="#ffffff"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={hours}
            onChangeText={handleHoursChange}
            placeholder="Enter hours worked"
            placeholderTextColor="#ffffff"
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            value={minutes}
            onChangeText={handleMinutesChange}
            placeholder="Enter minutes worked"
            placeholderTextColor="#ffffff"
            keyboardType="numeric"
          />
          <View style={styles.datePickerContainer}>
            <Button title="Choose Date" onPress={() => setShowDatePicker(true)} />
            <Text style={styles.dateText}>{date.toDateString()}</Text>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={date}
               mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
          <View style={styles.jobsiteContainer}>
            <Text style={styles.label}>Assigned Jobsite:</Text>
            <Text style={styles.jobsiteText}>
              {assignedJobsite ? assignedJobsite.name : 'No assignment found for this date'}
            </Text>
          </View>
          <CustomButton title="Submit" handlePress={handleSubmit} containerStyles="mt-7 bg-blue-500"
            isLoading={isSubmitting} textStyles={undefined} />      
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
    color: 'white',
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
  },
  jobsiteContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
  },
  label: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
  },
  jobsiteText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default Logging;