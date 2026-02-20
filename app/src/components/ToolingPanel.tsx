import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ToolingStep } from "./ToolingStep";

interface ToolingPanelProps {
  steps: Array<{ icon: string; text: string }>;
  theme: any;
}

export function ToolingPanel({ steps, theme }: ToolingPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (steps.length === 0) return null;

  return (
    <View style={[styles.container, { borderColor: theme.borderColor }]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <Ionicons
            name="close"
            size={16}
            color={theme.mutedForegroundColor}
            style={styles.closeIcon}
          />
          <Text style={[styles.title, { color: theme.textColor }]}>
            Summary
          </Text>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.mutedForegroundColor}
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {steps.map((step, index) => (
            <ToolingStep
              key={index}
              icon={step.icon}
              text={step.text}
              theme={theme}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 16,
    marginRight: 16,
    marginTop: 10,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  closeIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    padding: 8,
  },
});
