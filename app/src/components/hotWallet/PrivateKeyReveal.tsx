import { View, Text, StyleSheet } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../../context";

interface PrivateKeyRevealProps {
  privateKey: string;
}

export function PrivateKeyReveal({ privateKey }: PrivateKeyRevealProps) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Private Key</Text>
      <Text style={styles.value} selectable>
        {privateKey}
      </Text>
      <Text style={styles.warning}>
        Auto-hides in 30 seconds. Do not share this with anyone.
      </Text>
    </View>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    card: {
      backgroundColor: "rgba(234, 179, 8, 0.08)",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: "rgba(234, 179, 8, 0.25)",
      marginBottom: 12,
    },
    label: {
      fontSize: 12,
      fontFamily: theme.semiBoldFont,
      color: "#EAB308",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 8,
    },
    value: {
      fontSize: 13,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      lineHeight: 20,
      marginBottom: 8,
    },
    warning: {
      fontSize: 11,
      fontFamily: theme.lightFont,
      color: theme.mutedForegroundColor,
    },
  });
