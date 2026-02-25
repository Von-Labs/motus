import { clusterApiUrl } from "@solana/web3.js";
import { MobileWalletProvider } from "@wallet-ui/react-native-web3js";
import App from "./App";

const chain = "solana:devnet";
const endpoint = clusterApiUrl("devnet");

const identity = {
  name: "Motus",
  uri: "https://getmotus.xyz",
  icon: "favicon.png", // Must be a relative path to the uri above
};

export default function RootLayout() {
  return (
    <MobileWalletProvider chain={chain} endpoint={endpoint} identity={identity}>
      <App />
    </MobileWalletProvider>
  );
}
