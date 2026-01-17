import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { TubeLineInfo } from '../hooks/useTubeLines';
import { TUBE_LINE_COLORS, getTextColorForLine } from '../constants/tubeLines';

interface LineFilterProps {
  lines: TubeLineInfo[];
  selectedLines: string[];
  onToggleLine: (tflId: string) => void;
}

export function LineFilter({ lines, selectedLines, onToggleLine }: LineFilterProps) {
  if (lines.length === 0) return null;

  // Sort lines alphabetically
  const sortedLines = [...lines].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortedLines.map((line) => {
          const isSelected = selectedLines.includes(line.tflId);
          const bgColor = line.color || TUBE_LINE_COLORS[line.tflId] || '#666';
          const textColor = getTextColorForLine(line.tflId);

          return (
            <Pressable
              key={line.id}
              onPress={() => onToggleLine(line.tflId)}
              style={[
                styles.badge,
                {
                  backgroundColor: isSelected ? bgColor : '#f0f0f0',
                  borderColor: bgColor,
                  borderWidth: isSelected ? 0 : 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: isSelected ? textColor : bgColor,
                  },
                ]}
                numberOfLines={1}
              >
                {line.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {selectedLines.length > 0 && (
        <Pressable
          style={styles.clearButton}
          onPress={() => selectedLines.forEach((id) => onToggleLine(id))}
        >
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  scrollContent: {
    gap: 8,
    paddingRight: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  clearText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
});
