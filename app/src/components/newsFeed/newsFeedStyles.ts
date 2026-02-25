import { StyleSheet } from "react-native";

export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const created = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const diff = now - created;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(created).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export type NewsFeedStyles = ReturnType<typeof getNewsFeedStyles>;

export const getNewsFeedStyles = (theme: any) =>
  StyleSheet.create({
    centerContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "transparent",
      padding: 20,
      gap: 12,
    },
    list: {
      padding: 16,
      paddingBottom: 32,
    },
    card: {
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 16,
      padding: 16,
      marginBottom: 14,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    cardHeader: {
      marginBottom: 10,
    },
    authorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 999,
    },
    authorInfo: {
      flex: 1,
    },
    authorNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    authorName: {
      fontSize: 15,
      fontFamily: "Inter-SemiBold",
      color: theme.textColor,
    },
    typeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    typeBadgeText: {
      fontSize: 10,
      fontFamily: "Inter-SemiBold",
      textTransform: "uppercase" as const,
      letterSpacing: 0.3,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    timestamp: {
      fontSize: 12,
      fontFamily: "Inter-Regular",
      color: theme.mutedForegroundColor,
    },
    metaDot: {
      fontSize: 12,
      color: theme.mutedForegroundColor,
    },
    namespace: {
      fontSize: 12,
      fontFamily: "Inter-Regular",
      color: theme.tintColor,
    },
    contentTitle: {
      fontSize: 17,
      fontFamily: "Inter-Bold",
      color: theme.textColor,
      marginBottom: 6,
    },
    contentText: {
      fontSize: 15,
      fontFamily: "Inter-Regular",
      color: theme.textColor,
      lineHeight: 22,
      marginBottom: 8,
    },
    imageContainer: {
      borderRadius: 12,
      overflow: "hidden",
      marginBottom: 10,
    },
    contentImage: {
      width: "100%",
      height: 200,
    },
    linkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: `${theme.tintColor}0C`,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      marginBottom: 10,
    },
    linkText: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter-Regular",
      color: theme.tintColor,
    },
    engagementRow: {
      flexDirection: "row",
      gap: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: `${theme.borderColor}80`,
    },
    engagementButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
    },
    engagementText: {
      fontSize: 13,
      fontFamily: "Inter-Regular",
      color: theme.mutedForegroundColor,
    },
    socialSection: {
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: `${theme.borderColor}60`,
      gap: 8,
    },
    socialHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    socialHeaderText: {
      fontSize: 13,
      fontFamily: "Inter-SemiBold",
      color: theme.textColor,
    },
    profileChipsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    avatarStack: {
      flexDirection: "row",
      alignItems: "center",
    },
    profileNamesText: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter-Regular",
      color: theme.mutedForegroundColor,
    },
    commentRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    commentContent: {
      flex: 1,
    },
    commentAuthor: {
      fontSize: 13,
      fontFamily: "Inter-SemiBold",
      color: theme.textColor,
    },
    commentText: {
      fontSize: 13,
      fontFamily: "Inter-Regular",
      color: theme.textColor,
      lineHeight: 18,
      marginTop: 1,
    },
    commentTime: {
      fontSize: 11,
      fontFamily: "Inter-Regular",
      color: theme.mutedForegroundColor,
      marginTop: 2,
    },
    viewAllText: {
      fontSize: 13,
      fontFamily: "Inter-SemiBold",
      color: theme.tintColor,
      marginTop: 2,
    },
    emptyContainer: {
      alignItems: "center",
      paddingVertical: 60,
      gap: 8,
    },
    emptyText: {
      fontSize: 18,
      fontFamily: "Inter-SemiBold",
      color: theme.textColor,
    },
    emptySubtext: {
      fontSize: 14,
      fontFamily: "Inter-Regular",
      color: theme.mutedForegroundColor,
      textAlign: "center",
    },
    errorText: {
      fontSize: 15,
      fontFamily: "Inter-Regular",
      color: theme.mutedForegroundColor,
      textAlign: "center",
    },
    retryButton: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    retryButtonText: {
      color: theme.tintTextColor ?? "#fff",
      fontSize: 15,
      fontFamily: "Inter-SemiBold",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    commentModal: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 16,
      padding: 20,
      width: 320,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    commentModalTitle: {
      fontSize: 18,
      fontFamily: "Inter-Bold",
      color: theme.textColor,
      marginBottom: 4,
    },
    commentModalContext: {
      fontSize: 13,
      fontFamily: "Inter-Regular",
      color: theme.mutedForegroundColor,
      marginBottom: 14,
    },
    commentInput: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: "Inter-Regular",
      color: theme.textColor,
      backgroundColor: theme.secondaryBackgroundColor,
      minHeight: 80,
      textAlignVertical: "top",
      marginBottom: 14,
    },
    commentModalActions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: 10,
    },
    commentCancelButton: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: `${theme.tintColor}14`,
    },
    commentCancelText: {
      fontSize: 14,
      fontFamily: "Inter-SemiBold",
      color: theme.tintColor,
    },
    commentSubmitButton: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor: theme.tintColor,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 64,
    },
    commentSubmitDisabled: {
      opacity: 0.5,
    },
    commentSubmitText: {
      fontSize: 14,
      fontFamily: "Inter-SemiBold",
      color: theme.tintTextColor ?? "#fff",
    },
  });
