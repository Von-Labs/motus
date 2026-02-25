import Ionicons from "@expo/vector-icons/Ionicons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useCommentMutation,
  useLikeMutation,
  useProfile,
  type PostInterface,
} from "../../context/ProfileContext";
import { truncateAddress } from "../../utils/formatAddress";
import { CommentsSection } from "./CommentsSection";
import { LikesSection } from "./LikesSection";
import { MiniAvatar } from "./MiniAvatar";
import { formatTimeAgo, type NewsFeedStyles } from "./newsFeedStyles";

const TYPE_CONFIG: Record<
  string,
  { icon: string; label: string; color: string }
> = {
  post: { icon: "document-text", label: "Post", color: "#6366f1" },
  image: { icon: "image", label: "Image", color: "#8b5cf6" },
  video: { icon: "videocam", label: "Video", color: "#ec4899" },
  link: { icon: "link", label: "Link", color: "#0ea5e9" },
};

export function ContentCard({
  item,
  theme,
  styles,
}: {
  item: PostInterface;
  theme: any;
  styles: NewsFeedStyles;
}) {
  const { profile } = useProfile();
  const likeMutation = useLikeMutation();
  const commentMutation = useCommentMutation();

  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState("");

  const author = item.authorProfile;
  const content = item.content;
  const contentId = content?.id;
  const likeCount = item.socialCounts?.likeCount ?? 0;
  const commentCount = item.socialCounts?.commentCount ?? 0;

  const title = content?.title ?? "";
  const body = content?.body ?? "";
  const contentType = content?.type ?? "post";
  const externalUrl = content?.externalLinkURL;
  const typeInfo = TYPE_CONFIG[contentType] ?? TYPE_CONFIG.post;

  const handleLike = () => {
    if (!profile?.id || !contentId) return;
    likeMutation.mutate({ contentId, profileId: profile.id });
  };

  const handleOpenCommentModal = () => {
    if (!profile?.id || !contentId) return;
    setCommentText("");
    setCommentModalVisible(true);
  };

  const handleSubmitComment = () => {
    const text = commentText.trim();
    if (!text || !profile?.id || !contentId) return;
    commentMutation.mutate(
      { contentId, profileId: profile.id, text },
      { onSuccess: () => setCommentModalVisible(false) },
    );
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: [title, body, externalUrl].filter(Boolean).join("\n\n"),
      });
    } catch (_) {}
  };

  return (
    <View style={styles.card}>
      {/* Author header */}
      <View style={styles.cardHeader}>
        <View style={styles.authorRow}>
          <MiniAvatar seed={author?.username} theme={theme} size={38} />
          <View style={styles.authorInfo}>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {truncateAddress(author?.username)}
              </Text>
              <View
                style={[
                  styles.typeBadge,
                  { backgroundColor: `${typeInfo.color}18` },
                ]}
              >
                <Ionicons
                  name={typeInfo.icon as any}
                  size={10}
                  color={typeInfo.color}
                />
                <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>
                  {typeInfo.label}
                </Text>
              </View>
            </View>
            <View style={styles.metaRow}>
              {content?.created_at ? (
                <Text style={styles.timestamp}>
                  {formatTimeAgo(content.created_at)}
                </Text>
              ) : null}
              {content?.namespace ? (
                <>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.namespace}>{content.namespace}</Text>
                </>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {/* Title */}
      {title ? <Text style={styles.contentTitle}>{title}</Text> : null}

      {/* Body text */}
      {body ? <Text style={styles.contentText}>{body}</Text> : null}

      {/* Engagement bar */}
      <View style={styles.engagementRow}>
        <TouchableOpacity
          style={styles.engagementButton}
          onPress={handleLike}
          disabled={likeMutation.isPending || !profile?.id}
        >
          {likeMutation.isPending ? (
            <ActivityIndicator size={16} color={theme.tintColor} />
          ) : (
            <Ionicons
              name="heart-outline"
              size={18}
              color={theme.mutedForegroundColor}
            />
          )}
          <Text style={styles.engagementText}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.engagementButton}
          onPress={handleOpenCommentModal}
          disabled={!profile?.id}
        >
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={theme.mutedForegroundColor}
          />
          <Text style={styles.engagementText}>{commentCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.engagementButton} onPress={handleShare}>
          <Ionicons
            name="share-outline"
            size={16}
            color={theme.mutedForegroundColor}
          />
        </TouchableOpacity>
      </View>

      {/* Social details */}
      <LikesSection
        contentId={contentId}
        likeCount={likeCount}
        theme={theme}
        styles={styles}
      />

      <CommentsSection
        contentId={contentId}
        commentCount={commentCount}
        theme={theme}
        styles={styles}
      />

      {/* Comment input modal */}
      <Modal
        visible={commentModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCommentModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() =>
            !commentMutation.isPending && setCommentModalVisible(false)
          }
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.commentModal}>
              <Text style={styles.commentModalTitle}>Add a comment</Text>

              {title ? (
                <Text style={styles.commentModalContext} numberOfLines={1}>
                  on "{title}"
                </Text>
              ) : null}

              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Write your comment..."
                placeholderTextColor={theme.mutedForegroundColor}
                multiline
                autoFocus
                editable={!commentMutation.isPending}
              />

              <View style={styles.commentModalActions}>
                <TouchableOpacity
                  style={styles.commentCancelButton}
                  onPress={() => setCommentModalVisible(false)}
                  disabled={commentMutation.isPending}
                >
                  <Text style={styles.commentCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.commentSubmitButton,
                    (!commentText.trim() || commentMutation.isPending) &&
                      styles.commentSubmitDisabled,
                  ]}
                  onPress={handleSubmitComment}
                  disabled={!commentText.trim() || commentMutation.isPending}
                >
                  {commentMutation.isPending ? (
                    <ActivityIndicator size={14} color="#fff" />
                  ) : (
                    <Text style={styles.commentSubmitText}>Post</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
