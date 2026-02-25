import Ionicons from "@expo/vector-icons/Ionicons";
import { Text, View } from "react-native";
import { useContentComments } from "../../context/ProfileContext";
import { truncateAddress } from "../../utils/formatAddress";
import { MiniAvatar } from "./MiniAvatar";
import { formatTimeAgo, type NewsFeedStyles } from "./newsFeedStyles";

export function CommentsSection({
  contentId,
  commentCount,
  theme,
  styles,
}: {
  contentId: string | undefined;
  commentCount: number;
  theme: any;
  styles: NewsFeedStyles;
}) {
  const { data } = useContentComments(contentId);
  const comments = data?.comments ?? [];

  if (commentCount === 0 && comments.length === 0) return null;

  return (
    <View style={styles.socialSection}>
      <View style={styles.socialHeaderRow}>
        <Ionicons name="chatbubble" size={13} color={theme.tintColor} />
        <Text style={styles.socialHeaderText}>
          {commentCount} {commentCount === 1 ? "comment" : "comments"}
        </Text>
      </View>
      {comments.slice(0, 3).map((c) => (
        <View key={c.comment.id} style={styles.commentRow}>
          <MiniAvatar seed={c.author?.username} theme={theme} size={24} />
          <View style={styles.commentContent}>
            <Text style={styles.commentAuthor}>
              {truncateAddress(c.author?.username)}
            </Text>
            <Text style={styles.commentText} numberOfLines={2}>
              {c.comment.text}
            </Text>
          </View>
          <Text style={styles.commentTime}>
            {formatTimeAgo(c.comment.created_at)}
          </Text>
        </View>
      ))}
      {commentCount > 3 && (
        <Text style={styles.viewAllText}>
          View all {commentCount} comments
        </Text>
      )}
    </View>
  );
}
