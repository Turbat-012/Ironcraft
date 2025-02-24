import { View, Text, Button, Alert, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases } from '@/lib/appwrite';
import { useNavigation } from '@react-navigation/native';
import { Query } from 'react-native-appwrite';
import { useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import React, { useState, useEffect } from 'react';

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
    alignItems: 'flex-start',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 8,
  },
  jobsiteInfo: {
    flex: 1,
    marginRight: 10,
  },
  jobsiteName: {
    color: 'white',
    fontSize: 18,
  },
  jobsiteAddress: {
    color: 'white',
    fontSize: 14,
    marginVertical: 4,
  },
  assignedText: {
    color: 'white',
    fontSize: 14,
    marginTop: 8,
  },
});

const Assign = () => {
  const [jobsites, setJobsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contractorsMap, setContractorsMap] = useState<{ [key: string]: string[] }>({});
  const [loadingContractors, setLoadingContractors] = useState<{ [key: string]: boolean }>({});
  const router = useRouter();

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
      
      // Initialize loading states for each jobsite
      const loadingStates = response.documents.reduce((acc: any, jobsite) => {
        acc[jobsite.$id] = true;
        return acc;
      }, {});
      setLoadingContractors(loadingStates);

      // Load contractors for each jobsite
      response.documents.forEach((jobsite) => {
        loadAssignedContractors(jobsite.$id);
      });
    } catch (error) {
      console.error('Error fetching jobsites:', error);
      Alert.alert('Error', 'Failed to fetch jobsites.');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedContractors = async (jobsiteId: string) => {
    try {
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [Query.equal('job_site_id', jobsiteId)]
      );

      const contractorIds = Array.from(
        new Set(assignmentsResponse.documents.map((a: any) => a.contractor_id))
      );

      const contractorNames = await Promise.all(
        contractorIds.map(async (id: string) => {
          const contractor = await databases.getDocument(
            config.databaseId!,
            config.contractorCollectionId!,
            id
          );
          return contractor.name;
        })
      );

      setContractorsMap(prev => ({
        ...prev,
        [jobsiteId]: contractorNames
      }));
    } catch (error) {
      console.error('Error loading assigned contractors:', error);
    } finally {
      setLoadingContractors(prev => ({
        ...prev,
        [jobsiteId]: false
      }));
    }
  };

  const handleEditJobsite = (jobsiteId: string) => {
    router.push({
      pathname: '/EditJobsite',
      params: { jobsiteId }
    });
  };

  const handlePostAllJobs = async () => {
    setLoading(true);
    try {
      // Get all jobsites that haven't been posted yet
      const jobsitesToPost = jobsites.filter(jobsite => !jobsite.posted);
  
      if (jobsitesToPost.length === 0) {
        Alert.alert('Info', 'No new jobsites to post.');
        return;
      }
  
      // Update all jobsites to posted
      const updateJobsitePromises = jobsitesToPost.map(jobsite =>
        databases.updateDocument(
          config.databaseId!,
          config.jobsiteCollectionId!,
          jobsite.$id,
          { posted: true }
        )
      );
  
      await Promise.all(updateJobsitePromises);
  
      // Get all assignments for these jobsites
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [Query.equal('posted', false)]
      );
  
      // Update all assignments to posted
      const updateAssignmentPromises = assignmentsResponse.documents.map((assignment: any) =>
        databases.updateDocument(
          config.databaseId!,
          config.assignmentCollectionId!,
          assignment.$id,
          { posted: true }
        )
      );
  
      await Promise.all(updateAssignmentPromises);
      Alert.alert('Success', 'All job sites posted successfully.');
      
      // Refresh the jobsites list
      fetchJobsites();
    } catch (error) {
      console.error('Error posting job sites:', error);
      Alert.alert('Error', 'Failed to post job sites.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.jobsiteItem}>
      <View style={styles.jobsiteInfo}>
        <Text style={styles.jobsiteName}>{item.name}</Text>
        <Text style={styles.jobsiteAddress}>{item.address}</Text>
        <Text style={styles.assignedText}>
          Assigned Contractors:{" "}
          {loadingContractors[item.$id]
            ? "Loading..."
            : contractorsMap[item.$id]?.length > 0
            ? contractorsMap[item.$id].join(', ')
            : "None"}
        </Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button title="Edit" onPress={() => handleEditJobsite(item.$id)} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Jobsite Assignments</Text>
      <CustomButton 
        title="Post All Job Sites"
        handlePress={handlePostAllJobs}
        containerStyles="mb-4 bg-blue-500"
        isLoading={loading}
        textStyles={undefined}
      />
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList     
          data={jobsites}
          keyExtractor={(item) => item.$id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

export default Assign;
