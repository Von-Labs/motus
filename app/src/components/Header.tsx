import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { AppContext, ThemeContext } from "../../src/context";
import { useHotWallet } from "../../src/context/HotWalletContext";
import { useProfile } from "../../src/context/ProfileContext";
import { getAvatarUrl } from "../utils/avatar";
import { MenuIcon } from "./MenuIcon";

export function Header() {
  const { theme } = useContext(ThemeContext);
  const { walletAddress, setWalletAddress } = useContext(AppContext);
  const { isHotWalletFeatureEnabled } = useHotWallet();
  const {
    profile,
    isLoading: profileLoading,
    hasProfile,
    isCreating,
    createProfile,
  } = useProfile();
  const { disconnect, signMessage } = useMobileWallet();
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const navigation = useNavigation<any>();
  const styles = getStyles(theme);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setWalletAddress(null);
      setShowDisconnectModal(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  };

  const handleProfilePress = () => {
    if (hasProfile) {
      setShowProfileModal(true);
    } else {
      setUsernameInput("");
      setShowCreateModal(true);
    }
  };

  const handleCreateProfile = async () => {
    const username = usernameInput.trim();
    if (!username) return;

    try {
      setIsSigning(true);
      const message = `Create Motus profile: ${username}`;
      const messageBytes = new TextEncoder().encode(message);
      await signMessage(messageBytes);
      createProfile({ username });
      setShowCreateModal(false);
    } catch (error) {
      console.error("Sign/create failed:", error);
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          <TouchableHighlight
            style={styles.menuButton}
            underlayColor={"transparent"}
            activeOpacity={0.6}
            onPress={() => navigation.openDrawer?.()}
          >
            <MenuIcon size={24} color={theme.textColor} />
          </TouchableHighlight>
        </View>

        <View style={styles.centerContainer}>
          <Text style={styles.title}>Motus</Text>
        </View>

        <View style={styles.rightContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate("NewsFeed" as never)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="newspaper-outline"
              size={18}
              color={theme.tintColor}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={handleProfilePress}
            activeOpacity={0.7}
            disabled={profileLoading || isCreating}
          >
            {profileLoading || isCreating ? (
              <ActivityIndicator size={16} color={theme.tintColor} />
            ) : hasProfile ? (
              <Image
                source={{ uri: getAvatarUrl(profile?.username)! }}
                style={styles.profileAvatar}
              />
            ) : (
              <Ionicons
                name="person-add-outline"
                size={16}
                color={theme.tintColor}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Create Profile Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => !isSigning && setShowCreateModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Profile</Text>
              </View>

              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={styles.textInput}
                value={usernameInput}
                onChangeText={setUsernameInput}
                placeholder="Enter username"
                placeholderTextColor={theme.placeholderTextColor}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSigning}
              />

              <Text style={styles.inputHint}>
                You'll sign a message to verify wallet ownership
              </Text>

              <TouchableOpacity
                style={[
                  styles.createButton,
                  (!usernameInput.trim() || isSigning) &&
                    styles.createButtonDisabled,
                ]}
                onPress={handleCreateProfile}
                disabled={!usernameInput.trim() || isSigning}
              >
                {isSigning ? (
                  <ActivityIndicator size={16} color={theme.tintTextColor} />
                ) : (
                  <Text style={styles.createButtonText}>Sign & Create</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowCreateModal(false)}
                disabled={isSigning}
              >
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Profile Info Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowProfileModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Profile</Text>
              </View>

              <View style={styles.profileInfoSection}>
                <View style={styles.profileAvatarLarge}>
                  <Image
                    source={{ uri: getAvatarUrl(profile?.username)! }}
                    style={styles.profileAvatarLargeImage}
                  />
                </View>
                <Text style={styles.profileUsername}>
                  {profile?.username ?? "Unknown"}
                </Text>
                {profile?.bio && (
                  <Text style={styles.profileBio}>{profile.bio}</Text>
                )}
              </View>

              <View style={styles.profileDetailRow}>
                <Ionicons
                  name="wallet-outline"
                  size={16}
                  color={theme.mutedForegroundColor}
                />
                <Text style={styles.profileDetailText} numberOfLines={1}>
                  {walletAddress}
                </Text>
              </View>

              <View style={styles.profileDetailRow}>
                <Ionicons
                  name="globe-outline"
                  size={16}
                  color={theme.mutedForegroundColor}
                />
                <Text style={styles.profileDetailText}>
                  {profile?.namespace ?? "motus"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowProfileModal(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Disconnect Modal */}
      <Modal
        visible={showDisconnectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDisconnectModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowDisconnectModal(false)}
        >
          <TouchableOpacity activeOpacity={1}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Wallet</Text>
              </View>

              <View style={styles.modalWalletInfo}>
                <Ionicons
                  name="wallet-outline"
                  size={24}
                  color={theme.textColor}
                />
                <Text style={styles.modalWalletAddress}>{walletAddress}</Text>
              </View>

              <TouchableOpacity
                style={styles.modalDisconnectButton}
                onPress={handleDisconnect}
              >
                <Ionicons name="log-out-outline" size={20} color="#ff4444" />
                <Text style={styles.modalDisconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function getStyles(theme: any) {
  return StyleSheet.create({
    container: {
      paddingVertical: 14,
      backgroundColor: "transparent",
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: 0,
      paddingHorizontal: 16,
    },
    leftContainer: {
      width: 48,
      alignItems: "flex-start",
      justifyContent: "center",
    },
    centerContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    rightContainer: {
      minWidth: 48,
      alignItems: "flex-end",
      justifyContent: "center",
      flexDirection: "row",
      gap: 8,
    },
    profileButton: {
      width: 34,
      height: 34,
      borderRadius: 999,
      backgroundColor: `${theme.tintColor}14`,
      alignItems: "center",
      justifyContent: "center",
    },
    profileAvatar: {
      width: 34,
      height: 34,
      borderRadius: 999,
    },
    iconButton: {
      width: 34,
      height: 34,
      borderRadius: 999,
      backgroundColor: `${theme.tintColor}14`,
      alignItems: "center",
      justifyContent: "center",
    },
    hotWalletButton: {
      padding: 8,
      borderRadius: 999,
      backgroundColor: `${theme.tintColor}14`,
    },
    menuButton: {
      padding: 10,
    },
    title: {
      fontSize: 28,
      fontFamily: theme.displaySemiBold || "Lora-SemiBold",
      color: theme.textColor,
      letterSpacing: 1,
    },
    walletBadge: {
      backgroundColor: theme.tintColor,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
    },
    walletText: {
      color: theme.tintTextColor,
      fontSize: 12,
      fontFamily: theme.semiBoldFont,
      letterSpacing: 0.5,
    },
    buttonContainer: {
      padding: 10,
    },
    // Create profile modal
    inputLabel: {
      fontSize: 14,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.borderColor,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      fontFamily: theme.regularFont,
      color: theme.textColor,
      backgroundColor: theme.secondaryBackgroundColor,
      marginBottom: 8,
    },
    inputHint: {
      fontSize: 12,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      marginBottom: 16,
    },
    createButton: {
      backgroundColor: theme.tintColor,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      minHeight: 48,
    },
    createButtonDisabled: {
      opacity: 0.5,
    },
    createButtonText: {
      fontSize: 16,
      fontFamily: theme.semiBoldFont,
      color: theme.tintTextColor,
    },
    // Profile info modal
    profileInfoSection: {
      alignItems: "center",
      marginBottom: 20,
    },
    profileAvatarLarge: {
      width: 64,
      height: 64,
      borderRadius: 999,
      backgroundColor: `${theme.tintColor}20`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    profileAvatarLargeImage: {
      width: 64,
      height: 64,
      borderRadius: 999,
    },
    profileUsername: {
      fontSize: 18,
      fontFamily: theme.semiBoldFont,
      color: theme.textColor,
      marginBottom: 4,
    },
    profileBio: {
      fontSize: 14,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      textAlign: "center",
    },
    profileDetailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: theme.borderColor,
    },
    profileDetailText: {
      fontSize: 13,
      fontFamily: theme.regularFont,
      color: theme.mutedForegroundColor,
      flex: 1,
    },
    modalCloseButton: {
      marginTop: 12,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: `${theme.tintColor}14`,
      alignItems: "center",
    },
    modalCloseText: {
      fontSize: 15,
      fontFamily: theme.semiBoldFont,
      color: theme.tintColor,
    },
    // Shared modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      backgroundColor: theme.backgroundColor,
      borderRadius: 16,
      padding: 24,
      width: 320,
      borderWidth: 1,
      borderColor: theme.borderColor,
    },
    modalHeader: {
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 20,
      fontFamily: theme.boldFont,
      color: theme.textColor,
    },
    modalWalletInfo: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.tintColor,
      padding: 16,
      borderRadius: 12,
      marginBottom: 20,
    },
    modalWalletAddress: {
      fontSize: 14,
      color: theme.tintTextColor,
      fontFamily: theme.regularFont,
      marginLeft: 12,
      flex: 1,
    },
    modalDisconnectButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: "rgba(255, 68, 68, 0.1)",
      borderWidth: 1,
      borderColor: "rgba(255, 68, 68, 0.3)",
    },
    modalDisconnectText: {
      fontSize: 16,
      color: "#ff4444",
      fontFamily: theme.semiBoldFont,
      marginLeft: 10,
    },
  });
}
