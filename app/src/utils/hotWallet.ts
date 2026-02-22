import { Keypair } from "@solana/web3.js";
import * as SecureStore from "expo-secure-store";
import { Buffer } from "buffer";

const STORAGE_KEY = "HOT_WALLET_SECRET_KEY";

const SECURE_STORE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export async function generateHotWallet(): Promise<Keypair> {
  const keypair = Keypair.generate();
  const secretBase64 = Buffer.from(keypair.secretKey).toString("base64");
  await SecureStore.setItemAsync(STORAGE_KEY, secretBase64, SECURE_STORE_OPTIONS);
  return keypair;
}

export async function getHotWalletKeypair(): Promise<Keypair | null> {
  const stored = await SecureStore.getItemAsync(STORAGE_KEY, SECURE_STORE_OPTIONS);
  if (!stored) return null;
  const secretKey = new Uint8Array(Buffer.from(stored, "base64"));
  return Keypair.fromSecretKey(secretKey);
}

export async function hasHotWallet(): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(STORAGE_KEY, SECURE_STORE_OPTIONS);
  return stored !== null;
}

export async function deleteHotWallet(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY, SECURE_STORE_OPTIONS);
}

export function getPublicKeyString(keypair: Keypair): string {
  return keypair.publicKey.toBase58();
}

export function getSecretKeyBase58(keypair: Keypair): string {
  return Buffer.from(keypair.secretKey).toString("base64");
}
