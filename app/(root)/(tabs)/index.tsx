import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Platform, FlatList } from 'react-native';
import { databases } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { ID, Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import {config} from '@/constants/config';
import { globalStyles } from '@/styles/globalStyles';

const Index = () => {
  const { user, loading } = useGlobalContext();
  interface Assignment {
    $id: string;
    date: string;
    job_site_id: string;
    message?: string;
    jobsite: {
      name: string;
      address: string;
    };
  }

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      // Get today's date at midnight
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];

      console.log('Today\'s date for comparison:', todayString); // Debug log

      // Fetch assignments for the contractor
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [
          Query.equal('contractor_id', user.$id),
          Query.equal('posted', true),
          Query.greaterThanEqual('date', todayString) // This ensures we only get today and future dates
        ]
      );

      console.log('Fetched assignments:', assignmentsResponse.documents); // Debug log

      // Filter out any assignments from before today (extra safety check)
      const futureAssignments = assignmentsResponse.documents.filter(assignment => {
        const assignmentDate = new Date(assignment.date);
        assignmentDate.setHours(0, 0, 0, 0);
        return assignmentDate >= today;
      });

      // Fetch job site details for each assignment
      const assignmentsWithJobsite = await Promise.all(
        futureAssignments.map(async (assignment) => {
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

      // Sort assignments by date
      const sortedAssignments = assignmentsWithJobsite.sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setAssignments(sortedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoadingAssignments(false);
    }
  };

  if (loading || loadingAssignments) {
    return (
      <View style={globalStyles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={globalStyles.container}>
      <Text style={globalStyles.title}>Upcoming Assignments</Text>

      {assignments.length > 0 ? (
        <FlatList
          data={assignments}
          renderItem={({ item }) => (
            <View style={styles.assignmentItem}>
              <Text style={globalStyles.jobsiteName}>{item.jobsite.name}</Text>
              <Text style={styles.addressText}>{item.jobsite.address}</Text>
              <Text style={styles.assignmentDate}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
              {item.message && (
                <View style={globalStyles.messageContainer}>
                  <Text style={globalStyles.messageLabel}>Message:</Text>
                  <Text style={styles.messageText}>{item.message}</Text>
                </View>
              )}
            </View>
          )}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
        <Text style={styles.noAssignmentsText}>No upcoming assignments found.</Text>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  assignmentItem: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  noAssignmentsText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
  },
  assignmentDate: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 4,
    fontWeight: 'bold',
  },
  messageText: {
    color: 'white',
    fontSize: 14,
  },
  addressText: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
    fontStyle: 'italic',
  },
});

export default Index;