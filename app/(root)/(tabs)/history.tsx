import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { scaledSize } from '@/lib/textScaling';
import { globalStyles } from '@/styles/globalStyles';

const HistoryScreen = ({ history }) => {
  const renderItem = ({ item }) => (
    <View style={globalStyles.card}>
      <Text style={globalStyles.header}>{item.title}</Text>
      <View style={styles.row}>
        <Text style={globalStyles.label}>Amount:</Text>
        <Text style={styles.value}>{item.amount}</Text>
      </View>
      <View style={styles.row}>
        <Text style={globalStyles.label}>Date:</Text>
        <Text style={styles.date}>{item.date}</Text>
      </View>
      <View style={styles.row}>
        <Text style={globalStyles.label}>Total:</Text>
        <Text style={styles.totalAmount}>{item.total}</Text>
      </View>
    </View>
  );

  return (
    <View style={globalStyles.container}>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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