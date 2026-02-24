import { useContext, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ThemeContext } from "../../context";

const LAMPORTS_PER_SOL = 1_000_000_000;

interface SendSolFormProps {
  onSend: (to: string, lamports: number) => Promise<void>;
  onCancel: () => void;
}

export function SendSolForm({ onSend, onCancel }: SendSolFormProps) {
  const { theme } = useContext(ThemeContext);
  const [address, setAddress] = useState("");
  const [solAmount, setSolAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styles = getStyles(theme);

  const handleSend = async () => {
    const to = address.trim();
    const sol = parseFloat(solAmount);
    if (!to) {
      setError("Enter recipient address");
      return;
    }
    if (isNaN(sol) || sol <= 0) {
      setError("Enter a valid SOL amount");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onSend(to, Math.round(sol * LAMPORTS_PER_SOL));
      onCancel();
    } catch (err: any) {
      setError(err.message || "Send failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <Text style={styles.title}>Send SOL</Text>
      <Text style={styles.label}>Recipient address</Text>
      <TextInput
        style={styles.input}
        value={address}
        onChangeText={setAddress}
        placeholder="e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
        placeholderTextColor={theme.placeholderTextColor}
        autoCapitalize="none"
        autoCorrect={false}
      />
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
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sendButton, loading && styles.buttonDisabled]}
          onPress={handleSend}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.tintTextColor} size="small" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: theme.secondaryBackgroundColor,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.borderColor,
      marginHorizontal: 20,
      marginTop: 16,
    },
    title: {
      fontSize: 18,
      fontFamily: theme.boldFont,
      color: theme.textColor,
      marginBottom: 16,
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
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 14,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      marginBottom: 16,
    },
    errorText: {
      fontSize: 13,
      color: "#DC2626",
      marginBottom: 12,
    },
    row: {
      flexDirection: "row",
      gap: 12,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    cancelText: {
      fontSize: 15,
      fontFamily: theme.mediumFont,
      color: theme.mutedForegroundColor,
    },
    sendButton: {
      flex: 1,
      paddingVertical: 12,
      alignItems: "center",
      borderRadius: 12,
      backgroundColor: theme.tintColor,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    sendButtonText: {
      fontSize: 15,
      fontFamily: theme.semiBoldFont,
      color: theme.tintTextColor,
    },
  });
