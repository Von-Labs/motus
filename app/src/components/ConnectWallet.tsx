import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { Button, Text, View } from "react-native";
import { useContext, useEffect } from "react";
import { AppContext } from "../context";

export function ConnectWallet() {
  const { account, connect, disconnect } = useMobileWallet();
  const { setWalletAddress } = useContext(AppContext);

  // Update context when wallet connects/disconnects
  useEffect(() => {
    if (account) {
      setWalletAddress(account.address.toString());
    } else {
      setWalletAddress(null);
    }
  }, [account, setWalletAddress]);

  if (account) {
    return (
      <View>
        <Text>Connected: {account.address.toString()}</Text>
        <Button title="Disconnect" onPress={disconnect} />
      </View>
    );
  }

  return (
    <View
      style={{
        marginTop: 24,
      }}
    >
      <Button title="Connect Wallet" onPress={connect} />
    </View>
  );
}
