import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAllTubeLines, TubeLineInfo } from '@/src/hooks/useTubeLines';
import { getTextColorForLine } from '@/src/constants/tubeLines';

export default function LinesScreen() {
  const router = useRouter();
  const { lines, loading } = useAllTubeLines();

  // Sort lines alphabetically
  const sortedLines = [...lines].sort((a, b) => a.name.localeCompare(b.name));

  const handleLinePress = (line: TubeLineInfo) => {
    router.push(`/line/${line.id}`);
  };

  const renderItem = ({ item }: { item: TubeLineInfo }) => {
    const textColor = getTextColorForLine(item.tflId);

    return (
      <Pressable
        style={({ pressed }) => [styles.lineCard, pressed && styles.pressed]}
        onPress={() => handleLinePress(item)}
      >
        <View style={[styles.lineColorBar, { backgroundColor: item.color }]} />
        <View style={styles.lineContent}>
          <Text style={styles.lineName}>{item.name}</Text>
          <Text style={styles.lineSubtext}>View all stations</Text>
        </View>
        <Text style={styles.chevron}>{'>'}</Text>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6b4c35" />
      </View>
    );
  }

  if (lines.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🚇</Text>
        <Text style={styles.emptyTitle}>No lines available</Text>
        <Text style={styles.emptySubtitle}>
          Download station data from the Stations tab to see tube lines
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={sortedLines}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    maxWidth: 280,
  },
  listContent: {
    paddingVertical: 8,
  },
  lineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  lineColorBar: {
    width: 8,
    height: '100%',
    minHeight: 70,
  },
  lineContent: {
    flex: 1,
    padding: 16,
  },
  lineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  lineSubtext: {
    fontSize: 14,
    color: '#666',
  },
  chevron: {
    fontSize: 20,
    color: '#999',
    paddingRight: 16,
  },
});
