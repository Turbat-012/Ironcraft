import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { scaledSize } from '@/lib/textScaling';

const HistoryScreen = ({ history }) => {
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.header}>{item.title}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Amount:</Text>
        <Text style={styles.value}>{item.amount}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Total:</Text>
        <Text style={styles.totalAmount}>{item.total}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {history.length > 0 ? (
        <FlatList
          data={history}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
        />
      ) : (
        <Text style={styles.noDataText}>No history available</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    padding: 16,
  },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    fontSize: scaledSize(20),
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: scaledSize(14),
    color: '#999',
  },
  value: {
    fontSize: scaledSize(14),
    color: 'white',
    fontWeight: '500',
  },
  date: {
    fontSize: scaledSize(12),
    color: '#666',
    marginTop: 8,
  },
  totalAmount: {
    fontSize: scaledSize(18),
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: scaledSize(16),
    color: 'white',
    textAlign: 'center',
    marginTop: 20,
  }
});

export default HistoryScreen;