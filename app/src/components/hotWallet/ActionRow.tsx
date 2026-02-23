import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useContext } from "react";
import { ThemeContext } from "../../context";
import Ionicons from "@expo/vector-icons/Ionicons";

interface ActionRowProps {
  icon: string;
  iconColor: string;
  iconBgColor: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  titleColor?: string;
  showChevron?: boolean;
  destructive?: boolean;
}

export function ActionRow({
  icon,
  iconColor,
  iconBgColor,
  title,
  subtitle,
  onPress,
  titleColor,
  showChevron = true,
  destructive = false,
}: ActionRowProps) {
  const { theme } = useContext(ThemeContext);
  const styles = getStyles(theme);

  return (
    <TouchableOpacity
      style={[styles.row, destructive && styles.destructiveRow]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, titleColor ? { color: titleColor } : null]}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={theme.mutedForegroundColor}
        />
      )}
    </TouchableOpacity>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginBottom: 8,
    },
    destructiveRow: {
      backgroundColor: "rgba(220, 38, 38, 0.06)",
      borderColor: "rgba(220, 38, 38, 0.2)",
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    textContainer: {
      flex: 1,
    },
    title: {
      fontSize: 15,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      marginBottom: 2,
    },
    subtitle: {
      fontSize: 12,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
    },
  });
