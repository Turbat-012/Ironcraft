import { View, ScrollView, Text, SafeAreaView, Image, TouchableOpacity, ImageSourcePropType, Alert } from 'react-native'   
import React from 'react'
import icons from '@/constants/icons';
import { useGlobalContext } from '@/lib/global-provider';
import { logout } from '@/lib/appwrite';

interface SettingsItemProps {
    icon: ImageSourcePropType;
    title: string;
    onPress?: () => void;
    textStyle?: string;
    showArrow?: boolean;
}

const SettingsItem = ({icon, title, onPress, showArrow=false, textStyle}: SettingsItemProps) => (
    <TouchableOpacity onPress={onPress} className="flex flex-row items-center justify-between py-3">
        <View className="flex flex-row items-center gap-3">
            <Image source = {icon} className='size-6'/>
            <Text className={`text-lg font-rubik-medium text-black-300 
                ${textStyle}`}>{title}</Text>
        </View>

        {showArrow && <Image source={icons.rightArrow} className='size-5'/>}
    </TouchableOpacity>
)

const aprofile = () => {
    const { user, refetch} = useGlobalContext();

    
    const handleLogout = async () => {
        const result = await logout();

        if(result) {
            Alert.alert('Success', 'Logged out successfully');
            refetch();
        } else{
            Alert.alert('Error', 'Failed to logout');
        }
    };

    return (
        <SafeAreaView className="h-full bg-black">
            <ScrollView showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-32 px-7">
                <View>
                    <Text className="text-xl color-white font-rubik-bold">
                        Profile</Text>
                </View>

                <View className="flex-row justify-center flex mt-5">
                    <View className="flex flex-col items-center relative mt-5">
                        <Image source={{uri: user?.avatar}} className="size-44 relative rounded-full"/>
                            <Text className="text-2xl color-white font-rubik-bold mt-2">{user?.name}</Text>
                    </View>
                </View>

                <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
                    <SettingsItem icon = {icons.logout} title="Logout" 
                    textStyle='text-danger' onPress={handleLogout} />
                </View>
            </ScrollView>
        </SafeAreaView>
    )
};

export default aprofile;