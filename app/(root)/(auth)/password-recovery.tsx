import { View, Text, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Client, Account } from 'react-native-appwrite';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import { config } from '@/constants/config';

const client = new Client();

client
  .setEndpoint(config.endpoint!) // Your API Endpoint
  .setProject(config.projectId!) // Your project ID

const account = new Account(client);

const PasswordRecovery = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRecovery = async () => {
    if (!email) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await account.createRecovery(email, 'https://example.com/update-password');
      Alert.alert('Success', 'Recovery email sent');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="bg-black h-full">
      <ScrollView contentContainerClassName="h-full">
        <View className="w-full justify-center min-h-[60vh] px-4 my-6">
          <Text className="text-3xl font-rubik-bold color-white text-center mt-2">
            Password Recovery
          </Text>
          <FormField
            title="Email"
            value={email}
            handleChangeText={(e: string) => setEmail(e)}
            otherStyles="mt-7"
            keyboardType="email-address"
            placeholder="Enter your email"
          />
          <CustomButton
            title="Send Recovery Email"
            handlePress={handleRecovery}
            containerStyles="mt-7 bg-blue-500"
            isLoading={isSubmitting} textStyles={undefined}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PasswordRecovery;