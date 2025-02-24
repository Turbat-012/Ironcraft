import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { databases } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { ID, Query } from 'react-native-appwrite';
import { SafeAreaView } from 'react-native-safe-area-context';

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

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayString = today.toISOString().split('T')[0];

      // Fetch assignments for the contractor
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [Query.equal('contractor_id', user.$id), Query.equal('posted', true), Query.greaterThanEqual('date', todayString)]
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
});

export default Index;

/*import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Linking } from 'react-native';
import { databases } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { ID, Query } from 'react-native-appwrite';

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
  const [jobsite, setJobsite] = useState(null);
  const [assignmentDate, setAssignmentDate] = useState(null);
  const [loadingAssignments, setLoadingAssignments] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    setLoadingAssignments(true);
    try {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
  
      // Step 1: Fetch contractor document to get contractor_id
      const contractorResponse = await databases.listDocuments(
        config.databaseId!,
        config.contractorCollectionId!,
        [Query.equal('$id', user.$id)] // Assuming `id` links the user to the contractor
      );
  
      const contractor = contractorResponse.documents[0];
      const contractorId = contractor.contractor_id;
  
      // Step 2: Query assignments for the contractor
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [
          Query.equal(`contractor_id`, contractorId),
          Query.equal(`date`, tomorrowString),
          Query.equal(`posted`, true),
        ]
      );
  
      if (assignmentsResponse.documents.length > 0) {
        const assignment = assignmentsResponse.documents[0];
  
        // Fetch the job site document using the `id` field
        const jobsiteResponse = await databases.listDocuments(
          config.databaseId!,
          config.jobsiteCollectionId!,
          [Query.equal('id', assignment.job_site_id)] // Use the `id` field
        );
  
        if (jobsiteResponse.documents.length > 0) {
          setJobsite(jobsiteResponse.documents[0]);
        } else {
          setJobsite(null);
        }
  
        setAssignmentDate(tomorrowString);
      } else {
        setJobsite(null);
        setAssignmentDate(tomorrowString);
      }
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
    <View style={styles.container}>
      <View style={styles.assignmentContainer}>
        <Text style={styles.assignmentTitle}>Jobsite for Tomorrow</Text>
        {assignmentDate ? (
          jobsite ? (
            <>
              <Text style={styles.jobsiteText}>Location: {jobsite.location}</Text>
              <Text style={styles.jobsiteText}>Address: {jobsite.address}</Text>
              <Text style={styles.mapLink} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(jobsite.address)}`)}>
                View on Google Maps
              </Text>
            </>
          ) : (
            <Text style={styles.noJobsiteText}>It seems like there's no job on {assignmentDate}.</Text>
          )
        ) : (
          <Text style={styles.noJobsiteText}>Assignment hasn't been posted yet.</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#000000',
  },
  assignmentContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
  },
  assignmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  jobsiteText: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 8,
  },
  mapLink: {
    fontSize: 16,
    color: '#1e90ff',
    textDecorationLine: 'underline',
  },
  noJobsiteText: {
    fontSize: 16,
    color: '#ffffff',
  },
});

export default Index;*/