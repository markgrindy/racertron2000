import React, { useState, useEffect, useContext } from 'react';
import { RaceContext } from '../RaceContext';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadRaces } from '../utils/storage';
import { exportRaceToCSV } from '../utils/exportCsv';

export default function ResultsDetail({ route }) {
  const { raceId } = route.params;
  const [race, setRace] = useState(null);
  const { finishers, addFinisher, removeFinisher, clearRace } = useContext(RaceContext);

  useEffect(() => {
    const fetchRace = async () => {
      const allRaces = await loadRaces();
      const found = allRaces.find((r) => r.id === raceId);
      setRace(found || null);
    };
    fetchRace();
  }, [raceId]);

  if (!race) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Text style={styles.title}>Race {race.id}</Text>
      <FlatList
        data={race.finishers}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Text style={styles.finisher}>
            {index + 1}. {item} sec
          </Text>
        )}
      />
      {race.finishers.length > 0 && (
        <View style={styles.exportButton}>
          <Button title="Export to CSV" onPress={() => exportRaceToCSV(race)} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  finisher: {
    fontSize: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  exportButton: {
    marginTop: 20,
  },
});
