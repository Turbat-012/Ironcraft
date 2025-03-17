import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases } from '@/lib/appwrite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Query, ID } from 'react-native-appwrite';
import CustomButton from '@/components/CustomButton';
import {config} from '@/constants/config';

// export const config = {
//     platform: "com.jsm.ironcraft",
//     endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
//     projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
//     databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
//     contractorCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID,
//     hoursCollectionId: process.env.EXPO_PUBLIC_APPWRITE_HOURS_COLLECTION_ID,
//     jobsiteCollectionId: process.env.EXPO_PUBLIC_APPWRITE_JOB_SITES_COLLECTION_ID,
//     assignmentCollectionId: process.env.EXPO_PUBLIC_APPWRITE_ASSIGNMENT_COLLECTION_ID,
//   };

const EditJobsite = () => {
  const router = useRouter();
  const { jobsiteId } = useLocalSearchParams();
  const [jobsite, setJobsite] = useState<any>(null);
  const [contractors, setContractors] = useState<any[]>([]);
  const [selectedContractors, setSelectedContractors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPosted, setIsPosted] = useState(false);

  useEffect(() => {
    if (jobsiteId) {
      loadJobsiteAndContractors();
    }
  }, [jobsiteId]);

  useEffect(() => {
    // Clear message when switching jobsites
    setMessage('');
  }, [jobsiteId]);

  const loadJobsiteAndContractors = async () => {
    setLoading(true);
    try {
      // Load jobsite details
      const jobsiteData = await databases.getDocument(
        config.databaseId!,
        config.jobsiteCollectionId!,
        jobsiteId as string
      );
      setJobsite(jobsiteData);
      setIsPosted(jobsiteData.posted || false);

      // Load all contractors
      const contractorsResponse = await databases.listDocuments(
        config.databaseId!,
        config.contractorCollectionId!
      );
      setContractors(contractorsResponse.documents);

      // Load current assignments for this jobsite with message
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [
          Query.equal('job_site_id', jobsiteId),
          Query.equal('date', new Date().toISOString().split('T')[0])
        ]
      );

      // Set initially selected contractors
      const currentlyAssigned = assignmentsResponse.documents.map(
        (assignment) => assignment.contractor_id
      );
      setSelectedContractors(currentlyAssigned);

      // Set existing message if any
      if (assignmentsResponse.documents.length > 0) {
        const existingMessage = assignmentsResponse.documents[0].message || '';
        setMessage(existingMessage);
      } else {
        setMessage(''); // Clear message if no assignments
      }

    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load jobsite and contractors.');
    } finally {
      setLoading(false);
    }
  };

  const handleContractorSelection = (contractorId: string) => {
    setSelectedContractors(prev => {
      if (prev.includes(contractorId)) {
        return prev.filter(id => id !== contractorId);
      }
      return [...prev, contractorId];
    });
  };

  const handleSave = async () => {
    if (isPosted) {
      return new Promise((resolve) => {
        Alert.alert(
          'Warning',
          'This jobsite has already been posted. Are you sure you want to modify the assignments?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Modify',
              style: 'destructive',
              onPress: async () => {
                await processAssignments(currentAssignments.documents, existingByContractor);
                resolve(true);
              }
            }
          ]
        );
      });
    } else {
      await processAssignments(currentAssignments.documents, existingByContractor);
    }
  };

  // Helper function to process the assignments
  const processAssignments = async (currentAssignments: any[], existingByContractor: any) => {
    const overrides = [];
    const today = new Date().toISOString().split('T')[0];
    
    // 1. Delete all current assignments for this jobsite
    const deleteCurrentPromises = currentAssignments.map(assignment =>
      databases.deleteDocument(
        config.databaseId!,
        config.assignmentCollectionId!,
        assignment.$id
      )
    );

    // 2. Delete assignments from other jobsites
    const deleteOtherPromises = selectedContractors
      .filter(contractorId => existingByContractor[contractorId])
      .map(contractorId => {
        const existing = existingByContractor[contractorId];
        overrides.push(existing.jobsiteName);
        return databases.deleteDocument(
          config.databaseId!,
          config.assignmentCollectionId!,
          existing.assignmentId
        );
      });

    // 3. Create new assignments for selected contractors with jobsite-specific message
    const createPromises = selectedContractors.map(contractorId =>
      databases.createDocument(
        config.databaseId!,
        config.assignmentCollectionId!,
        ID.unique(),
        {
          contractor_id: contractorId,
          job_site_id: jobsiteId,
          date: today,
          posted: false,
          message: message.trim() || null // Remove jobsite_message field
        }
      )
    );

    // Execute all operations
    await Promise.all([...deleteCurrentPromises, ...deleteOtherPromises, ...createPromises]);

    const overrideCount = overrides.length;
    const successMessage = overrideCount > 0 
      ? `Assignments updated successfully. Overrode ${overrideCount} existing assignment(s) from: ${overrides.join(', ')}`
      : 'Assignments updated successfully.';

    Alert.alert('Success', successMessage);
    router.back();
  };

  const filteredContractors = contractors.filter(contractor =>
    contractor.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.container}>
      {isPosted && (
        <View style={styles.postedBanner}>
          <Text style={styles.postedText}>
            ⚠️ Editing Posted Assignment
          </Text>
        </View>
      )}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>
          Assign Contractors to {jobsite?.name || 'Loading...'}
        </Text>
        
        {/* Add search input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search contractors..."
            placeholderTextColor="#666"
          />
        </View>
        
        {/* Main content area with contractors list - update to use filteredContractors */}
        <View style={styles.mainContent}>
          <ScrollView 
            style={styles.contractorList}
            contentContainerStyle={styles.contractorListContent}
          >
            {filteredContractors.map((contractor) => (
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
        </View>

        {/* Bottom section with message input and button */}
        <View style={styles.bottomSection}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>Additional Message (Optional):</Text>
            <TextInput
              style={styles.messageInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter message for contractors..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.buttonContainer}>
            <CustomButton 
              title={loading ? 'Updating...' : 'Update Assignments'} 
              handlePress={handleSave}
              containerStyles="bg-blue-500"
              isLoading={loading}
              textStyles={undefined}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 24, // Add extra padding at bottom
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
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
  mainContent: {
    flex: 1,
    minHeight: 200, // Ensure minimum height for content
    maxHeight: '50%', // Limit maximum height
  },
  contractorList: {
    flex: 1,
  },
  contractorListContent: {
    paddingBottom: 8,
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
  bottomSection: {
    marginTop: 16,
    paddingBottom: 16,
  },
  messageContainer: {
    marginBottom: 16,
  },
  messageLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: '#333333',
    color: 'white',
    borderRadius: 5,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    maxHeight: 100, // Reduced max height
    textAlignVertical: 'top'
  },
  buttonContainer: {
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  postedBanner: {
    backgroundColor: '#FFA500',
    padding: 8,
    marginBottom: 16,
    borderRadius: 4,
  },
  postedText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  }
});

export default EditJobsite;