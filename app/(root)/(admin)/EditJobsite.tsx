import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Button, 
  Alert, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases } from '@/lib/appwrite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Query, ID } from 'react-native-appwrite';
import CustomButton from '@/components/CustomButton';
import {config} from '@/constants/config';
import { globalStyles } from '@/styles/globalStyles';

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
    <SafeAreaView style={globalStyles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={globalStyles.contentContainer}>
            {isPosted && (
              <View style={styles.postedBanner}>
                <Text style={styles.postedText}>
                  ⚠️ Editing Posted Assignment
                </Text>
              </View>
            )}
            
            <Text style={globalStyles.title}>
              Assign Contractors to {jobsite?.name || 'Loading...'}
            </Text>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={globalStyles.searchInput}
                value={searchTerm}
                onChangeText={setSearchTerm}
                placeholder="Search contractors..."
                placeholderTextColor="#666"
              />
            </View>
            
            <ScrollView 
              style={styles.mainContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
              contentContainerStyle={globalStyles.scrollContentContainer}
            >
              <View style={globalStyles.contractorListContent}>
                {filteredContractors.map((contractor) => (
                  <TouchableOpacity
                    key={contractor.$id}
                    style={[
                      globalStyles.contractorItem,
                      selectedContractors.includes(contractor.$id) && globalStyles.selectedContractorItem,
                    ]}
                    onPress={() => handleContractorSelection(contractor.$id)}
                  >
                    <Text style={globalStyles.contractorName}>{contractor.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={globalStyles.messageContainer}>
                <Text style={globalStyles.messageLabel}>Additional Message (Optional):</Text>
                <TextInput
                  style={globalStyles.messageInput}
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Enter message for contractors..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>              
              {/* Add padding at bottom of scroll to account for button */}
              <View style={{ height: 80 }} />
            </ScrollView>

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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  mainContent: {
    flex: 1,
  }, 
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'black',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 30 : 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
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
  },
  scrollContentContainer: {
    flexGrow: 1,
  }
});

export default EditJobsite;