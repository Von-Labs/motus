import { useMobileWallet } from "@wallet-ui/react-native-web3js";
import { Button, Text, View } from "react-native";
import { useState } from "react";

export function SignMessageButton() {
  const { signMessage } = useMobileWallet();
  const [signedText, setSignedText] = useState();

  const handleSign = async () => {
    try {
      const message = "Verify this message";
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);
      console.log("Signed:", Buffer.from(signature).toString("base64"));
      setSignedText(Buffer.from(signature).toString("base64"));
    } catch (error) {
      console.error("Signing failed:", error);
    }
  };

  return (
    <View
      style={{
        marginTop: 24,
      }}
    >
      <Button title="Sign Message" onPress={handleSign} />
      <Text>{signedText}</Text>
    </View>
  );
}
