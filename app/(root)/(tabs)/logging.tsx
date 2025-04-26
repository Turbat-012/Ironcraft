import { View, Text, TextInput, Button, Alert, StyleSheet, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, TouchableOpacity } from 'react-native';
import React, { useState, useEffect } from 'react';  // Add useEffect to imports
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from '@/components/CustomButton';
import { logHours, databases } from '@/lib/appwrite';
import { ID, Query } from 'react-native-appwrite';
import { config } from '@/constants/config';
import { Picker } from '@react-native-picker/picker';
import { scaledSize } from '@/lib/textScaling';
import { globalStyles } from '@/styles/globalStyles';

interface Jobsite {
  id: string;
  name: string;
  companies_id: string;
}

const Logging = () => {
  const { user } = useGlobalContext();
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hourlyRate, setHourlyRate] = useState('');
  const [assignedJobsite, setAssignedJobsite] = useState<Jobsite | null>(null);
  const [jobsites, setJobsites] = useState<Jobsite[]>([]);
  const [manualJobsiteId, setManualJobsiteId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleHoursChange = (text: string) => {
    setHours(text);
  };

  const handleMinutesChange = (text: string) => {
    setMinutes(text);
  };

  const handleRateChange = (text: string) => {
    setHourlyRate(text);
  };

  const fetchJobsiteForDate = async (selectedDate: Date) => {
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [
          Query.equal('contractor_id', user.$id),
          Query.equal('posted', true)
        ]
      );
  
      const matchingAssignment = assignmentsResponse.documents.find(
        assignment => assignment.date.split('T')[0] === dateString
      );
  
      if (matchingAssignment) {
        const jobsite = await databases.getDocument(
          config.databaseId!,
          config.jobsiteCollectionId!,
          matchingAssignment.job_site_id
        );
  
        if (jobsite) {
          setAssignedJobsite({
            id: jobsite.$id,
            name: jobsite.name,
            companies_id: jobsite.companies_id // Add companies_id
          });
        } else {
          setAssignedJobsite(null);
        }
      } else {
        setAssignedJobsite(null);
      }
    } catch (error) {
      console.error('Error in fetchJobsiteForDate:', error);
      setAssignedJobsite(null);
    }
  };

  // Add this new function after fetchJobsiteForDate
  const fetchAllJobsites = async () => {
    try {
      const response = await databases.listDocuments(
        config.databaseId!,
        config.jobsiteCollectionId!
      );
      const formattedJobsites = response.documents.map(doc => ({
        id: doc.$id,
        name: doc.name,
        companies_id: doc.companies_id // Add companies_id
      }));
      setJobsites(formattedJobsites);
      if (formattedJobsites.length > 0) {
        setManualJobsiteId(formattedJobsites[0].id);
      }
    } catch (error) {
      console.error('Error fetching jobsites:', error);
    }
  };

  // Update the useEffect to properly handle date changes
  useEffect(() => {
    if (user && date) {
      console.log('Fetching jobsite for user:', user.$id);
      fetchJobsiteForDate(date);
      fetchAllJobsites(); // Add this line
    }
  }, [user, date]);

  // Update handleDateChange to be more robust
  const handleDateChange = (event: any, selectedDate?: Date) => {
    // Always hide the date picker regardless of platform
    setShowDatePicker(false);
    
    if (selectedDate) {
      console.log('Date selected:', selectedDate);
      setDate(selectedDate);
      fetchJobsiteForDate(selectedDate);
    }
  };

  // Modify handleSubmit to use manually selected jobsite if no assignment
  const handleSubmit = async () => {
    const selectedJobsite = assignedJobsite || (manualJobsiteId ? 
      jobsites.find(j => j.id === manualJobsiteId) : null);
  
    if (!selectedJobsite) {
      Alert.alert('Error', 'Please select a jobsite.');
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
    const formattedDate = date.toISOString().split('T')[0];
  
    try {
      setIsSubmitting(true);
  
      // Check for existing hours on this date
      const existingHours = await databases.listDocuments(
        config.databaseId!,
        config.hoursCollectionId!,
        [
          Query.equal('contractor_id', user.$id),
          Query.equal('date', formattedDate)
        ]
      );
  
      // Delete existing record if it exists
      if (existingHours.documents.length > 0) {
        await databases.deleteDocument(
          config.databaseId!,
          config.hoursCollectionId!,
          existingHours.documents[0].$id
        );
      }
  
      // Create new record with companies_id
      const hoursData = {
        contractor_id: user.$id,
        hours: totalHours,
        date: formattedDate,
        hourly_rate: rate,
        job_site_id: selectedJobsite.id,
        companies_id: selectedJobsite.companies_id, // Add companies_id
        pay: totalHours * rate
      };
  
      const response = await databases.createDocument(
        config.databaseId!,
        config.hoursCollectionId!,
        ID.unique(),
        hoursData
      );
  
      Alert.alert(
        'Success', 
        existingHours.documents.length > 0 
          ? 'Hours updated successfully' 
          : 'Hours logged successfully'
      );
  
      // Reset form
      setHours('');
      setMinutes('');
      setHourlyRate('');
    } catch (error) {
      console.error('Error logging hours:', error);
      Alert.alert('Error', 'Failed to log hours');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredJobsites = jobsites.filter(jobsite =>
    jobsite.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update the renderJobsiteSelection function to show a neutral message
  const renderJobsiteSelection = () => {
    if (assignedJobsite) {
      return (
        <View style={styles.jobsiteContainer}>
          <Text style={globalStyles.label}>Assigned Jobsite:</Text>
          <Text style={styles.jobsiteText}>{assignedJobsite.name}</Text>
        </View>
      );
    }
  
    return (
      <View style={styles.jobsiteContainer}>
        <Text style={globalStyles.label}>Select Jobsite:</Text>
        <TextInput
          style={globalStyles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search jobsites..."
          placeholderTextColor="#666"
        />
        <ScrollView style={styles.jobsiteList}>
          {filteredJobsites.map((jobsite) => (
            <TouchableOpacity
              key={jobsite.id}
              style={[
                globalStyles.jobsiteItem,
                manualJobsiteId === jobsite.id && styles.selectedJobsiteItem,
              ]}
              onPress={() => setManualJobsiteId(jobsite.id)}
            >
              <Text style={[
                styles.jobsiteItemText,
                manualJobsiteId === jobsite.id && styles.selectedJobsiteItemText
              ]}>
                {jobsite.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={globalStyles.container}>
        <View className='w-full justify-center min-h-[60vh] px-4 my-6'>
          <Text style={globalStyles.title}>Log Working Hours</Text>
          <TextInput
            style={globalStyles.input}
            value={hourlyRate}
            onChangeText={handleRateChange}
            placeholder="Enter hourly rate"
            placeholderTextColor="#ffffff"
            keyboardType="numeric"
          />
          <TextInput
            style={globalStyles.input}
            value={hours}
            onChangeText={handleHoursChange}
            placeholder="Enter hours worked"
            placeholderTextColor="#ffffff"
            keyboardType="numeric"
          />
          <TextInput
            style={globalStyles.input}
            value={minutes}
            onChangeText={handleMinutesChange}
            placeholder="Enter minutes worked"
            placeholderTextColor="#ffffff"
            keyboardType="numeric"
          />
          <View style={globalStyles.datePickerContainer}>
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
          {renderJobsiteSelection()}
          <CustomButton title="Submit" handlePress={handleSubmit} containerStyles="mt-7 bg-blue-500"
            isLoading={isSubmitting} textStyles={undefined} />      
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  dateText: {
    marginLeft: 10,
    fontSize: scaledSize(16),
    color: 'white',
  },
  jobsiteContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
  },
  jobsiteText: {
    color: '#4CAF50',
    fontSize: scaledSize(18),
    fontWeight: 'bold',
  },
  jobsiteItemText: {
    color: 'white',
    fontSize: scaledSize(16),
  },
  jobsiteList: {
    maxHeight: 200,
    marginTop: 12,
  },
  selectedJobsiteItem: {
    backgroundColor: '#0061ff', // Matches the blue theme used in buttons
    borderColor: '#0061ff',
    borderWidth: 1,
  },
  selectedJobsiteItemText: {
    color: 'white',
    fontWeight: '600',
  },  
});

export default Logging;