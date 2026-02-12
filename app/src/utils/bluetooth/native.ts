import {
  NativeEventEmitter,
  NativeModules,
  Platform,
  type EmitterSubscription,
} from "react-native";
import {
  BLE_CONNECTION_EVENT,
  BLE_PROTOCOL_EVENT,
  type BleConnectionEvent,
  type BleProtocolEvent,
} from "./protocol";

type BlePeripheralModuleType = {
  startAdvertising: (serviceUuid: string) => Promise<void>;
  stopAdvertising: () => Promise<void>;
  isAdvertising: () => Promise<boolean>;
  setWalletAddress: (walletAddress: string | null) => Promise<void>;
  addListener: (eventName: string) => void;
  removeListeners: (count: number) => void;
};

export const BlePeripheralModule =
  NativeModules.BlePeripheralModule as BlePeripheralModuleType;

const bleEventEmitter =
  Platform.OS === "android" && BlePeripheralModule
    ? new NativeEventEmitter(BlePeripheralModule)
    : null;

export const addBleConnectionListener = (
  listener: (event: BleConnectionEvent) => void,
): EmitterSubscription => {
  if (!bleEventEmitter) {
    return { remove: () => {} } as EmitterSubscription;
  }

  return bleEventEmitter.addListener(BLE_CONNECTION_EVENT, listener);
};

export const addBleProtocolListener = (
  listener: (event: BleProtocolEvent) => void,
): EmitterSubscription => {
  if (!bleEventEmitter) {
    return { remove: () => {} } as EmitterSubscription;
  }

  return bleEventEmitter.addListener(BLE_PROTOCOL_EVENT, listener);
};

export const syncBleWalletAddress = async (
  walletAddress: string | null,
): Promise<void> => {
  if (Platform.OS !== "android" || !BlePeripheralModule) {
    return;
  }

  await BlePeripheralModule.setWalletAddress(walletAddress);
};
