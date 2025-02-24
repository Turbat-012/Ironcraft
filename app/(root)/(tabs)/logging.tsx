import { View, Text, TextInput, Button, Alert, StyleSheet, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from '@/components/CustomButton';
import { logHours } from '@/lib/appwrite';

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

    console.log(date.toISOString);
    console.log(totalHours);

    try {
      const response = await logHours(user.$id, totalHours, date.toISOString().split('T')[0]);

      if (response) {
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <View className='w-full justify-center min-h-[60vh] px-4 my-6'>
          <Text style={styles.title}>Log Working Hours</Text>
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
});

export default Logging;