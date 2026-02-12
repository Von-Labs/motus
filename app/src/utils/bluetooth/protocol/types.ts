import { BLE_PROTOCOL_MESSAGE } from "./constants";

export type BleConnectionEvent = {
  status: "connected" | "disconnected";
  deviceAddress: string;
  connectedDevices: number;
  timestamp: number;
};

export type BleProtocolMessageType =
  (typeof BLE_PROTOCOL_MESSAGE)[keyof typeof BLE_PROTOCOL_MESSAGE];

export type WalletAddressRequestPayload = {
  type: typeof BLE_PROTOCOL_MESSAGE.WALLET_ADDRESS_REQUEST;
};

export type WalletAddressResponsePayload = {
  type: typeof BLE_PROTOCOL_MESSAGE.WALLET_ADDRESS_RESPONSE;
  walletAddress: string | null;
};

export type DesktopChatInputPayload = {
  type: typeof BLE_PROTOCOL_MESSAGE.DESKTOP_CHAT_INPUT;
  message: string;
};

export type BleProtocolEvent = {
  type: BleProtocolMessageType;
  deviceAddress: string;
  message?: string;
  timestamp: number;
};
