import Ionicons from "@expo/vector-icons/Ionicons";
import { Image, View } from "react-native";

export function MiniAvatar({
  uri,
  theme,
  size = 20,
}: {
  uri?: string | null;
  theme: any;
  size?: number;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{
          width: size,
          height: size,
          borderRadius: 999,
          borderWidth: 1.5,
          borderColor: theme.secondaryBackgroundColor,
        }}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        backgroundColor: `${theme.tintColor}20`,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        borderColor: theme.secondaryBackgroundColor,
      }}
    >
      <Ionicons name="person" size={size * 0.55} color={theme.tintColor} />
    </View>
  );
}
