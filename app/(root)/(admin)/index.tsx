import { View, Text, Button, Alert, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases } from '@/lib/appwrite';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Query } from 'react-native-appwrite';
import { useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import React, { useState, useEffect, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import {config} from '@/constants/config';
import { sendPushNotification } from '@/lib/notifications';

// export const config = {
//   platform: "com.jsm.ironcraft",
//   endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
//   projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
//   databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
//   contractorCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID,
//   hoursCollectionId: process.env.EXPO_PUBLIC_APPWRITE_HOURS_COLLECTION_ID,
//   jobsiteCollectionId: process.env.EXPO_PUBLIC_APPWRITE_JOB_SITES_COLLECTION_ID,
//   assignmentCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ASSIGNMENT_COLLECTION_ID,
// };

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
  dateSection: {
    backgroundColor: '#1e1e1e',
    padding: 16,
    marginBottom: 20,
    borderRadius: 8,
  },
  dateLabel: {
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 8,
  },
  dateValue: {
    color: '#0061ff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  datePicker: {
    marginTop: 10,
    backgroundColor: '#333',
  },
  contractorSelection: {
    marginTop: 10,
  },
  label: {
    color: 'white',
    fontSize: 14,
    marginBottom: 4,
  },
  contractorList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contractorItem: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedContractorItem: {
    backgroundColor: '#0061ff',
  },
  contractorName: {
    color: 'white',
  },
  searchContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  searchInput: {
    backgroundColor: '#333333',
    color: 'white',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    height: 44,
  },
});

const Assign = () => {
  const [jobsites, setJobsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contractorsMap, setContractorsMap] = useState<{ [key: string]: string[] }>({});
  const [loadingContractors, setLoadingContractors] = useState<{ [key: string]: boolean }>({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedDate, setExpandedDate] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      fetchJobsites();
    }, [])
  );

  const fetchJobsites = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        config.databaseId!,
        config.jobsiteCollectionId!
      );
      setJobsites(response.documents);
      
      // Refresh contractors for each jobsite
      response.documents.forEach((jobsite) => {
        setLoadingContractors(prev => ({
          ...prev,
          [jobsite.$id]: true
        }));
        loadAssignedContractors(jobsite.$id);
      });
    } catch (error) {
      console.error('Error fetching jobsites:', error);
      Alert.alert('Error', 'Failed to fetch jobsites');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedContractors = async (jobsiteId: string) => {
    try {
      // Only get assignments for this jobsite
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
    if (!selectedDate) {
      Alert.alert('Validation Error', 'Please select a date for the assignments.');
      return;
    }
  
    setLoading(true);
    try {
      // Get all unposted assignments
      const unpostedAssignments = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [Query.equal('posted', false)]
      );
  
      if (unpostedAssignments.documents.length === 0) {
        Alert.alert('Info', 'No new assignments to post.');
        setLoading(false);
        return;
      }
  
      // Group assignments by jobsite and date
      const assignmentsByJobsiteAndDate = unpostedAssignments.documents.reduce((acc: any, assignment) => {
        const key = `${assignment.job_site_id}_${assignment.date}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(assignment);
        return acc;
      }, {});
  
      // Handle duplicates
      for (const key in assignmentsByJobsiteAndDate) {
        const assignments = assignmentsByJobsiteAndDate[key];
        if (assignments.length > 1) {
          assignments.sort((a: any, b: any) => 
            new Date(b.$createdAt).getTime() - new Date(a.$createdAt).getTime()
          );
  
          const shouldOverride = await new Promise((resolve) => {
            Alert.alert(
              'Duplicate Assignment Date',
              `There are multiple assignments for ${assignments[0].job_site_id} on ${new Date(assignments[0].date).toLocaleDateString()}. Keep newest assignment?`,
              [
                { text: 'No', onPress: () => resolve(false), style: 'cancel' },
                { text: 'Yes', onPress: () => resolve(true) }
              ]
            );
          });
  
          assignmentsByJobsiteAndDate[key] = shouldOverride ? 
            [assignments[0]] : [assignments[assignments.length - 1]];
        }
      }
  
      const assignmentsToPost = Object.values(assignmentsByJobsiteAndDate).flat();
  
      // Update assignments
      const updateAssignmentPromises = assignmentsToPost.map((assignment: any) =>
        databases.updateDocument(
          config.databaseId!,
          config.assignmentCollectionId!,
          assignment.$id,
          { 
            posted: true,
            date: selectedDate.toISOString()
          }
        )
      );
  
      // Update jobsites
      const jobsiteIds = [...new Set(assignmentsToPost.map((a: any) => a.job_site_id))];
      const updateJobsitePromises = jobsiteIds.map(jobsiteId =>
        databases.updateDocument(
          config.databaseId!,
          config.jobsiteCollectionId!,
          jobsiteId,
          { posted: true }
        )
      );
  
      await Promise.all([...updateAssignmentPromises, ...updateJobsitePromises]);
      
      // Send notifications to all assigned contractors
      const assignedContractors = unpostedAssignments.documents.map(a => a.contractor_id);
      
      // Get contractor details including push tokens
      const contractorsResponse = await databases.listDocuments(
        config.databaseId!,
        config.contractorCollectionId!,
        [Query.equal('$id', assignedContractors)]
      );
    
      // Send notifications with error handling
      for (const contractor of contractorsResponse.documents) {
        if (contractor.pushToken) {
          try {
            await sendPushNotification(
              contractor.pushToken,
              'New Assignment',
              'You have been assigned to a new jobsite. Check your assignments for details.'
            );
          } catch (notificationError) {
            console.error('Error sending notification to contractor:', contractor.$id, notificationError);
            // Continue with other contractors even if one fails
          }
        }
      }
      
      // Reset selections and refresh
      fetchJobsites();
      Alert.alert('Success', 'All assignments posted successfully.');
    } catch (error) {
      console.error('Error posting assignments:', error);
      Alert.alert('Error', 'Failed to post assignments.');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, date?: Date) => {
    setExpandedDate(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const filteredJobsites = jobsites.filter(jobsite =>
    jobsite.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    jobsite.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search jobsites..."
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={styles.dateSection}>
        <Text style={styles.dateLabel}>Select Date:</Text>
        <Text 
          style={styles.dateValue}
          onPress={() => setExpandedDate(!expandedDate)}
        >
          {selectedDate.toLocaleDateString()}
        </Text>
        {expandedDate && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="inline"
            onChange={handleDateChange}
            minimumDate={new Date()}
            style={[
              styles.datePicker,
              { height: 300 }
            ]}
          />
        )}
      </View>

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
          data={filteredJobsites}
          keyExtractor={(item) => item.$id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

export default Assign;
