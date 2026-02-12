import { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { AppContext, ThemeContext } from "../context";
import {
  BLE_LOCAL_NAME,
  BLE_SERVICE_UUID,
  addBleConnectionListener,
  addBleProtocolListener,
  checkBleAdvertising,
  requestBluetoothPermissions,
  startBleAdvertising,
  stopBleAdvertising,
  syncBleWalletAddress,
  type BleAdvertiseState,
} from "../utils/bluetooth";

export function Bluetooth() {
  const { theme } = useContext(ThemeContext);
  const { walletAddress } = useContext(AppContext);
  const styles = getStyles(theme);

  const [status, setStatus] = useState<BleAdvertiseState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<string>(
    "No central connected",
  );
  const [connectedDevice, setConnectedDevice] = useState<string>("");
  const [lastProtocolEvent, setLastProtocolEvent] = useState<string>("None");

  useEffect(() => {
    checkBleAdvertising()
      .then((active) => {
        setStatus(active ? "advertising" : "idle");
      })
      .catch((error) => {
        console.log("[BLE][Mobile] Failed initial advertising check:", error);
      });

    const subscription = addBleConnectionListener((event) => {
      const device = event.deviceAddress || "unknown";
      if (event.status === "connected") {
        setConnectionStatus(`Connected (${event.connectedDevices})`);
        setConnectedDevice(device);
        console.log(
          `[BLE][Mobile] Central connected: ${device}, total=${event.connectedDevices}`,
        );
      } else {
        setConnectionStatus(`Disconnected (${event.connectedDevices})`);
        setConnectedDevice(device);
        console.log(
          `[BLE][Mobile] Central disconnected: ${device}, total=${event.connectedDevices}`,
        );
      }
    });

    const protocolSubscription = addBleProtocolListener((event) => {
      setLastProtocolEvent(event.type);
      console.log(
        `[BLE][Mobile] Protocol event: type=${event.type} from=${event.deviceAddress}`,
      );
    });

    return () => {
      subscription.remove();
      protocolSubscription.remove();
    };
  }, []);

  useEffect(() => {
    syncBleWalletAddress(walletAddress).catch((error) => {
      console.log("[BLE][Mobile] Failed to sync wallet address to native:", error);
    });
  }, [walletAddress]);

  const handleStartAdvertising = async () => {
    setStatus("starting");
    setErrorMessage("");

    const hasPermissions = await requestBluetoothPermissions();
    if (!hasPermissions) {
      setStatus("error");
      setErrorMessage("Bluetooth permissions were not granted.");
      return;
    }

    try {
      await startBleAdvertising(BLE_SERVICE_UUID);
      setStatus("advertising");
      setConnectionStatus("Advertising, waiting for connection");
      setConnectedDevice("");
      console.log(
        `[BLE][Mobile] Advertising started. Name=${BLE_LOCAL_NAME} Service=${BLE_SERVICE_UUID}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log("[BLE][Mobile] start advertising error", message);
      setStatus("error");
      setErrorMessage(message || "Failed to start BLE advertising.");
    }
  };

  const handleStopAdvertising = async () => {
    setStatus("stopping");
    setErrorMessage("");

    try {
      await stopBleAdvertising();
      setStatus("idle");
      setConnectionStatus("No central connected");
      setConnectedDevice("");
      console.log("[BLE][Mobile] Advertising stopped.");
    } catch (error) {
      console.log("[BLE][Mobile] stop advertising error", error);
      setStatus("error");
      setErrorMessage("Failed to stop BLE advertising.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bluetooth Lab (Android)</Text>
      <Text style={styles.description}>
        Start BLE advertising so desktop-agent on macOS can discover and connect
        first.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Local Name</Text>
        <Text style={styles.cardValue}>{BLE_LOCAL_NAME}</Text>

        <Text style={styles.cardLabel}>Service UUID</Text>
        <Text style={styles.uuidValue}>{BLE_SERVICE_UUID}</Text>

        <Text style={styles.cardLabel}>Status</Text>
        <Text style={styles.statusValue}>{status}</Text>

        <Text style={styles.cardLabel}>Connection</Text>
        <Text style={styles.cardValue}>{connectionStatus}</Text>

        {connectedDevice ? (
          <>
            <Text style={styles.cardLabel}>Last Device</Text>
            <Text style={styles.uuidValue}>{connectedDevice}</Text>
          </>
        ) : null}

        <Text style={styles.cardLabel}>Last Protocol Event</Text>
        <Text style={styles.cardValue}>{lastProtocolEvent}</Text>

        {errorMessage ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.startButton]}
          onPress={handleStartAdvertising}
          disabled={status === "starting" || status === "advertising"}
        >
          <Text style={styles.buttonText}>Start Advertising</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.stopButton]}
          onPress={handleStopAdvertising}
          disabled={status !== "advertising"}
        >
          <Text style={styles.buttonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: 16,
      paddingTop: 12,
      backgroundColor: theme.backgroundColor,
    },
    title: {
      fontSize: 22,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
      marginBottom: 6,
    },
    description: {
      fontSize: 14,
      color: theme.secondaryTextColor,
      fontFamily: theme.lightFont,
      marginBottom: 14,
    },
    card: {
      borderRadius: 12,
      backgroundColor: theme.cardColor || "rgba(255,255,255,0.05)",
      borderWidth: 1,
      borderColor: theme.borderColor,
      padding: 14,
      gap: 6,
    },
    cardLabel: {
      fontSize: 12,
      color: theme.secondaryTextColor,
      fontFamily: theme.lightFont,
      marginTop: 8,
    },
    cardValue: {
      fontSize: 15,
      color: theme.textColor,
      fontFamily: theme.semiBoldFont,
    },
    uuidValue: {
      fontSize: 13,
      color: theme.textColor,
      fontFamily: theme.regularFont,
    },
    statusValue: {
      fontSize: 16,
      color: theme.tintColor,
      fontFamily: theme.semiBoldFont,
      textTransform: "capitalize",
    },
    errorText: {
      marginTop: 8,
      color: "#ff7a7a",
      fontFamily: theme.regularFont,
    },
    buttonRow: {
      marginTop: 16,
      flexDirection: "row",
      gap: 10,
    },
    button: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 12,
      alignItems: "center",
    },
    startButton: {
      backgroundColor: theme.tintColor,
    },
    stopButton: {
      backgroundColor: "#B94A48",
    },
    buttonText: {
      color: "#fff",
      fontFamily: theme.semiBoldFont,
      fontSize: 14,
    },
  });
