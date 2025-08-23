import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, Modal, TextInput } from 'react-native';
import { useGlobalContext } from '@/lib/global-provider';
import { databases } from '@/lib/appwrite'; // Ensure you have the correct import for databases
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '@/styles/globalStyles';

const Contractors = () => {
  const { user } = useGlobalContext();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContractor, setSelectedContractor] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [hourlyRate, setHourlyRate] = useState('');

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

  const handleContractorPress = (contractor) => {
    setSelectedContractor(contractor);
    setHourlyRate(contractor.hourly_rate?.toString() || '');
    setIsModalVisible(true);
  };

  const handleUpdateHourlyRate = async () => {
    if (!hourlyRate || isNaN(parseFloat(hourlyRate))) {
      Alert.alert('Error', 'Please enter a valid hourly rate');
      return;
    }

    try {
      await databases.updateDocument(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.EXPO_PUBLIC_APPWRITE_CONTRACTORS_COLLECTION_ID!,
        selectedContractor.$id,
        {
          hourly_rate: parseFloat(hourlyRate)
        }
      );

      // Update local state
      setContractors(contractors.map(c => 
        c.$id === selectedContractor.$id 
          ? { ...c, hourly_rate: parseFloat(hourlyRate) }
          : c
      ));

      Alert.alert('Success', 'Hourly rate updated successfully');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating hourly rate:', error);
      Alert.alert('Error', 'Failed to update hourly rate');
    }
  };

  const renderContractor = ({ item }) => (
    <TouchableOpacity
      style={styles.contractorItem}
      onPress={() => handleContractorPress(item)}
    >
      <View>
        <Text style={styles.contractorName}>{item.name}</Text>
        <Text style={styles.hourlyRate}>
          Rate: ${item.hourly_rate ? item.hourly_rate.toFixed(2) : 'Not set'}/hr
        </Text>
      </View>
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
        <>
          <FlatList
            data={contractors}
            keyExtractor={(item) => item.$id}
            renderItem={renderContractor}
            contentContainerStyle={globalStyles.listContainer}
          />

          <Modal
            visible={isModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Set Hourly Rate for {selectedContractor?.name}
                </Text>
                <TextInput
                  style={styles.input}
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  keyboardType="decimal-pad"
                  placeholder="Enter hourly rate"
                  placeholderTextColor="#666"
                />
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.button, styles.saveButton]}
                    onPress={handleUpdateHourlyRate}
                  >
                    <Text style={styles.buttonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
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
  hourlyRate: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  deleteButton: {
    color: 'red',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#333',
    color: 'white',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  saveButton: {
    backgroundColor: '#0061ff',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Contractors;