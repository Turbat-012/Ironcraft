import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases } from '@/lib/appwrite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Query, ID } from 'react-native-appwrite';
import CustomButton from '@/components/CustomButton';
import {config} from '@/constants/config';

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

      // Load all contractors
      const contractorsResponse = await databases.listDocuments(
        config.databaseId!,
        config.contractorCollectionId!
      );
      setContractors(contractorsResponse.documents);

      // Load current unposted assignments for this jobsite
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [
          Query.equal('job_site_id', jobsiteId),
          Query.equal('posted', false)
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
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. Get ALL current assignments for today (from all jobsites)
      const allTodayAssignments = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [Query.equal('date', today)]
      );

      // 2. Delete assignments for contractors being removed from this jobsite
      const currentAssignments = allTodayAssignments.documents.filter(
        a => a.job_site_id === jobsiteId
      );
      
      const deletePromises = currentAssignments.map(assignment =>
        databases.deleteDocument(
          config.databaseId!,
          config.assignmentCollectionId!,
          assignment.$id
        )
      );

      // 3. Delete assignments from other jobsites for reassigned contractors
      const otherJobsiteAssignments = allTodayAssignments.documents.filter(
        a => a.job_site_id !== jobsiteId && selectedContractors.includes(a.contractor_id)
      );

      const reassignmentDeletePromises = otherJobsiteAssignments.map(assignment =>
        databases.deleteDocument(
          config.databaseId!,
          config.assignmentCollectionId!,
          assignment.$id
        )
      );

      // 4. Execute all deletions
      await Promise.all([...deletePromises, ...reassignmentDeletePromises]);

      // 5. Create new assignments for selected contractors
      const createPromises = selectedContractors.map(contractorId =>
        databases.createDocument(
          config.databaseId!,
          config.assignmentCollectionId!,
          ID.unique(),
          {
            contractor_id: contractorId,
            job_site_id: jobsiteId,
            message: message.trim() || null,
            date: today,
            posted: false
          }
        )
      );

      await Promise.all(createPromises);

      Alert.alert(
        'Success',
        'Assignments saved successfully. Use "Post All Job Sites" to finalize and notify contractors.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving assignments:', error);
      Alert.alert('Error', 'Failed to save assignments');
    } finally {
      setLoading(false);
    }
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