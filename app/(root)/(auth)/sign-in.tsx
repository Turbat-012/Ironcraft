import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
//import images from '@constants/images';
import icons from '@/constants/icons';
import { getCurrentUser, login } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { Redirect } from 'expo-router';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import { Link } from 'expo-router';
import { router } from 'expo-router';

const SignIn = () => {
    const { refetch, user, loading, isLoggedIn } = useGlobalContext();

    const [form, setForm] = useState({
        email: '',
        password: '',
    })

    const [isSubmitting, setIsSubmitting] = useState(false);

    const submit = async () => {

        
          if(!form.email || !form.password) {
            Alert.alert('Error', 'All fields are required'); 
          }
    
          setIsSubmitting(true);
    
          try {
            const result = await login(form.email, form.password);
            if(result){
                refetch();
            } 
          } catch (error) {
            Alert.alert('Error', error.message);        
          } finally {
            setIsSubmitting(false);
          }
        }
        
    if(!loading && isLoggedIn) {return <Redirect href="/" />;
    }//else if(!loading && isLoggedIn && user?.privilege === "admin") {return <Redirect href="../(admin/assign" />;}

    return (
        <SafeAreaView className="bg-black h-full">
            <ScrollView contentContainerClassName="h-full">
                <View className="w-full justify-center min-h-[60vh] px-4 my-6">
                    <Text className="text-base text-center uppercase font-rubik color-white">
                        Welcome to Ironcraft</Text>

                    <Text className="text-3xl font-rubik-bold color-white text-center mt-2">
                        Let's get logging!
                    </Text>

                    <Text className="text-lg font-rubik color-white text-center mt-12">
                        Sign in to your account
                    </Text>

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
                        title="Sign In"
                        handlePress={submit}
                        containerStyles="mt-7 bg-blue-500"
                        isLoading={isSubmitting} textStyles={undefined}/>

                    <View className="flex-row justify-center pt-5 gap-2"> 
                        <Text className='text-lg text-gray-500 font-rubik'>
                            Don't have an account? 
                        </Text>
                        <Link href="/sign-up" className='text-lg text-blue-500 font-rubik'>Activate!</Link>
                    </View>
                    <View className="pt-2 items-center">
                    <Link href="/password-recovery" className='text-lg text-blue-500 font-rubik'>Forgot Password?</Link>
                    </View>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
    }

export default SignIn

//<Image source={images.onboarding} className="w-full h-4/6"  resizeMode="contain" />
