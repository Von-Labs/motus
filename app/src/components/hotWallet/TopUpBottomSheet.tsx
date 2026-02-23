import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { ThemeContext } from "../../context";
import { useHotWallet } from "../../context/HotWalletContext";

const LAMPORTS_PER_SOL = 1_000_000_000;

function formatSol(lamports: number) {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4);
}

export function TopUpBottomSheet() {
  const { theme } = useContext(ThemeContext);
  const { pendingTopUp, balance, topUpFromMainWallet, closeTopUpSheet } =
    useHotWallet();
  const modalRef = useRef<BottomSheetModal>(null);
  const [solAmount, setSolAmount] = useState("0.01");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = getStyles(theme);

  useEffect(() => {
    if (pendingTopUp) {
      const deficitLamports = Math.max(
        0,
        pendingTopUp.requiredLamports - (balance ?? 0),
      );
      setSolAmount((deficitLamports / LAMPORTS_PER_SOL).toFixed(4));
      setError(null);
      modalRef.current?.present();
    }
  }, [pendingTopUp, balance]);

  const handleTopUp = async () => {
    const sol = parseFloat(solAmount);
    if (isNaN(sol) || sol <= 0) {
      setError("Enter a valid amount");
      return;
    }
    const lamports = Math.round(sol * LAMPORTS_PER_SOL);
    setLoading(true);
    setError(null);
    try {
      await topUpFromMainWallet(lamports);
      closeTopUpSheet(true);
      modalRef.current?.dismiss();
    } catch (err: any) {
      setError(err.message || "Top-up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    closeTopUpSheet(false);
  };

  if (!pendingTopUp) return null;

  return (
    <BottomSheetModal
      ref={modalRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={handleDismiss}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.inner}
        >
          <Text style={styles.title}>Top up hot wallet</Text>
          <Text style={styles.balance}>
            Current balance: {formatSol(balance ?? 0)} SOL
          </Text>
          <Text style={styles.required}>
            Required: {formatSol(pendingTopUp.requiredLamports)} SOL
          </Text>

          <Text style={styles.label}>Amount (SOL)</Text>
          <TextInput
            style={styles.input}
            value={solAmount}
            onChangeText={setSolAmount}
            keyboardType="decimal-pad"
            placeholder="0.01"
            placeholderTextColor={theme.placeholderTextColor}
          />

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleTopUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.tintTextColor} />
            ) : (
              <Text style={styles.buttonText}>Top up from main wallet</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              modalRef.current?.dismiss();
              handleDismiss();
            }}
            disabled={loading}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
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
      paddingBottom: 32,
    },
    inner: {
      width: "100%",
    },
    title: {
      fontSize: 20,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      marginBottom: 12,
    },
    balance: {
      fontSize: 14,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      marginBottom: 4,
    },
    required: {
      fontSize: 13,
      fontFamily: theme.mediumFont,
      color: theme.tintColor,
      marginBottom: 20,
    },
    label: {
      fontSize: 13,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 13,
      color: "#DC2626",
      marginBottom: 12,
    },
    button: {
      backgroundColor: theme.tintColor,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      marginBottom: 12,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      fontSize: 16,
      fontFamily: theme.semiBoldFont,
      color: theme.tintTextColor,
    },
    cancelButton: {
      alignItems: "center",
      paddingVertical: 8,
    },
    cancelText: {
      fontSize: 15,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
    },
  });
