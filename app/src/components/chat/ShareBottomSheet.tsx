import Ionicons from "@expo/vector-icons/Ionicons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
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
  TouchableOpacity,
  View,
} from "react-native";
import { ThemeContext } from "../../context";

export type ShareStatus = "idle" | "summarizing" | "signing" | "success" | "error";

export type ShareBottomSheetRef = {
  present: () => void;
  dismiss: () => void;
  setStatus: (status: ShareStatus, message?: string) => void;
};

export const ShareBottomSheet = forwardRef<ShareBottomSheetRef>(
  function ShareBottomSheet(_, ref) {
    const { theme } = useContext(ThemeContext);
    const navigation = useNavigation<any>();
    const modalRef = useRef<BottomSheetModal>(null);
    const [status, setStatusState] = useState<ShareStatus>("idle");
    const [message, setMessage] = useState("");
    const styles = getStyles(theme);

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
      setStatus: (s: ShareStatus, msg?: string) => {
        setStatusState(s);
        if (typeof msg === "string") {
          setMessage(msg);
        } else {
          setMessage("");
        }
      },
    }));

    const icon =
      status === "success"
        ? "checkmark-circle"
        : status === "error"
          ? "close-circle"
          : "share-social-outline";

    const iconColor =
      status === "success"
        ? "#00ff88"
        : status === "error"
          ? "#ff4444"
          : theme.tintColor;

    const title =
      status === "summarizing"
        ? "Summarizing..."
        : status === "signing"
          ? "Sign to post"
          : status === "success"
            ? "Shared!"
            : status === "error"
              ? "Share failed"
              : "Share to social";

    const isLoading = status === "summarizing" || status === "signing";

    return (
      <BottomSheetModal
        ref={modalRef}
        enableDynamicSizing
        enablePanDownToClose={!isLoading}
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
            {isLoading ? (
              <ActivityIndicator size="large" color={theme.tintColor} />
            ) : (
              <Ionicons name={icon as any} size={48} color={iconColor} />
            )}
          </View>

          <Text style={styles.title}>{title}</Text>

          {message ? (
            <Text style={styles.message} numberOfLines={4}>
              {message}
            </Text>
          ) : null}

          {(status === "success" || status === "error") && (
            <View style={styles.buttonRow}>
              {status === "success" ? (
                <TouchableOpacity
                  style={styles.button}
                  onPress={() => {
                    modalRef.current?.dismiss();
                    navigation.navigate("NewsFeed", {
                      refreshFeedToken: Date.now(),
                      scrollToTop: true,
                    });
                  }}
                >
                  <Text style={styles.buttonText}>Go to News Feed</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[
                  styles.button,
                  status === "success" && styles.secondaryButton,
                ]}
                onPress={() => modalRef.current?.dismiss()}
              >
                <Text
                  style={[
                    styles.buttonText,
                    status === "success" && styles.secondaryButtonText,
                  ]}
                >
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          )}
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
    message: {
      fontSize: 14,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      opacity: 0.7,
      textAlign: "center",
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    buttonRow: {
      width: "100%",
      gap: 12,
    },
    button: {
      backgroundColor: theme.tintColor,
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: "center",
    },
    secondaryButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: theme.semiBoldFont,
      color: theme.tintTextColor,
    },
    secondaryButtonText: {
      color: theme.textColor,
    },
  });
