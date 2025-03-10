import { View, ScrollView, Text, SafeAreaView, Image, TouchableOpacity, ImageSourcePropType, Alert, Modal, TextInput } from 'react-native'   
import React, { useState, useEffect } from 'react';
import icons from '@/constants/icons';
import { useGlobalContext } from '@/lib/global-provider';
import { logout } from '@/lib/appwrite';
import { databases } from '@/lib/appwrite';
import { config } from '@/constants/config';
import { sendPushNotification } from '@/lib/notifications';

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
            <Text className={`text-lg font-rubik-medium text-white 
                ${textStyle}`}>{title}</Text>
        </View>

        {showArrow && <Image source={icons.rightArrow} className='size-5'/>}
    </TouchableOpacity>
)

const ViewProfileModal = React.memo(({ 
    isVisible, 
    onClose, 
    onSave, 
    formValues, 
    setFormValues, 
    user 
}) => (
    <Modal
        animationType="slide"
        transparent={true}
        visible={isVisible}
        onRequestClose={onClose}
    >
        <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-[#1e1e1e] p-6 rounded-xl w-[90%]">
                <Text className="text-xl text-white font-rubik-bold mb-4">Profile Details</Text>
                
                <Text className="text-white mb-2">Email:</Text>
                <View className="bg-[#2d2d2d] p-3 rounded-lg mb-4">
                    <Text className="text-gray-400">{user?.contractorData?.email}</Text>
                </View>

                <Text className="text-white mb-2">Name:</Text>
                <TextInput
                    value={formValues.name}
                    onChangeText={(text) => setFormValues(prev => ({ ...prev, name: text }))}
                    className="bg-[#2d2d2d] text-white p-3 rounded-lg mb-4"
                    placeholderTextColor="#666"
                />

                <Text className="text-white mb-2">ABN:</Text>
                <TextInput
                    value={formValues.abn}
                    onChangeText={(text) => {
                        // Only allow numbers
                        const numbersOnly = text.replace(/[^0-9]/g, '');
                        setFormValues(prev => ({ ...prev, abn: numbersOnly }))
                    }}
                    className="bg-[#2d2d2d] text-white p-3 rounded-lg mb-6"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    maxLength={11}
                />

                <Text className="text-white mb-2">Registration Date:</Text>
                <View className="bg-[#2d2d2d] p-3 rounded-lg mb-6">
                    <Text className="text-gray-400">
                        {new Date(user?.$createdAt).toLocaleDateString()}
                    </Text>
                </View>

                <View className="flex-row justify-end gap-4">
                    <TouchableOpacity 
                        onPress={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-600"
                    >
                        <Text className="text-white">Close</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={onSave}
                        className="px-4 py-2 rounded-lg bg-blue-500"
                    >
                        <Text className="text-white">Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    </Modal>
));

const Profile = () => {
    const { user, refetch } = useGlobalContext();
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [formValues, setFormValues] = useState({
        name: '',
        abn: ''
    });

    // Initialize with nested data
    useEffect(() => {
        if (user?.contractorData) {
            setFormValues({
                name: user.contractorData.name || '',
                abn: user.contractorData.abn || ''
            });
            setLocalFormValues({
                name: user.contractorData.name || '',
                abn: user.contractorData.abn || ''
            });
        }
    }, [user]);

    // Add local form state separate from user data
    const [localFormValues, setLocalFormValues] = useState({
        name: '',
        abn: ''
    });

    // Initialize local form values when modal opens
    const handleOpenModal = () => {
        setLocalFormValues({
            name: user?.name || '',
            abn: user?.abn?.toString() || '' // Convert to string if exists
        });
        setIsEditModalVisible(true);
    };

    // Modify handleEditProfile to ensure state is updated correctly
    const handleEditProfile = async () => {
        try {
            // Validate ABN format (11 digits)
            if (!/^\d{11}$/.test(localFormValues.abn)) {
                Alert.alert('Error', 'ABN must be exactly 11 digits');
                return;
            }

            // Directly fetch latest data after update
            const response = await databases.updateDocument(
                config.databaseId!,
                config.contractorCollectionId!,
                user.$id,
                {
                    name: localFormValues.name,
                    abn: localFormValues.abn // Make sure this matches the field name in Appwrite
                }
            );

            console.log('Update response:', response); // Debug log

            // Update local state with the response data
            setFormValues({
                name: response.name,
                abn: response.abn
            });

            await refetch();
            Alert.alert('Success', 'Profile updated successfully');
            setIsEditModalVisible(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    // Add useEffect to update local state when user data changes
    useEffect(() => {
        if (user) {
            setFormValues({
                name: user.name || '',
                abn: user.abn || ''
            });
            setLocalFormValues({
                name: user.name || '',
                abn: user.abn || ''
            });
        }
    }, [user]);

    const handleLogout = async () => {
        const result = await logout();

        if(result) {
            Alert.alert('Success', 'Logged out successfully');
            refetch();
        } else{
            Alert.alert('Error', 'Failed to logout');
        }
    };

    const testNotification = async () => {
        console.log('Testing notification with token:', user?.contractorData?.pushToken); // Debug log
        
        if (user?.contractorData?.pushToken) {
            try {
                await sendPushNotification(
                    user.contractorData.pushToken,
                    'Test Notification',
                    'This is a test notification'
                );
                console.log('Notification sent successfully');
                Alert.alert('Success', 'Test notification sent');
            } catch (error) {
                console.error('Notification error:', error);
                Alert.alert('Error', 'Failed to send test notification');
            }
        } else {
            Alert.alert('Error', 'No push token available');
        }
    };

    // Update the ABN display in your JSX
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
                            <Text className="text-2xl font-rubik-bold color-white mt-2">{user?.name}</Text>
                    </View>
                </View>

                <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
                    <Text className="text-lg color-white font-rubik-medium mb-4">
                        ABN: {user?.contractorData?.abn || 'Not set'}
                    </Text>
                    <SettingsItem 
                        icon={icons.edit} 
                        title="View Profile" 
                        showArrow={true}
                        textStyle='text-white'  // Changed from default to white
                        onPress={handleOpenModal} 
                    />

                    <SettingsItem 
                        icon={icons.logout} 
                        title="Logout" 
                        textStyle="text-red-500"  // Changed from text-danger to text-red-500
                        onPress={handleLogout} 
                    />

                    <SettingsItem 
                        icon={icons.bell}
                        title="Test Notification"
                        onPress={testNotification}
                    />
                </View>

                <ViewProfileModal 
                    isVisible={isEditModalVisible}
                    onClose={() => setIsEditModalVisible(false)}
                    onSave={handleEditProfile}
                    formValues={localFormValues}
                    setFormValues={setLocalFormValues}
                    user={user}
                />
            </ScrollView>
        </SafeAreaView>
    )
}
export default Profile