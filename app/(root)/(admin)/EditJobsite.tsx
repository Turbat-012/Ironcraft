import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases } from '@/lib/appwrite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Query } from 'react-native-appwrite';
import CustomButton from '@/components/CustomButton';

export const config = {
    platform: "com.jsm.ironcraft",
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
    contractorCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID,
    hoursCollectionId: process.env.EXPO_PUBLIC_APPWRITE_HOURS_COLLECTION_ID,
    jobsiteCollectionId: process.env.EXPO_PUBLIC_APPWRITE_JOB_SITES_COLLECTION_ID,
    assignmentCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ASSIGNMENT_COLLECTION_ID,
  };

const EditJobsite = () => {
  const router = useRouter();
  const { jobsiteId } = useLocalSearchParams();
  const [jobsite, setJobsite] = useState<any>(null);
  const [contractors, setContractors] = useState<any[]>([]);
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (jobsiteId) {
      loadJobsiteAndContractors();
    }
  }, [jobsiteId]);

  const loadJobsiteAndContractors = async () => {
    setLoading(true);
    try {
      // Load jobsite details
      const jobsiteData = await databases.getDocument(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.EXPO_PUBLIC_APPWRITE_JOB_SITES_COLLECTION_ID!,
        jobsiteId as string
      );
      setJobsite(jobsiteData);

      // Load all contractors
      const contractorsResponse = await databases.listDocuments(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID!
      );
      setContractors(contractorsResponse.documents);

      // Load current assignments for this jobsite
      const assignmentsResponse = await databases.listDocuments(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.EXPO_PUBLIC_APPWRITE_ASSIGNMENT_COLLECTION_ID!,
        [Query.equal('job_site_id', jobsiteId)]
      );

      // Set initially selected contractors
      const currentlyAssigned = assignmentsResponse.documents.map(
        (assignment) => assignment.contractor_id
      );
      setSelectedContractors(currentlyAssigned);

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load jobsite and contractors.');
    } finally {
      setLoading(false);
    }
  };

  const handleContractorSelection = (contractorId: string) => {
    setSelectedContractors((prev) => {
      if (prev.includes(contractorId)) {
        return prev.filter(id => id !== contractorId);
      } else {
        return [...prev, contractorId];
      }
    });
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      // Delete existing assignments for this jobsite
      const existingAssignments = await databases.listDocuments(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.EXPO_PUBLIC_APPWRITE_ASSIGNMENT_COLLECTION_ID!,
        [Query.equal('job_site_id', jobsiteId)]
      );

      const deletePromises = existingAssignments.documents.map(assignment =>
        databases.deleteDocument(
          process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.EXPO_PUBLIC_APPWRITE_ASSIGNMENT_COLLECTION_ID!,
          assignment.$id
        )
      );

      await Promise.all(deletePromises);

      // Create new assignments
      const createPromises = selectedContractors.map(contractorId =>
        databases.createDocument(
          process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.EXPO_PUBLIC_APPWRITE_ASSIGNMENT_COLLECTION_ID!,
          'unique()',
          {
            contractor_id: contractorId,
            job_site_id: jobsiteId,
            date: new Date().toISOString(),
            posted: false
          }
        )
      );

      await Promise.all(createPromises);

      Alert.alert('Success', 'Contractor assignments updated successfully.');
      router.back();
    } catch (error) {
      console.error('Error updating assignments:', error);
      Alert.alert('Error', 'Failed to update contractor assignments.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Assign Contractors to {jobsite?.name || 'Loading...'}
      </Text>
      <ScrollView style={styles.contractorList}>
        {contractors.map((contractor) => (
          <TouchableOpacity
            key={contractor.$id}
            style={[
              styles.contractorItem,
              selectedContractors.includes(contractor.$id) && styles.selectedContractorItem,
            ]}
            onPress={() => handleContractorSelection(contractor.$id)}
          >
            <Text style={styles.contractorName}>{contractor.name}</Text>
          </TouchableOpacity>
          
        ))}
      </ScrollView>
      <CustomButton 
        title={loading ? 'Updating...' : 'Update Assignments'} 
        handlePress={handleUpdate}
        containerStyles="mt-7 bg-blue-500"
        isLoading={loading}
        textStyles={undefined}
        />
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
  contractorList: {
    maxHeight: '70%',
    marginBottom: 20,
  },
  contractorItem: {
    padding: 16,
    backgroundColor: '#333333',
    marginBottom: 8,
    borderRadius: 5,
  },
  selectedContractorItem: {
    backgroundColor: '#0061FF',
  },
  contractorName: {
    color: 'white',
    fontSize: 16,
  },
});

export default EditJobsite;