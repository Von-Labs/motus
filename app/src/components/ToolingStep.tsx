import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ToolingStepProps {
  icon: string;
  text: string;
  theme: any;
}

export function ToolingStep({ icon, text, theme }: ToolingStepProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: 'rgba(0, 229, 229, 0.1)' }]}>
        <Ionicons name={icon as any} size={16} color={theme.tintColor} />
      </View>
      <Text style={[styles.text, { color: theme.textColor }]}>{text}</Text>
      <Ionicons name="chevron-forward" size={16} color={theme.mutedForegroundColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    marginVertical: 4,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
});
