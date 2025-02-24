// import React, { useState, useEffect } from 'react';
// import { View, Text, Button, Alert, StyleSheet, Platform, ScrollView, TouchableOpacity, FlatList } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import DateTimePicker from '@react-native-community/datetimepicker';
// import { databases } from '@/lib/appwrite';
// import { Picker } from '@react-native-picker/picker';
// import { ID, Query } from 'react-native-appwrite';


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

// const Assign = () => {
//   const [contractors, setContractors] = useState([]);
//   const [jobSites, setJobSites] = useState([]);
//   const [selectedContractors, setSelectedContractors] = useState([]);
//   const [selectedJobSite, setSelectedJobSite] = useState(null);
//   const [assignmentDate, setAssignmentDate] = useState(new Date());
//   const [showDatePicker, setShowDatePicker] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [postedDate, setPostedDate] = useState<string | null>(null);

//   useEffect(() => {
//     fetchContractors();
//     fetchJobSites();
//   }, []);

//   const fetchContractors = async () => {
//     try {
//       const response = await databases.listDocuments(
//         config.databaseId!,
//         config.contractorCollectionId!
//       );
//       setContractors(response.documents);
//     } catch (error) {
//       console.error('Error fetching contractors:', error);
//       Alert.alert('Error', 'Failed to fetch contractors.');
//     }
//   };

//   const fetchJobSites = async () => {
//     try {
//       const response = await databases.listDocuments(
//         config.databaseId!,
//         config.jobsiteCollectionId!
//       );
//       setJobSites(response.documents);
//     } catch (error) {
//       console.error('Error fetching job sites:', error);
//       Alert.alert('Error', 'Failed to fetch job sites.');
//     }
//   };

//   const handleContractorSelection = (contractorId: string) => {
//     setSelectedContractors((prevSelected) => {
//       if (prevSelected.includes(contractorId)) {
//         return prevSelected.filter((id) => id !== contractorId);
//       } else {
//         return [...prevSelected, contractorId];
//       }
//     });
//   };

//   const handleAssign = async () => {
//     if (selectedContractors.length === 0 || !selectedJobSite) {
//       Alert.alert('Validation Error', 'Please select at least one contractor and a job site.');
//       return;
//     }

//     setLoading(true);
//     try {
      
//       // Step 1: Find the contractor_id and id for assignments
//       const selectedContractorIds = contractors
//         .filter((contractor) => selectedContractors.includes(contractor.$id)) // Match selected contractor document IDs
//         .map((contractor) => contractor.contractor_id); // Extract contractor_id

//       const selectedJobSiteObj = jobSites.find((jobSite) => jobSite.$id === selectedJobSite);
//       const selectedJobSiteId = selectedJobSiteObj?.$id; // Extract id

//       console.log(selectedJobSiteObj);

//       if (!selectedJobSiteId) {
//         Alert.alert('Validation Error', 'Invalid job site selected.');
//         return;
//       }

//       const assignments = selectedContractors.map((contractorId) => ({
//         contractor_id: contractorId,
//         job_site_id: selectedJobSite,
//         date: assignmentDate.toISOString(),
//         posted: false, // Initially set to false
//       }));

//       const assignmentPromises = assignments.map((assignment) =>
//         databases.createDocument(
//           config.databaseId!,
//           config.assignmentCollectionId!,
//           ID.unique(),
//           assignment
//         )
//       );

//       await Promise.all(assignmentPromises);

//       Alert.alert('Success', 'Contractors assigned to job site successfully.');
//     } catch (error) {
//       console.error('Error assigning contractors:', error);
//       Alert.alert('Error', 'Failed to assign contractors.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handlePostJobSite = async () => {
//     if (!selectedJobSite) {
//       Alert.alert('Validation Error', 'Please select a job site.');
//       return;
//     }

//     console.log('Selected Job Site ID:', selectedJobSite,'line 113 and 122');
    
//     setLoading(true);
//     try {

//       const selectedJobSiteObj = jobSites.find((jobSite) => jobSite.$id === selectedJobSite); // Match custom "id"
//       const documentId = selectedJobSiteObj?.$id;

//       const response = await databases.updateDocument(
//         config.databaseId!,
//         config.jobsiteCollectionId!,
//         config.assignmentCollectionId,
//         { posted: true }
//       );
      
//      console.log('Response from updateDocument:', response);

//      const assignmentsResponse = await databases.listDocuments(
//       config.databaseId!,
//       config.assignmentCollectionId!,
//       [Query.equal('job_site_id', selectedJobSite)]
//      );

//      const updatePromises = assignmentsResponse.documents.map((assignment: any) =>
//       databases.updateDocument(
//         config.databaseId!,
//         config.assignmentCollectionId!,
//         assignment.$job_site_id,
//         { posted: true }
//       )
//     );

//     await Promise.all(updatePromises);

//       setPostedDate(assignmentDate.toLocaleDateString());

//       Alert.alert('Success', 'Job site posted successfully.');
//     } catch (error) {
//       console.error('Error posting job site:', error);
//       Alert.alert('Error', 'Failed to post job site.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleDateChange = (event: any, selectedDate?: Date) => {
//     const currentDate = selectedDate || assignmentDate;
//     setShowDatePicker(Platform.OS === 'ios');
//     setAssignmentDate(currentDate);
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {postedDate && (
//         <Text style={styles.postedDateText}>Assignment Date: {postedDate}</Text>
//       )}
//       <Text style={styles.title}>Assign Contractors to Job Sites</Text>
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Select Contractors:</Text>
//         <ScrollView style={styles.contractorList}>
//           {contractors.map((contractor) => (
//             <TouchableOpacity
//               key={contractor.$id}
//               style={[
//                 styles.contractorItem,
//                 selectedContractors.includes(contractor.$id) && styles.selectedContractorItem,
//               ]}
//               onPress={() => handleContractorSelection(contractor.$id)}
//             >
//               <Text style={styles.contractorName}>{contractor.name}</Text>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       </View>
//       <View style={styles.pickerContainer}>
//         <Text style={styles.label}>Select Job Site:</Text>
//         <Picker
//           selectedValue={selectedJobSite}
//           onValueChange={(itemValue) => setSelectedJobSite(itemValue)}
//         >
//           {jobSites.map((jobSite) => (
//             <Picker.Item key={jobSite.$id} label={jobSite.name} value={jobSite.$id} />
//           ))}
//         </Picker>
//       </View>
//       <View style={styles.datePickerContainer}>
//         <Button title="Choose Assignment Date" onPress={() => setShowDatePicker(true)} />
//         <Text style={styles.dateText}>{assignmentDate.toLocaleDateString()}</Text>
//       </View>
//       {showDatePicker && (
//         <DateTimePicker
//           value={assignmentDate}
//           mode="date"
//           display="default"
//           onChange={handleDateChange}
//           minimumDate={new Date()} // Set minimum date to current date
//         />
//       )}
//       <Button title="Assign Contractors" onPress={handleAssign} disabled={loading} />
//       <Button title="Post Job Site" onPress={handlePostJobSite} disabled={loading} />
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: 'black',
//     padding: 16,
//   },
//   postedDateText: {
//     color: 'white',
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   title: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'white',
//     marginBottom: 20,
//     textAlign: 'center',
//   },
//   pickerContainer: {
//     marginBottom: 20,
//   },
//   label: {
//     color: 'white',
//     marginBottom: 10,
//   },
//   contractorList: {
//     maxHeight: 200,
//     borderWidth: 1,
//     borderColor: 'white',
//     borderRadius: 5,
//   },
//   contractorItem: {
//     padding: 10,
//     borderBottomWidth: 1,
//     borderBottomColor: 'white',
//   },
//   selectedContractorItem: {
//     backgroundColor: 'gray',
//   },
//   contractorName: {
//     color: 'white',
//   },
//   datePickerContainer: {
//     marginBottom: 20,
//   },
//   dateText: {
//     color: 'white',
//     textAlign: 'center',
//     marginTop: 10,
//   },
// });

// export default Assign;

import React, { useState, useEffect } from 'react';
import { View, Text, Button, Alert, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases } from '@/lib/appwrite';
import { useNavigation } from '@react-navigation/native';
import { Query } from 'react-native-appwrite';
import { useRouter } from 'expo-router';
import CustomButton from '@/components/CustomButton';

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

  const handlePostJob = async (jobsiteId: string) => {
    try {
      // Update jobsite to posted
      await databases.updateDocument(
        config.databaseId!,
        config.jobsiteCollectionId!,
        jobsiteId,
        { posted: true }
      );

      // Get all assignments for this jobsite
      const assignmentsResponse = await databases.listDocuments(
        config.databaseId!,
        config.assignmentCollectionId!,
        [Query.equal('job_site_id', jobsiteId)]
      );

      // Update all assignments to posted
      const updatePromises = assignmentsResponse.documents.map((assignment: any) =>
        databases.updateDocument(
          config.databaseId!,
          config.assignmentCollectionId!,
          assignment.$id,
          { posted: true }
        )
      );

      await Promise.all(updatePromises);
      Alert.alert('Success', 'Job site posted successfully.');
      
      // Refresh the jobsites list
      fetchJobsites();
    } catch (error) {
      console.error('Error posting job site:', error);
      Alert.alert('Error', 'Failed to post job site.');
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
        <CustomButton 
          title="Post Job Site"
          handlePress={() => handlePostJob(item.$id)}
          containerStyles="mt-2 bg-blue-500"
          isLoading={undefined}
          textStyles={undefined}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Jobsite Assignments</Text>
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