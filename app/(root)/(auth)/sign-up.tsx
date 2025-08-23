import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
//import images from '@constants/images';
import icons from '@/constants/icons';
import { createUser, login } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { Redirect, router } from 'expo-router';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import { Link } from 'expo-router';

const SignUp = () => {
    const { refetch, loading, isLoggedIn } = useGlobalContext();

    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
    })

    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async () => {
      if(!form.name || !form.email || !form.password) {
        Alert.alert('Error', 'All fields are required'); 
      }

      setIsSubmitting(true);

      try {
        const result = await createUser(form.email, form.password, form.name);
        if(result){
            refetch();
        }
      } catch (error) {
        Alert.alert('Error', error.message);        
      } finally {
        setIsSubmitting(false);
      }
    }

    return (
        <SafeAreaView className="bg-black h-full">
            <ScrollView contentContainerClassName="h-full">
                <View className="w-full justify-center min-h-[60vh] px-4 my-6">
                    <Text className="text-base text-center uppercase font-rubik color-white">
                        Welcome to Ironcraft</Text>

                    <Text className="text-3xl font-rubik-bold color-white text-center mt-2">
                        Let's get started!
                    </Text>

                    <Text className="text-lg font-rubik color-white text-center mt-12">
                        Activate your Ironcraft account!
                    </Text>
                    
                    <FormField 
                        title="Username"
                        value={form.name}
                        handleChangeText={(e: string) => setForm({ ...form, name: e })}
                        otherStyles="mt-7" placeholder={undefined}                    />
                    <FormField 
                        title="Email"
                        value={form.email}
                        handleChangeText={(e: string) => setForm({ ...form, email: e })}
                        otherStyles="mt-7"
                        keyboardType="email-address" placeholder={undefined}                    />
                    <FormField 
                        title="Password"
                        value={form.password}
                        handleChangeText={(e: string) => setForm({ ...form, password: e })}
                        otherStyles="mt-7" placeholder={undefined}                    />

                    <CustomButton 
                        title="Activate"
                        handlePress={submit}
                        containerStyles="mt-7 bg-blue-500"
                        isLoading={isSubmitting} textStyles={undefined}/>

                    <View className="flex-row justify-center pt-5 gap-2"> 
                        <Text className='text-lg text-gray-500 font-rubik'>
                            Have an account already? 
                        </Text>
                        <Link href="/sign-in" className='text-lg text-blue-500 font-rubik'>Login!</Link>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SignUp;

//<Image source={images.onboarding} className="w-full h-4/6"  resizeMode="contain" />
