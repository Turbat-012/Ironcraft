import { View, Text, Button, Alert, FlatList, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases } from '@/lib/appwrite';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Query, ID } from 'react-native-appwrite';
import { useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';
import React, { useState, useEffect, useCallback } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';
import {config} from '@/constants/config';
import { sendPushNotification } from '@/lib/notifications';
import { globalStyles } from '@/styles/globalStyles';

const styles = StyleSheet.create({  
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
  searchContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
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
      pathname: '/(admin)/EditJobsite',
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
      // Check for existing posted assignments on the selected date
      const existingAssignments = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [
          Query.equal('posted', true),
          Query.equal('date', selectedDate.toISOString().split('T')[0])
        ]
      );
  
      if (existingAssignments.documents.length > 0) {
        const shouldOverride = await new Promise((resolve) => {
          Alert.alert(
            'Warning',
            'There are existing assignments for this date. Do you want to override them?',
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Override', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });
  
        if (!shouldOverride) {
          setLoading(false);
          return;
        }
  
        // Delete existing assignments
        const deletePromises = existingAssignments.documents.map(assignment =>
          databases.deleteDocument(
            config.databaseId!,
            config.assignmentCollectionId!,
            assignment.$id
          )
        );
        await Promise.all(deletePromises);
      }
  
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
  
      // Update assignments with new date and posted status
      const updateAssignmentPromises = unpostedAssignments.documents.map(assignment =>
        databases.createDocument(
          config.databaseId!,
          config.assignmentCollectionId!,
          ID.unique(),
          {
            contractor_id: assignment.contractor_id,
            job_site_id: assignment.job_site_id,
            message: assignment.message || null,
            date: selectedDate.toISOString().split('T')[0],
            posted: true
          }
        )
      );
  
      await Promise.all(updateAssignmentPromises);
  
      // Send notifications to affected contractors
      const assignedContractors = unpostedAssignments.documents.map(a => a.contractor_id);
      const contractorsResponse = await databases.listDocuments(
        config.databaseId!,
        config.contractorCollectionId!,
        [Query.equal('$id', assignedContractors)]
      );
  
      // Send notifications with override message
      for (const contractor of contractorsResponse.documents) {
        if (contractor.pushToken) {
          try {
            await sendPushNotification(
              contractor.pushToken,
              'Assignment Updated',
              'Your assignment has been updated. Please check your assignments for the latest details.'
            );
          } catch (notificationError) {
            console.error('Error sending notification to contractor:', contractor.$id, notificationError);
          }
        }
      }
  
      fetchJobsites();
      Alert.alert('Success', 'Assignments posted successfully with overrides.');
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
    <SafeAreaView style={globalStyles.container}>
      <Text style={globalStyles.title}>Jobsite Assignments</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={globalStyles.searchInput}
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholder="Search jobsites..."
          placeholderTextColor="#666"
        />
      </View>
      
      <View style={globalStyles.dateSection}>
        <Text style={globalStyles.dateLabel}>Select Date:</Text>
        <Text 
          style={globalStyles.dateValue}
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
              globalStyles.datePicker,
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
        <Text style={globalStyles.loadingText}>Loading...</Text>
      ) : (
        <FlatList     
          data={filteredJobsites}
          keyExtractor={(item) => item.$id}
          renderItem={renderItem}
          contentContainerStyle={globalStyles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

export default Assign;