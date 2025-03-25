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
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import { databases} from '@/lib/appwrite';
import { ID } from 'react-native-appwrite';
import CustomButton from '@/components/CustomButton';
import {config} from '@/constants/config';

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
          style={styles.selectorButton}
          onPress={() => setShowCompanyPicker(true)}
        >
          <Text style={styles.selectorButtonText}>
            {selectedCompany ? selectedCompany.name : 'Select a company...'}
          </Text>
        </TouchableOpacity>

        <Modal
          visible={showCompanyPicker}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Company</Text>
                <TouchableOpacity 
                  onPress={() => setShowCompanyPicker(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.companiesList}>
                {companies.map((company) => (
                  <TouchableOpacity
                    key={company.$id}
                    style={[
                      styles.companyOption,
                      company.$id === selectedCompanyId && styles.selectedCompanyOption
                    ]}
                    onPress={() => handleCompanySelect(company.$id)}
                  >
                    <Text style={[
                      styles.companyOptionText,
                      company.$id === selectedCompanyId && styles.selectedCompanyOptionText
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
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Manage Jobsites</Text>
      
      {renderCompanySelector()}

      <TextInput
        style={styles.input}
        value={jobsiteName}
        onChangeText={setJobsiteName}
        placeholder="Enter jobsite name"
        placeholderTextColor="#ffffff"
      />
      <TextInput
        style={styles.input}
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
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={jobsites}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => (
            <View style={styles.jobsiteItem}>
              <View>
                <Text style={styles.jobsiteName}>{item.name}</Text>
                <Text style={styles.jobsiteAddress}>{item.address}</Text>
                <Text style={styles.companyName}>
                  {companies.find(c => c.$id === item.companies_id)?.name || 'Unknown Company'}
                </Text>
              </View>
              <Button title="Delete" onPress={() => handleDeleteJobsite(item.$id)} />
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#333',
    color: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  loadingText: {
    color: 'white',
    textAlign: 'center',
  },
  listContainer: {
    paddingBottom: 20,
  },
  jobsiteItem: {
    backgroundColor: '#444',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobsiteName: {
    color: 'white',
    fontSize: 18,
  },
  jobsiteAddress: {
    color: 'white',
    fontSize: 14,
  },
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
  companyName: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 4,
  },
  selectorButton: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
  },
  selectorButtonText: {
    color: 'white',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1c1c1e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    color: '#007AFF',
    fontSize: 20,
  },
  companiesList: {
    padding: 16,
  },
  companyOption: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedCompanyOption: {
    backgroundColor: '#0A84FF',
  },
  companyOptionText: {
    color: 'white',
    fontSize: 16,
  },
  selectedCompanyOptionText: {
    fontWeight: 'bold',
  },
});

export default Jobsite;