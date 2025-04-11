import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useGlobalContext } from '@/lib/global-provider';
import { databases } from '@/lib/appwrite'; // Ensure you have the correct import for databases
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '@/styles/globalStyles';

const AdminContractors = () => {
  const { user } = useGlobalContext();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const response = await databases.listDocuments(
          process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID!
        );
        setContractors(response.documents);
      } catch (error) {
        console.error('Error fetching contractors:', error);
        Alert.alert('Error', 'Failed to fetch contractors.');
      } finally {
        setLoading(false);
      }
    };

    fetchContractors();
  }, []);

  const handleDelete = (contractorId: string) => {
    Alert.alert(
      'Are you sure?',
      'Do you really want to delete this contractor?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databases.deleteDocument(
                process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
                process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID!,
                contractorId
              );
              setContractors(contractors.filter(contractor => contractor.$id !== contractorId));
              Alert.alert('Success', 'Contractor deleted successfully.');
            } catch (error) {
              console.error('Error deleting contractor:', error);
              Alert.alert('Error', 'Failed to delete contractor.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderContractor = ({ item }) => (
    <TouchableOpacity
      style={styles.contractorItem}
      onPress={() => Alert.alert('Contractor Details', `Email: ${item.email}\nPhone: ${item.phone}`)}
    >
      <Text style={styles.contractorName}>{item.name}</Text>
      <TouchableOpacity onPress={() => handleDelete(item.$id)}>
        <Text style={styles.deleteButton}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <Text style={globalStyles.title}>Contractors</Text>
      {loading ? (
        <Text style={globalStyles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={contractors}
          keyExtractor={(item) => item.$id}
          renderItem={renderContractor}
          contentContainerStyle={globalStyles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  contractorItem: {
    backgroundColor: '#333',
    padding: 16,
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractorName: {
    color: 'white',
    fontSize: 18,
  },
  deleteButton: {
    color: 'red',
    fontSize: 16,
  },
});

export default AdminContractors;