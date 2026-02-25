import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { useContentLikes } from "../../context/ProfileContext";
import { truncateAddress } from "../../utils/formatAddress";
import { MiniAvatar } from "./MiniAvatar";
import type { NewsFeedStyles } from "./newsFeedStyles";

export function LikesSection({
  contentId,
  likeCount,
  theme,
  styles,
}: {
  contentId: string | undefined;
  likeCount: number;
  theme: any;
  styles: NewsFeedStyles;
}) {
  const { data } = useContentLikes(contentId);
  const profiles = data?.profiles ?? [];

  if (likeCount === 0 && profiles.length === 0) return null;

  return (
    <View style={styles.socialSection}>
      <View style={styles.socialHeaderRow}>
        <Ionicons name="heart" size={14} color="#ef4444" />
        <Text style={styles.socialHeaderText}>
          {likeCount} {likeCount === 1 ? "like" : "likes"}
        </Text>
      </View>
      {profiles.length > 0 && (
        <View style={styles.profileChipsRow}>
          <View style={styles.avatarStack}>
            {profiles.slice(0, 5).map((p, i) => (
              <View
                key={p.id}
                style={{ marginLeft: i > 0 ? -6 : 0, zIndex: 5 - i }}
              >
                <MiniAvatar uri={p.image} theme={theme} size={22} />
              </View>
            ))}
          </View>
          <Text style={styles.profileNamesText} numberOfLines={1}>
            {profiles
              .slice(0, 3)
              .map((p) => truncateAddress(p.username))
              .join(", ")}
            {data && data.total > 3 ? ` and ${data.total - 3} more` : ""}
          </Text>
        </View>
      )}
    </View>
  );
}
