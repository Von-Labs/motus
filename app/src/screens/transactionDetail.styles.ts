import { StyleSheet } from "react-native";

export const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundColor,
    },
    scrollView: {
      flex: 1,
      padding: 20,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.backgroundColor,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      opacity: 0.6,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.backgroundColor,
      padding: 40,
    },
    emptyTitle: {
      fontSize: 20,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginTop: 16,
      marginBottom: 24,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.borderColor,
    },
    backIconButton: {
      padding: 4,
    },
    headerTitle: {
      fontSize: 18,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
    },
    backButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: theme.tintColor,
    },
    backButtonText: {
      fontSize: 16,
      color: theme.tintTextColor,
      fontFamily: theme.semiBoldFont,
    },
    mainCard: {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderRadius: 16,
      padding: 32,
      alignItems: "center",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    iconContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    successIcon: {
      backgroundColor: "rgba(0, 255, 136, 0.15)",
    },
    failedIcon: {
      backgroundColor: "rgba(255, 68, 68, 0.15)",
    },
    typeTitle: {
      fontSize: 24,
      color: theme.textColor,
      fontFamily: theme.boldFont,
      marginBottom: 8,
    },
    dateText: {
      fontSize: 14,
      color: theme.textColor,
      fontFamily: theme.lightFont,
      opacity: 0.6,
      marginBottom: 16,
    },
    statusBadge: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 16,
    },
    successBadge: {
      backgroundColor: "rgba(0, 255, 136, 0.15)",
    },
    failedBadge: {
      backgroundColor: "rgba(255, 68, 68, 0.15)",
    },
    statusText: {
      fontSize: 13,
      fontFamily: theme.boldFont,
      letterSpacing: 0.5,
    },
    successText: {
      color: "#00ff88",
    },
    failedText: {
      color: "#ff4444",
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 13,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      opacity: 0.6,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    detailsCard: {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    detailRow: {
      marginBottom: 16,
    },
    detailLabel: {
      fontSize: 13,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      opacity: 0.7,
      textTransform: "capitalize",
      marginBottom: 6,
    },
    detailValue: {
      fontSize: 15,
      color: theme.textColor,
      fontFamily: theme.regularFont,
      lineHeight: 22,
    },
    signatureCard: {
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    signatureText: {
      fontSize: 13,
      color: theme.tintColor,
      fontFamily: theme.regularFont,
      lineHeight: 20,
    },
    actionButtons: {
      flexDirection: "row",
      gap: 12,
    },
    actionButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
      backgroundColor: "rgba(255, 255, 255, 0.03)",
      gap: 8,
    },
    actionButtonPrimary: {
      backgroundColor: theme.tintColor,
      borderColor: theme.tintColor,
    },
    actionButtonText: {
      fontSize: 14,
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
    },
    actionButtonTextPrimary: {
      color: theme.tintTextColor,
    },
  });
