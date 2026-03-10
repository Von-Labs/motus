import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { ThemeContext } from "../context";
import type { AlertButton, AlertConfig } from "../context/AlertContext";

interface AlertBottomSheetProps {
  config: AlertConfig | null;
  modalRef: React.RefObject<BottomSheetModal | null>;
  onDismiss: () => void;
}

export function AlertBottomSheet({ config, modalRef, onDismiss }: AlertBottomSheetProps) {
  const { theme } = useContext(ThemeContext);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const styles = getStyles(theme);

  if (!config) return null;

  const buttons = config.buttons?.length ? config.buttons : [{ text: "OK" }];

  const handleButtonPress = async (button: AlertButton, index: number) => {
    if (button.onPress) {
      setLoadingIndex(index);
      try {
        await button.onPress();
      } finally {
        setLoadingIndex(null);
      }
    }
    modalRef.current?.dismiss();
  };

  const getButtonStyle = (button: AlertButton) => {
    if (button.style === "cancel") return [styles.button, styles.cancelButton];
    if (button.style === "destructive") return [styles.button, styles.destructiveButton];
    return [styles.button, styles.defaultButton];
  };

  const getButtonTextStyle = (button: AlertButton) => {
    if (button.style === "cancel") return [styles.buttonText, styles.cancelButtonText];
    if (button.style === "destructive") return [styles.buttonText, styles.destructiveButtonText];
    return [styles.buttonText, styles.defaultButtonText];
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing
      enablePanDownToClose={loadingIndex === null}
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
        <Text style={styles.title}>{config.title}</Text>

        {config.message ? (
          <Text style={styles.message}>{config.message}</Text>
        ) : null}

        <View style={styles.buttonRow}>
          {buttons.map((button, index) => (
            <TouchableOpacity
              key={index}
              style={getButtonStyle(button)}
              onPress={() => handleButtonPress(button, index)}
              disabled={loadingIndex !== null}
            >
              {loadingIndex === index ? (
                <ActivityIndicator
                  size="small"
                  color={
                    button.style === "destructive"
                      ? "#ff4444"
                      : button.style === "cancel"
                        ? theme.textColor
                        : theme.tintTextColor
                  }
                />
              ) : (
                <Text style={getButtonTextStyle(button)}>{button.text}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}

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
    title: {
      fontSize: 20,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      marginBottom: 8,
      marginTop: 8,
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
      paddingVertical: 12,
      paddingHorizontal: 32,
      borderRadius: 12,
      alignItems: "center",
    },
    defaultButton: {
      backgroundColor: theme.tintColor,
    },
    cancelButton: {
      backgroundColor: "transparent",
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    destructiveButton: {
      backgroundColor: "rgba(255, 68, 68, 0.12)",
      borderWidth: 1,
      borderColor: "rgba(255, 68, 68, 0.3)",
    },
    buttonText: {
      fontSize: 16,
      fontFamily: theme.semiBoldFont,
    },
    defaultButtonText: {
      color: theme.tintTextColor,
    },
    cancelButtonText: {
      color: theme.textColor,
    },
    destructiveButtonText: {
      color: "#ff4444",
    },
  });
