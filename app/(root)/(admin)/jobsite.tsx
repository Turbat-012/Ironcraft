import { View, Text, TextInput, Button, Alert, FlatList, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGlobalContext } from '@/lib/global-provider';
import { databases} from '@/lib/appwrite';
import { ID } from 'react-native-appwrite';
import CustomButton from '@/components/CustomButton';
import {config} from '@/constants/config';

// export const config = {
//   platform: "com.jsm.ironcraft",
//   endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
//   projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
//   databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
//   contractorCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID,
//   hoursCollectionId: process.env.EXPO_PUBLIC_APPWRITE_HOURS_COLLECTION_ID,
//   jobsiteCollectionId: process.env.EXPO_PUBLIC_APPWRITE_JOB_SITES_COLLECTION_ID,
// }

const Jobsite = () => {
  const { user } = useGlobalContext();
  const [jobsiteName, setJobsiteName] = useState('');
  const [jobsiteAddress, setJobsiteAddress] = useState('');
  const [jobsites, setJobsites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobsites();
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

  const handleCreateJobsite = async () => {
    if (!jobsiteName.trim() || !jobsiteAddress.trim()) {
      Alert.alert('Validation Error', 'Jobsite name and address cannot be empty.');
      return;
    }

    try {
      const response = await databases.createDocument(
        config.databaseId!,
        config.jobsiteCollectionId!,
        ID.unique(),
        { name: jobsiteName, 
          address: jobsiteAddress
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

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Manage Jobsites</Text>
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
        isLoading={undefined} 
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
});

export default Jobsite;