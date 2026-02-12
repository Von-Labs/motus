import { PermissionsAndroid, Platform } from "react-native";

const ANDROID_12_PERMISSIONS = [
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
];

const LEGACY_PERMISSIONS = [
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  "android.permission.BLUETOOTH",
  "android.permission.BLUETOOTH_ADMIN",
];

export const requestBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== "android") {
    return false;
  }

  const permissions =
    Platform.Version >= 31 ? ANDROID_12_PERMISSIONS : LEGACY_PERMISSIONS;

  const permissionResult =
    await PermissionsAndroid.requestMultiple(permissions);

  const isGranted = permissions.every(
    (permission) =>
      permissionResult[permission] === PermissionsAndroid.RESULTS.GRANTED,
  );

  console.log("[BLE][Mobile] Permission result:", permissionResult);

  return isGranted;
};
