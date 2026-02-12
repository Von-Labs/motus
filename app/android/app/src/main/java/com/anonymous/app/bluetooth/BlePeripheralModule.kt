package com.anonymous.app.bluetooth

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.bluetooth.BluetoothDevice
import android.bluetooth.BluetoothGatt
import android.bluetooth.BluetoothGattCharacteristic
import android.bluetooth.BluetoothGattServer
import android.bluetooth.BluetoothGattServerCallback
import android.bluetooth.BluetoothGattService
import android.bluetooth.BluetoothManager
import android.bluetooth.BluetoothProfile
import android.bluetooth.le.AdvertiseCallback
import android.bluetooth.le.AdvertiseData
import android.bluetooth.le.AdvertiseSettings
import android.bluetooth.le.BluetoothLeAdvertiser
import android.os.ParcelUuid
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.LifecycleEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.nio.charset.StandardCharsets
import java.util.UUID
import org.json.JSONObject

class BlePeripheralModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), LifecycleEventListener {

  private var bluetoothLeAdvertiser: BluetoothLeAdvertiser? = null
  private var bluetoothGattServer: BluetoothGattServer? = null
  private var advertiseCallback: AdvertiseCallback? = null
  private var advertising = false
  private var connectedDevices: MutableSet<String> = mutableSetOf()
  private var currentWalletAddress: String? = null

  override fun getName(): String = MODULE_NAME

  init {
    reactContext.addLifecycleEventListener(this)
  }

  @ReactMethod
  fun startAdvertising(serviceUuid: String, promise: Promise) {
    try {
      val adapter = BluetoothAdapter.getDefaultAdapter()
      if (adapter == null) {
        promise.reject("BLE_NOT_SUPPORTED", "Bluetooth adapter is not available")
        return
      }

      if (!adapter.isEnabled) {
        promise.reject("BLE_DISABLED", "Bluetooth must be enabled before advertising")
        return
      }

      bluetoothLeAdvertiser = adapter.bluetoothLeAdvertiser
      if (bluetoothLeAdvertiser == null) {
        promise.reject("BLE_ADVERTISER_UNAVAILABLE", "Bluetooth LE advertiser is unavailable")
        return
      }

      if (!setupGattServer(serviceUuid)) {
        promise.reject("BLE_GATT_SERVER_ERROR", "Failed to start GATT server")
        return
      }

      if (advertising) {
        promise.resolve(null)
        return
      }

      advertiseCallback?.let {
        bluetoothLeAdvertiser?.stopAdvertising(it)
      }

      val settings = AdvertiseSettings.Builder()
        .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
        .setConnectable(true)
        .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_MEDIUM)
        .build()

      val data = AdvertiseData.Builder()
        .setIncludeDeviceName(false)
        .setIncludeTxPowerLevel(false)
        .addServiceUuid(ParcelUuid(UUID.fromString(serviceUuid)))
        .build()

      advertiseCallback = object : AdvertiseCallback() {
        override fun onStartSuccess(settingsInEffect: AdvertiseSettings) {
          super.onStartSuccess(settingsInEffect)
          advertising = true
          promise.resolve(null)
        }

        override fun onStartFailure(errorCode: Int) {
          super.onStartFailure(errorCode)
          advertising = false
          val readableCode = when (errorCode) {
            ADVERTISE_FAILED_DATA_TOO_LARGE -> "ADVERTISE_FAILED_DATA_TOO_LARGE"
            ADVERTISE_FAILED_TOO_MANY_ADVERTISERS -> "ADVERTISE_FAILED_TOO_MANY_ADVERTISERS"
            ADVERTISE_FAILED_ALREADY_STARTED -> "ADVERTISE_FAILED_ALREADY_STARTED"
            ADVERTISE_FAILED_INTERNAL_ERROR -> "ADVERTISE_FAILED_INTERNAL_ERROR"
            ADVERTISE_FAILED_FEATURE_UNSUPPORTED -> "ADVERTISE_FAILED_FEATURE_UNSUPPORTED"
            else -> "UNKNOWN"
          }

          promise.reject(
            "BLE_ADVERTISE_FAILED",
            "BLE advertising failed with code: $errorCode ($readableCode)",
          )
        }
      }

      bluetoothLeAdvertiser?.startAdvertising(settings, data, advertiseCallback)
    } catch (error: Exception) {
      advertising = false
      promise.reject("BLE_ADVERTISE_ERROR", error.message, error)
    }
  }

  @ReactMethod
  fun stopAdvertising(promise: Promise) {
    try {
      if (bluetoothLeAdvertiser != null && advertiseCallback != null) {
        bluetoothLeAdvertiser?.stopAdvertising(advertiseCallback)
      }

      advertiseCallback = null
      advertising = false
      connectedDevices.clear()
      bluetoothGattServer?.close()
      bluetoothGattServer = null
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("BLE_STOP_ERROR", error.message, error)
    }
  }

  @ReactMethod
  fun isAdvertising(promise: Promise) {
    promise.resolve(advertising)
  }

  @ReactMethod
  fun setWalletAddress(walletAddress: String?, promise: Promise) {
    currentWalletAddress = walletAddress
    promise.resolve(null)
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required for RN NativeEventEmitter compatibility.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for RN NativeEventEmitter compatibility.
  }

  @SuppressLint("MissingPermission")
  private fun setupGattServer(serviceUuid: String): Boolean {
    return try {
      val bluetoothManager = reactContext.getSystemService(BluetoothManager::class.java)
      if (bluetoothManager == null) {
        false
      } else {
        bluetoothGattServer?.close()
        connectedDevices.clear()

        bluetoothGattServer = bluetoothManager.openGattServer(reactContext, gattServerCallback)
        val service = BluetoothGattService(
          UUID.fromString(serviceUuid),
          BluetoothGattService.SERVICE_TYPE_PRIMARY,
        )

        val characteristic = BluetoothGattCharacteristic(
          CHARACTERISTIC_UUID,
          BluetoothGattCharacteristic.PROPERTY_READ or BluetoothGattCharacteristic.PROPERTY_WRITE,
          BluetoothGattCharacteristic.PERMISSION_READ or BluetoothGattCharacteristic.PERMISSION_WRITE,
        )
        characteristic.value = buildWalletResponsePayload().toByteArray(StandardCharsets.UTF_8)
        service.addCharacteristic(characteristic)

        bluetoothGattServer?.addService(service)
        bluetoothGattServer != null
      }
    } catch (_: Exception) {
      false
    }
  }

  @SuppressLint("MissingPermission")
  private val gattServerCallback = object : BluetoothGattServerCallback() {
    override fun onConnectionStateChange(device: BluetoothDevice, status: Int, newState: Int) {
      super.onConnectionStateChange(device, status, newState)

      val address = device.address ?: "unknown"
      if (newState == BluetoothProfile.STATE_CONNECTED) {
        connectedDevices.add(address)
        emitConnectionEvent("connected", address)
      } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
        connectedDevices.remove(address)
        emitConnectionEvent("disconnected", address)
      }
    }

    override fun onCharacteristicReadRequest(
      device: BluetoothDevice,
      requestId: Int,
      offset: Int,
      characteristic: BluetoothGattCharacteristic,
    ) {
      super.onCharacteristicReadRequest(device, requestId, offset, characteristic)
      val value = characteristic.value ?: buildWalletResponsePayload().toByteArray(StandardCharsets.UTF_8)
      bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, value)
    }

    override fun onCharacteristicWriteRequest(
      device: BluetoothDevice,
      requestId: Int,
      characteristic: BluetoothGattCharacteristic,
      preparedWrite: Boolean,
      responseNeeded: Boolean,
      offset: Int,
      value: ByteArray,
    ) {
      super.onCharacteristicWriteRequest(
        device,
        requestId,
        characteristic,
        preparedWrite,
        responseNeeded,
        offset,
        value,
      )

      val decodedValue = String(value, StandardCharsets.UTF_8)
      val messageType = extractType(decodedValue)

      if (messageType == PROTOCOL_WALLET_ADDRESS_REQUEST) {
        val responsePayload = buildWalletResponsePayload()
        characteristic.value = responsePayload.toByteArray(StandardCharsets.UTF_8)
        emitProtocolEvent(PROTOCOL_WALLET_ADDRESS_REQUEST, device.address ?: "unknown")
      } else if (messageType == PROTOCOL_DESKTOP_CHAT_INPUT) {
        val desktopMessage = extractMessage(decodedValue)
        characteristic.value = buildDesktopChatAckPayload().toByteArray(StandardCharsets.UTF_8)
        emitProtocolEvent(
          type = PROTOCOL_DESKTOP_CHAT_INPUT,
          deviceAddress = device.address ?: "unknown",
          message = desktopMessage,
        )
      } else {
        characteristic.value = value
      }

      if (responseNeeded) {
        bluetoothGattServer?.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, 0, null)
      }
    }
  }

  private fun emitConnectionEvent(status: String, deviceAddress: String) {
    val payload = Arguments.createMap().apply {
      putString("status", status)
      putString("deviceAddress", deviceAddress)
      putInt("connectedDevices", connectedDevices.size)
      putDouble("timestamp", System.currentTimeMillis().toDouble())
    }

    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(BLE_CONNECTION_EVENT, payload)
  }

  private fun emitProtocolEvent(type: String, deviceAddress: String, message: String? = null) {
    val payload = Arguments.createMap().apply {
      putString("type", type)
      putString("deviceAddress", deviceAddress)
      if (!message.isNullOrBlank()) {
        putString("message", message)
      }
      putDouble("timestamp", System.currentTimeMillis().toDouble())
    }

    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(BLE_PROTOCOL_EVENT, payload)
  }

  private fun extractType(rawPayload: String): String? {
    return try {
      val typeValue = JSONObject(rawPayload).optString("type", "")
      if (typeValue.isBlank()) null else typeValue
    } catch (_: Exception) {
      null
    }
  }

  private fun extractMessage(rawPayload: String): String? {
    return try {
      val payload = JSONObject(rawPayload)
      val message = payload.optString("message", "")
      if (message.isBlank()) null else message
    } catch (_: Exception) {
      null
    }
  }

  private fun buildWalletResponsePayload(): String {
    val payload = JSONObject().apply {
      put("type", PROTOCOL_WALLET_ADDRESS_RESPONSE)
      put("walletAddress", currentWalletAddress)
    }
    return payload.toString()
  }

  private fun buildDesktopChatAckPayload(): String {
    return JSONObject()
      .put("type", PROTOCOL_DESKTOP_CHAT_INPUT_ACK)
      .put("accepted", true)
      .toString()
  }

  override fun onHostResume() {}

  override fun onHostPause() {}

  override fun onHostDestroy() {
    try {
      if (bluetoothLeAdvertiser != null && advertiseCallback != null) {
        bluetoothLeAdvertiser?.stopAdvertising(advertiseCallback)
      }
      bluetoothGattServer?.close()
    } catch (_: Exception) {
    } finally {
      advertising = false
      advertiseCallback = null
      bluetoothGattServer = null
      connectedDevices.clear()
    }
  }

  companion object {
    private const val MODULE_NAME = "BlePeripheralModule"

    private const val BLE_CONNECTION_EVENT = "BlePeripheralConnectionState"
    private const val BLE_PROTOCOL_EVENT = "BlePeripheralProtocolEvent"

    private const val PROTOCOL_WALLET_ADDRESS_REQUEST = "wallet_address_request"
    private const val PROTOCOL_WALLET_ADDRESS_RESPONSE = "wallet_address_response"
    private const val PROTOCOL_DESKTOP_CHAT_INPUT = "desktop_chat_input"
    private const val PROTOCOL_DESKTOP_CHAT_INPUT_ACK = "desktop_chat_input_ack"

    private val CHARACTERISTIC_UUID = UUID.fromString("0000fe41-cc7a-482a-984a-7f2ed5b3e58f")

  }
}
