import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  Alert, 
  FlatList, 
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import { databases} from '@/lib/appwrite';
import { ID } from 'react-native-appwrite';
import CustomButton from '@/components/CustomButton';
import {config} from '@/constants/config';
import { globalStyles } from '@/styles/globalStyles';

const Jobsite = () => {
  const { user } = useGlobalContext();
  const [jobsiteName, setJobsiteName] = useState('');
  const [jobsiteAddress, setJobsiteAddress] = useState('');
  const [jobsites, setJobsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [showCompanyPicker, setShowCompanyPicker] = useState(false);

  useEffect(() => {
    fetchJobsites();
    fetchCompanies();
  }, []);

  const fetchJobsites = async () => {
    try {
      const response = await databases.listDocuments(
        config.databaseId!,
        config.jobsiteCollectionId!
      );
      setJobsites(response.documents);
    } catch (error) {
      console.error('Error fetching jobsites:', error);
      Alert.alert('Error', 'Failed to fetch jobsites.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await databases.listDocuments(
        config.databaseId!,
        config.companiesCollectionId!
      );
      setCompanies(response.documents);
      if (response.documents.length > 0) {
        setSelectedCompanyId(response.documents[0].$id);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      Alert.alert('Error', 'Failed to fetch companies.');
    }
  };

  const handleCreateJobsite = async () => {
    if (!jobsiteName.trim() || !jobsiteAddress.trim() || !selectedCompanyId) {
      Alert.alert('Validation Error', 'Jobsite name, address, and company are required.');
      return;
    }

    try {
      const response = await databases.createDocument(
        config.databaseId!,
        config.jobsiteCollectionId!,
        ID.unique(),
        { 
          name: jobsiteName, 
          address: jobsiteAddress,
          companies_id: selectedCompanyId
        }
      );
      setJobsites([...jobsites, response]);
      setJobsiteName('');
      setJobsiteAddress('');
      Keyboard.dismiss(); // Dismiss the keyboard
      Alert.alert('Success', 'Jobsite created successfully.');
    } catch (error) {
      console.error('Error creating jobsite:', error);
      Alert.alert('Error', 'Failed to create jobsite.');
    }
  };

  const handleDeleteJobsite = async (jobsiteId: string) => {
    Alert.alert(
      'Are you sure?',
      'Do you really want to delete this jobsite?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databases.deleteDocument(
                config.databaseId!,
                config.jobsiteCollectionId!,
                jobsiteId
              );
              setJobsites(jobsites.filter(jobsite => jobsite.$id !== jobsiteId));
              Alert.alert('Success', 'Jobsite deleted successfully.');
            } catch (error) {
              console.error('Error deleting jobsite:', error);
              Alert.alert('Error', 'Failed to delete jobsite.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const handleCompanySelect = (companyId: string) => {
    setSelectedCompanyId(companyId);
    setShowCompanyPicker(false);
  };

  const renderCompanySelector = () => {
    const selectedCompany = companies.find(c => c.$id === selectedCompanyId);
    
    return (
      <View>
        <TouchableOpacity 
          style={globalStyles.selectorButton}
          onPress={() => setShowCompanyPicker(true)}
        >
          <Text style={globalStyles.selectorButtonText}>
            {selectedCompany ? selectedCompany.name : 'Select a company...'}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showCompanyPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={globalStyles.modalOverlay}>
            <View style={globalStyles.modalContent}>
              <View style={globalStyles.modalHeader}>
                <Text style={globalStyles.modalTitle}>Select Company</Text>
                <TouchableOpacity 
                  onPress={() => setShowCompanyPicker(false)}
                  style={globalStyles.closeButton}
                >
                  <Text style={globalStyles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={globalStyles.companiesList}>
                {companies.map((company) => (
                  <TouchableOpacity
                    key={company.$id}
                    style={[
                      globalStyles.companyOption,
                      company.$id === selectedCompanyId && globalStyles.selectedCompanyOption
                    ]}
                    onPress={() => handleCompanySelect(company.$id)}
                  >
                    <Text style={[
                      globalStyles.companyOptionText,
                      company.$id === selectedCompanyId && globalStyles.selectedCompanyOptionText
                    ]}>
                      {company.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={globalStyles.container}>
        <Text style={globalStyles.title}>Manage Jobsites</Text>
        
        {renderCompanySelector()}

        <TextInput
          style={globalStyles.input}
          value={jobsiteName}
          onChangeText={setJobsiteName}
          placeholder="Enter jobsite name"
          placeholderTextColor="#ffffff"
        />
        <TextInput
          style={globalStyles.input}
          value={jobsiteAddress}
          onChangeText={setJobsiteAddress}
          placeholder="Enter jobsite address"
          placeholderTextColor="#ffffff"
        />
        <CustomButton 
          title="Create Jobsite"
          handlePress={handleCreateJobsite}
          containerStyles="mt-7 mb-5 bg-blue-500"
          isLoading={loading} 
          textStyles={undefined}
        />
        {loading ? (
          <Text style={globalStyles.loadingText}>Loading...</Text>
        ) : (
          <FlatList
            data={jobsites}
            keyExtractor={(item) => item.$id}
            renderItem={({ item }) => (
              <View style={globalStyles.jobsiteItem}>
                <View>
                  <Text style={globalStyles.jobsiteName}>{item.name}</Text>
                  <Text style={globalStyles.jobsiteAddress}>{item.address}</Text>
                  <Text style={globalStyles.companyName}>
                    {companies.find(c => c.$id === item.companies_id)?.name || 'Unknown Company'}
                  </Text>
                </View>
                <Button title="Delete" onPress={() => handleDeleteJobsite(item.$id)} />
              </View>
            )}
            contentContainerStyle={globalStyles.listContainer}
          />
        )}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: '#333',
    borderRadius: 5,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    color: 'white',
    backgroundColor: 'transparent',
  },
});

export default Jobsite;