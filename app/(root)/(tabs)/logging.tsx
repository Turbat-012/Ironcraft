import { View, Text, TextInput, Button, Alert, StyleSheet, Platform } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from '@/components/CustomButton';

const Logging = () => {
  const { user } = useGlobalContext();
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHoursChange = (text: string) => {
    setHours(text);
  };

  const handleMinutesChange = (text: string) => {
    setMinutes(text);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const handleSubmit = async () => {
    if (!hours.trim() && !minutes.trim()) {
      Alert.alert('Validation Error', 'Input cannot be empty.');
      return;
    }

    // Convert minutes to hours and add to total hours
    const totalHours = parseFloat(hours) + parseFloat(minutes) / 60;

    try {
      const response = await axios.post('https://cloud.appwrite.io/v1', {
        contractor_id: user?.$id,
        hours: totalHours.toFixed(2), // Format to 2 decimal places
        date: date.toISOString(),
      });

      if (response.status === 200) {
        Alert.alert('Success', 'Hours logged successfully!');
        setHours(''); // Reset the input field
        setMinutes(''); // Reset the input field
      } else {
        Alert.alert('Error', 'Failed to log hours.');
      }
    } catch (error) {
      console.error('Error logging hours:', error);
      Alert.alert('Error', 'An error occurred while logging the hours.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View className='w-full justify-center min-h-[60vh] px-4 my-6'>
        <Text style={styles.title}>Log Working Hours</Text>
        <TextInput
          style={styles.input}
          value={hours}
          onChangeText={handleHoursChange}
          placeholder="Enter hours worked"
          placeholderTextColor="#ccc"
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          value={minutes}
          onChangeText={handleMinutesChange}
          placeholder="Enter minutes worked"
          placeholderTextColor="#ccc"
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
        <CustomButton title="Submit" handlePress={handleSubmit} containerStyles="mt-7 bg-blue-500"
          isLoading={isSubmitting} textStyles={undefined} />      
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
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
});

export default Logging;