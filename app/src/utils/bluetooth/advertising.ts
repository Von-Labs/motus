import { BlePeripheralModule } from "./native";

export const startBleAdvertising = async (
  serviceUuid: string,
): Promise<void> => {
  console.log(
    "[BLE][Mobile] Requesting native advertising start for service:",
    serviceUuid,
  );
  await BlePeripheralModule.startAdvertising(serviceUuid);
};

export const stopBleAdvertising = async (): Promise<void> => {
  console.log("[BLE][Mobile] Requesting native advertising stop");
  await BlePeripheralModule.stopAdvertising();
};

export const checkBleAdvertising = async (): Promise<boolean> => {
  return BlePeripheralModule.isAdvertising();
};
