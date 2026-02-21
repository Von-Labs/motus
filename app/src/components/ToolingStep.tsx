import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";

interface ToolingStepProps {
  icon: string;
  text: string;
  theme: any;
}

export function ToolingStep({ icon, text, theme }: ToolingStepProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: "rgba(255,255,255, 0.1)" },
        ]}
      >
        <Ionicons name={icon as any} size={16} color={theme.tintColor} />
      </View>
      <Text style={[styles.text, { color: theme.textColor }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    marginVertical: 4,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});
