import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import {
  forwardRef,
  useContext,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { ThemeContext } from "../../context";
import { reportErrorToDiscord } from "../../utils/errorReporter";

export type ReportErrorStatus = "idle" | "sending" | "success" | "error";

export type ReportErrorBottomSheetRef = {
  present: (error: string, context?: { wallet?: string | null; model?: string }) => void;
  dismiss: () => void;
};

interface ReportErrorBottomSheetProps {
  onDismiss?: () => void;
}

export const ReportErrorBottomSheet = forwardRef<ReportErrorBottomSheetRef, ReportErrorBottomSheetProps>(
  function ReportErrorBottomSheet({ onDismiss }, ref) {
    const { theme } = useContext(ThemeContext);
    const modalRef = useRef<BottomSheetModal>(null);
    const [status, setStatus] = useState<ReportErrorStatus>("idle");
    const [errorMessage, setErrorMessage] = useState("");
    const styles = getStyles(theme);

    const errorRef = useRef<string>("");
    const contextRef = useRef<{ wallet?: string | null; model?: string }>({});

    useImperativeHandle(ref, () => ({
      present: (error, context) => {
        errorRef.current = error;
        contextRef.current = context || {};
        setErrorMessage(error);
        setStatus("idle");
        modalRef.current?.present();
      },
      dismiss: () => modalRef.current?.dismiss(),
    }));

    const handleReport = async () => {
      setStatus("sending");
      try {
        await reportErrorToDiscord(errorRef.current, {
          wallet: contextRef.current.wallet,
          model: contextRef.current.model,
          source: "Chat > SSE error",
        });
        setStatus("success");
      } catch {
        setStatus("error");
      }
    };

    const icon =
      status === "success"
        ? "checkmark-circle"
        : status === "error"
          ? "close-circle"
          : "warning-outline";

    const iconColor =
      status === "success"
        ? "#00ff88"
        : status === "error"
          ? "#ff4444"
          : "#ffaa00";

    const title =
      status === "sending"
        ? "Sending report..."
        : status === "success"
          ? "Report sent!"
          : status === "error"
            ? "Failed to send"
            : "Report Error";

    const subtitle =
      status === "success"
        ? "Thank you! Our team will look into this."
        : status === "error"
          ? "Could not send error report. Please try again."
          : "Send this error to our team for investigation.";

    return (
      <BottomSheetModal
        ref={modalRef}
        enableDynamicSizing
        enablePanDownToClose={status !== "sending"}
        onDismiss={onDismiss}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />
        )}
        backgroundStyle={[
          styles.sheet,
          { backgroundColor: theme.secondaryBackgroundColor },
        ]}
        handleIndicatorStyle={{ backgroundColor: theme.borderColor }}
      >
        <BottomSheetView style={styles.content}>
          <View style={styles.iconContainer}>
            {status === "sending" ? (
              <ActivityIndicator size="large" color={theme.tintColor} />
            ) : (
              <Ionicons name={icon as any} size={48} color={iconColor} />
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          {errorMessage && status === "idle" ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText} numberOfLines={4}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <View style={styles.buttonRow}>
            {status === "idle" && (
              <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
                <Ionicons name="send-outline" size={16} color={theme.tintTextColor} />
                <Text style={styles.reportButtonText}>Send Report</Text>
              </TouchableOpacity>
            )}

            {status === "error" && (
              <TouchableOpacity style={styles.reportButton} onPress={handleReport}>
                <Ionicons name="refresh-outline" size={16} color={theme.tintTextColor} />
                <Text style={styles.reportButtonText}>Retry</Text>
              </TouchableOpacity>
            )}

            {(status === "idle" || status === "success" || status === "error") && (
              <TouchableOpacity
                style={[styles.closeButton, status === "idle" && styles.secondaryButton]}
                onPress={() => modalRef.current?.dismiss()}
              >
                <Text
                  style={[
                    styles.closeButtonText,
                    status === "idle" && styles.secondaryButtonText,
                  ]}
                >
                  {status === "success" ? "Done" : "Cancel"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const getStyles = (theme: any) =>
  StyleSheet.create({
    sheet: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    content: {
      paddingHorizontal: 24,
      paddingBottom: 40,
      alignItems: "center",
    },
    iconContainer: {
      marginTop: 8,
      marginBottom: 16,
      width: 64,
      height: 64,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontSize: 20,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      opacity: 0.7,
      textAlign: "center",
      marginBottom: 16,
      paddingHorizontal: 16,
    },
    errorBox: {
      width: "100%",
      backgroundColor: "#ff444415",
      borderRadius: 12,
      padding: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: "#ff444430",
    },
    errorText: {
      fontSize: 13,
      fontFamily: theme.regularFont,
      color: "#ff6666",
    },
    buttonRow: {
      width: "100%",
      gap: 12,
    },
    reportButton: {
      backgroundColor: theme.tintColor,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: "center",
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
    },
    reportButtonText: {
      fontSize: 16,
      fontFamily: theme.semiBoldFont,
      color: theme.tintTextColor,
    },
    closeButton: {
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: "center",
    },
    secondaryButton: {
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    closeButtonText: {
      fontSize: 16,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
    },
    secondaryButtonText: {
      color: theme.mutedForegroundColor,
    },
  });
