import { View, ScrollView, Text, SafeAreaView, Image, TouchableOpacity, ImageSourcePropType, Alert, Modal, TextInput } from 'react-native'   
import React, { useState, useEffect } from 'react';
import icons from '@/constants/icons';
import { useGlobalContext } from '@/lib/global-provider';
import { logout } from '@/lib/appwrite';
import { databases } from '@/lib/appwrite';
import { config } from '@/constants/config';
import { scaledSize } from '@/lib/textScaling';
import { globalStyles } from '@/styles/globalStyles';

interface SettingsItemProps {
    icon: ImageSourcePropType;
    title: string;
    onPress?: () => void;
    textStyle?: string;
    showArrow?: boolean;
}

interface ContractorData {
    name: string;
    email: string;
    abn: string;
    bsb: string;
    accountNumber: string;
}
  
interface User {
    $id: string;
    name: string;
    avatar: string;
    contractorData: ContractorData;
}
  
interface FormValues {
    name: string;
    abn: string;
    bsb: string;
    accountNumber: string;
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
                    style={{ fontSize: scaledSize(16) }}
                    placeholderTextColor="#666"
                    allowFontScaling={false}
                />

                <Text 
                    className="text-white mb-2"
                    style={{ fontSize: scaledSize(14) }}
                    allowFontScaling={false}
                >
                    ABN:
                </Text>
                <TextInput
                    value={formValues.abn}
                    onChangeText={(text) => {
                        const numbersOnly = (text ?? '').replace(/[^0-9]/g, '');
                        setFormValues(prev => ({ ...prev, abn: numbersOnly }));
                    }}
                    className="bg-[#2d2d2d] text-white p-3 rounded-lg mb-6"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    maxLength={11}
                />

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

const PaymentDetailsModal = React.memo(({ 
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
                <Text className="text-xl text-white font-rubik-bold mb-4">Payment Details</Text>

                <Text className="text-white mb-2">BSB:</Text>
                <TextInput
                    value={formValues.bsb}
                    onChangeText={(text) => {
                        const numbersOnly = (text ?? '').replace(/[^0-9]/g, '');
                        setFormValues(prev => ({ ...prev, bsb: numbersOnly }));
                    }}
                    className="bg-[#2d2d2d] text-white p-3 rounded-lg mb-4"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    maxLength={6}
                />

                <Text className="text-white mb-2">Account Number:</Text>
                <TextInput
                    value={formValues.accountNumber}
                    onChangeText={(text) => {
                        const numbersOnly = (text ?? '').replace(/[^0-9]/g, '');
                        setFormValues(prev => ({ ...prev, accountNumber: numbersOnly }));
                    }}
                    className="bg-[#2d2d2d] text-white p-3 rounded-lg mb-6"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    maxLength={8}
                />

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
        abn: '',
        bsb: '',
        accountNumber: ''
    });

    // Initialize with nested data
    useEffect(() => {
        if (user?.contractorData) {
            setFormValues({
                name: user.contractorData.name || '',
                abn: user.contractorData.abn || '',
                bsb: user.contractorData.bsb || '',
                accountNumber: user.contractorData.accountNumber || ''
            });
            setLocalFormValues({
                name: user.contractorData.name || '',
                abn: user.contractorData.abn || '',
                bsb: user.contractorData.bsb || '',
                accountNumber: user.contractorData.accountNumber || ''
            });
        }
    }, [user]);

    // Add local form state separate from user data
    const [localFormValues, setLocalFormValues] = useState({
        name: '',
        abn: '',
        bsb: '',
        accountNumber: ''
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

            // Validate BSB (6 digits)
            if (!/^\d{6}$/.test(localFormValues.bsb)) {
                Alert.alert('Error', 'BSB must be exactly 6 digits');
                return;
            }

            // Validate Account Number (8 digits)
            if (!/^\d{8}$/.test(localFormValues.accountNumber)) {
                Alert.alert('Error', 'Account number must be exactly 8 digits');
                return;
            }

            const response = await databases.updateDocument(
                config.databaseId!,
                config.contractorCollectionId!,
                user.$id,
                {
                    name: localFormValues.name,
                    abn: localFormValues.abn,
                    bsb: localFormValues.bsb,
                    accountNumber: localFormValues.accountNumber
                }
            );

            setFormValues({
                name: response.name,
                abn: response.abn,
                bsb: response.bsb,
                accountNumber: response.accountNumber
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

    // Add new state for payment modal
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [paymentFormValues, setPaymentFormValues] = useState({
        bsb: '',
        accountNumber: ''
    });

    // Add payment details handler
    const handlePaymentDetails = async () => {
        try {
            // Validate BSB (6 digits)
            if (!/^\d{6}$/.test(paymentFormValues.bsb)) {
                Alert.alert('Error', 'BSB must be exactly 6 digits');
                return;
            }

            // Validate Account Number (8 digits)
            if (!/^\d{8}$/.test(paymentFormValues.accountNumber)) {
                Alert.alert('Error', 'Account number must be exactly 8 digits');
                return;
            }

            const response = await databases.updateDocument(
                config.databaseId!,
                config.contractorCollectionId!,
                user.$id,
                {
                    bsb: paymentFormValues.bsb,
                    accountNumber: paymentFormValues.accountNumber
                }
            );

            await refetch();
            Alert.alert('Success', 'Payment details updated successfully');
            setIsPaymentModalVisible(false);
        } catch (error) {
            console.error('Error updating payment details:', error);
            Alert.alert('Error', 'Failed to update payment details');
        }
    };

    // Add handler to open payment modal
    const handleOpenPaymentModal = () => {
        setPaymentFormValues({
            bsb: user?.contractorData?.bsb || '',
            accountNumber: user?.contractorData?.accountNumber || ''
        });
        setIsPaymentModalVisible(true);
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
                        <Text 
                            className="text-2xl font-rubik-bold color-white mt-2"
                            style={{ fontSize: scaledSize(24) }}
                            allowFontScaling={false}
                        >
                            {user?.name}
                        </Text>
                    </View>
                </View>

                <View className="flex flex-col mt-5 border-t pt-5 border-primary-200">
                    <Text 
                        className="text-lg color-white font-rubik-medium mb-4"
                        style={{ fontSize: scaledSize(16) }}
                        allowFontScaling={false}
                    >
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
                        icon={icons.wallet} // Add wallet icon to your icons
                        title="Payment Details" 
                        showArrow={true}
                        textStyle='text-white'
                        onPress={handleOpenPaymentModal} 
                    />

                    <SettingsItem 
                        icon={icons.logout} 
                        title="Logout" 
                        textStyle="text-red-500"  // Changed from text-danger to text-red-500
                        onPress={handleLogout} 
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

                {/* Add Payment Details Modal */}
                <PaymentDetailsModal 
                    isVisible={isPaymentModalVisible}
                    onClose={() => setIsPaymentModalVisible(false)}
                    onSave={handlePaymentDetails}
                    formValues={paymentFormValues}
                    setFormValues={setPaymentFormValues}
                    user={user}
                />
            </ScrollView>
        </SafeAreaView>
    )
};

export default Profile;