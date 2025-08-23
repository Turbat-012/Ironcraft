import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { databases } from '@/lib/appwrite';
import { ID } from 'react-native-appwrite';
import { config } from '@/constants/config';
import CustomButton from '@/components/CustomButton';
import { globalStyles } from '@/styles/globalStyles';

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompany, setNewCompany] = useState({
    name: '',
    abn: '',
    bank_anumber: '',
    bank_bsb: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const response = await databases.listDocuments(
        config.databaseId!,
        config.companiesCollectionId!
      );
      setCompanies(response.documents);
    } catch (error) {
      console.error('Error fetching companies:', error);
      Alert.alert('Error', 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async () => {
    // Validate required fields and ABN length
    if (!newCompany.name.trim()) {
      Alert.alert('Error', 'Company name is required');
      return;
    }
    
    if (!newCompany.abn.trim() || newCompany.abn.trim().length !== 11) {
      Alert.alert('Error', 'ABN must be exactly 11 digits');
      return;
    }

    setLoading(true);
    try {
      const newCompanyId = ID.unique();
      await databases.createDocument(
        config.databaseId!,
        config.companiesCollectionId!,
        newCompanyId,
        {
          name: newCompany.name.trim(),
          abn: newCompany.abn.trim(),
          bank_anumber: newCompany.bank_anumber.trim(),
          bank_bsb: newCompany.bank_bsb.trim(),
          companies_id: newCompanyId // Add this line to match schema requirement
        }
      );

      setNewCompany({
        name: '',
        abn: '',
        bank_anumber: '',
        bank_bsb: ''
      });
      setShowAddForm(false);
      fetchCompanies();
      Alert.alert('Success', 'Company added successfully');
    } catch (error) {
      console.error('Error adding company:', error);
      Alert.alert('Error', 'Failed to add company');
    } finally {
      setLoading(false);
    }
  };

  const renderCompany = ({ item }) => (
    <View style={globalStyles.companyItem}>
      <Text style={globalStyles.companyName}>{item.name}</Text>
      <Text style={globalStyles.companyDetails}>ABN: {item.abn}</Text>
      {item.bank_bsb && (
        <Text style={globalStyles.companyDetails}>BSB: {item.bank_bsb}</Text>
      )}
      {item.bank_anumber && (
        <Text style={globalStyles.companyDetails}>Account: {item.bank_anumber}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={globalStyles.container}>
      <CustomButton
        title={showAddForm ? "Cancel" : "Add New Company"}
        handlePress={() => setShowAddForm(!showAddForm)}
        containerStyles={`mb-4 ${showAddForm ? 'bg-red-500' : 'bg-blue-500'}`}
      />

      {showAddForm && (
        <View style={styles.form}>
          <TextInput
            style={globalStyles.input}
            placeholder="Company Name"
            placeholderTextColor="#666"
            value={newCompany.name}
            onChangeText={(text) => setNewCompany(prev => ({ ...prev, name: text }))}
          />
          <TextInput
            style={[
              globalStyles.input,
              newCompany.abn.length > 0 && newCompany.abn.length !== 11 && styles.inputError
            ]}
            placeholder="ABN"
            placeholderTextColor="#666"
            value={newCompany.abn}
            onChangeText={(text) => {
              // Only allow digits
              const numbersOnly = (text ?? '').replace(/[^0-9]/g, '');
              // Limit to 11 characters
              const limited = numbersOnly.slice(0, 11);
              setNewCompany(prev => ({ ...prev, abn: limited }));
            }}
            keyboardType="numeric"
            maxLength={11}
          />
          <TextInput
            style={globalStyles.input}
            placeholder="Bank BSB (Optional)"
            placeholderTextColor="#666"
            value={newCompany.bank_bsb}
            onChangeText={(text) => setNewCompany(prev => ({ ...prev, bank_bsb: text }))}
          />
          <TextInput
            style={globalStyles.input}
            placeholder="Bank Account Number (Optional)"
            placeholderTextColor="#666"
            value={newCompany.bank_anumber}
            onChangeText={(text) => setNewCompany(prev => ({ ...prev, bank_anumber: text }))}
          />
          <CustomButton
            title="Save Company"
            handlePress={handleAddCompany}
            containerStyles="bg-green-500"
            isLoading={loading}
          />
        </View>
      )}

      {loading && !showAddForm ? (
        <Text style={globalStyles.loadingText}>Loading companies...</Text>
      ) : (
        <FlatList
          data={companies}
          renderItem={renderCompany}
          keyExtractor={(item) => item.$id}
          contentContainerStyle={globalStyles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 16,
  },
  form: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#222',
    borderRadius: 8,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#F75555',
    backgroundColor: '#461818',
  },
});

export default Companies;