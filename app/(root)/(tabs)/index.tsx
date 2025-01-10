import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, Linking, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { useGlobalContext } from '@/lib/global-provider';
import { getJobsiteForTomorrow } from '@/lib/appwrite';

const Index = () => {
  const { user } = useGlobalContext();
  const [jobsite, setJobsite] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobsite = async () => {
      if (user) {
        try {
          const jobsiteData = await getJobsiteForTomorrow(user.$id);
          setJobsite(jobsiteData);
        } catch (error) {
          console.error('Error fetching jobsite:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchJobsite();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Ironcraft App</Text>
      <Link href="/sign-in" style={styles.link}>Sign In</Link>
      <View style={styles.assignmentContainer}>
        <Text style={styles.assignmentTitle}>Jobsite for Tomorrow</Text>
        {jobsite ? (
          <>
            <Text style={styles.jobsiteText}>Location: {jobsite.location}</Text>
            <Text style={styles.jobsiteText}>Address: {jobsite.address}</Text>
            <Text style={styles.jobsiteText}>Time: {jobsite.time}</Text>
            <Text style={styles.jobsiteText}>Description: {jobsite.description}</Text>
            <Text style={styles.mapLink} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(jobsite.address)}`)}>
              View on Google Maps
            </Text>
          </>
        ) : (
          <Text style={styles.noJobsiteText}>No jobsite assigned for tomorrow.</Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  link: {
    fontSize: 18,
    color: 'blue',
    marginBottom: 20,
  },
  assignmentContainer: {
    width: '100%',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  assignmentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  jobsiteText: {
    fontSize: 16,
    marginBottom: 5,
  },
  mapLink: {
    fontSize: 16,
    color: 'blue',
    textDecorationLine: 'underline',
    marginTop: 10,
  },
  noJobsiteText: {
    fontSize: 16,
    color: 'red',
  },
});

export default Index;