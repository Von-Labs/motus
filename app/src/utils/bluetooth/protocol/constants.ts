export const BLE_CONNECTION_EVENT = "BlePeripheralConnectionState";
export const BLE_PROTOCOL_EVENT = "BlePeripheralProtocolEvent";

export const BLE_PROTOCOL_MESSAGE = {
  WALLET_ADDRESS_REQUEST: "wallet_address_request",
  WALLET_ADDRESS_RESPONSE: "wallet_address_response",
  DESKTOP_CHAT_INPUT: "desktop_chat_input",
  DESKTOP_CHAT_INPUT_ACK: "desktop_chat_input_ack",
} as const;
