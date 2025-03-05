import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { databases } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { ID, Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

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

const Index = () => {
  const { user, loading } = useGlobalContext();
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [expandedDate, setExpandedDate] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user, selectedDate]); // Add selectedDate as dependency

  const handleDateChange = (event: any, date?: Date) => {
    setExpandedDate(Platform.OS === 'ios');
    if (date) {
      setSelectedDate(date);
    }
  };

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];

      // Fetch assignments for the contractor
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [
          Query.equal('contractor_id', user.$id),
          Query.equal('posted', true),
          Query.greaterThanEqual('date', dateString)
        ]
      );

      console.log('Assignments fetched:', assignmentsResponse.documents);

      // Fetch job site details for each assignment
      const assignmentsWithJobsite = await Promise.all(
        assignmentsResponse.documents.map(async (assignment) => {
          const jobsiteResponse = await databases.getDocument(
            config.databaseId!,
            config.jobsiteCollectionId!,
            assignment.job_site_id
          );
          return {
            ...assignment,
            jobsite: jobsiteResponse,
          };
        })
      );

      setAssignments(assignmentsWithJobsite);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  if (loading || loadingAssignments) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <SafeAreaView>
        <Text style={styles.title}>Assignments</Text>
        
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

        {assignments.length > 0 ? (
          assignments.map((assignment) => (
            <View key={assignment.$id} style={styles.assignmentItem}>
              <Text style={styles.assignmentText}>
                {new Date(assignment.date).toLocaleDateString()} - {assignment.jobsite.name}
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.noAssignmentsText}>No assignments found.</Text>
        )}
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000000',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  assignmentItem: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginBottom: 10,
  },
  assignmentText: {
    fontSize: 16,
    color: '#ffffff',
  },
  noAssignmentsText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
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
});

export default Index;