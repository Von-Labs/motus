import CoreBluetooth
import Combine
import Foundation

@MainActor
final class BluetoothStore: NSObject, ObservableObject {
    @Published private(set) var bluetoothStateText: String = "Initializing"
    @Published private(set) var isScanning: Bool = false
    @Published private(set) var devices: [DiscoveredDevice] = []
    @Published private(set) var activeConnectionID: UUID?
    @Published private(set) var connectedDeviceName: String?
    @Published private(set) var walletAddress: String?
    @Published private(set) var walletRequestState: WalletRequestState = .idle
    @Published private(set) var logs: [String] = []

    private let serviceUUID = CBUUID(string: BluetoothConstants.mobileServiceUUID)
    private let characteristicUUID = CBUUID(string: BluetoothConstants.mobileCharacteristicUUID)

    private var centralManager: CBCentralManager!
    private var peripheralsByID: [UUID: CBPeripheral] = [:]
    private var discoveredByID: [UUID: DiscoveredDevice] = [:]
    private var activeCharacteristic: CBCharacteristic?

    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
        appendLog("Desktop BLE central initialized")
    }

    var canStartScan: Bool {
        !isScanning && centralManager.state == .poweredOn
    }

    var hasConnectedDevice: Bool {
        activeConnectionID != nil
    }

    func startScan() {
        guard centralManager.state == .poweredOn else {
            appendLog("Cannot scan. Bluetooth state: \(bluetoothStateText)")
            return
        }

        discoveredByID.removeAll()
        devices = []
        isScanning = true

        centralManager.scanForPeripherals(
            withServices: [serviceUUID],
            options: [CBCentralManagerScanOptionAllowDuplicatesKey: true]
        )
        appendLog("Scanning started for service \(BluetoothConstants.mobileServiceUUID)")
    }

    func stopScan() {
        guard isScanning else { return }
        centralManager.stopScan()
        isScanning = false
        appendLog("Scanning stopped")
    }

    func connect(to deviceID: UUID) {
        guard let peripheral = peripheralsByID[deviceID] else {
            appendLog("Connect failed: missing peripheral reference")
            return
        }

        if let activeConnectionID,
           activeConnectionID != deviceID,
           let activePeripheral = peripheralsByID[activeConnectionID] {
            centralManager.cancelPeripheralConnection(activePeripheral)
            appendLog("Disconnected previous active peripheral")
        }

        stopScan()
        activeConnectionID = deviceID
        connectedDeviceName = peripheral.name
        walletAddress = nil
        walletRequestState = .idle
        activeCharacteristic = nil

        peripheral.delegate = self
        appendLog("Connecting to \(peripheral.name ?? peripheral.identifier.uuidString)")
        centralManager.connect(peripheral, options: nil)
    }

    func disconnectActive() {
        guard let activeConnectionID, let activePeripheral = peripheralsByID[activeConnectionID] else {
            return
        }

        centralManager.cancelPeripheralConnection(activePeripheral)
        appendLog("Disconnect requested")
    }

    func requestWalletAddress() {
        guard let activeConnectionID,
              let peripheral = peripheralsByID[activeConnectionID],
              peripheral.state == .connected else {
            walletRequestState = .failed
            appendLog("Cannot request wallet address: no active BLE connection")
            return
        }

        guard let characteristic = activeCharacteristic else {
            walletRequestState = .failed
            appendLog("Cannot request wallet address: characteristic unavailable")
            return
        }

        walletRequestState = .waiting
        let requestData = BluetoothProtocolUtils.buildWalletAddressRequestData()

        let supportsWriteWithResponse = characteristic.properties.contains(.write)
        let writeType: CBCharacteristicWriteType = supportsWriteWithResponse ? .withResponse : .withoutResponse

        peripheral.writeValue(requestData, for: characteristic, type: writeType)
        appendLog("Wallet address request sent to phone")

        if !supportsWriteWithResponse && characteristic.properties.contains(.read) {
            peripheral.readValue(for: characteristic)
            appendLog("Waiting for wallet response from characteristic read")
        }
    }

    @discardableResult
    func sendDesktopChatInput(_ message: String) -> Bool {
        let trimmedMessage = message.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedMessage.isEmpty else {
            appendLog("Chat input send skipped: empty message")
            return false
        }

        guard let activeConnectionID,
              let peripheral = peripheralsByID[activeConnectionID],
              peripheral.state == .connected else {
            appendLog("Cannot send chat input: no active BLE connection")
            return false
        }

        guard let characteristic = activeCharacteristic else {
            appendLog("Cannot send chat input: characteristic unavailable")
            return false
        }

        let payload = BluetoothProtocolUtils.buildDesktopChatInputData(message: trimmedMessage)
        let writeType: CBCharacteristicWriteType =
            characteristic.properties.contains(.write) ? .withResponse : .withoutResponse

        peripheral.writeValue(payload, for: characteristic, type: writeType)
        appendLog("Desktop chat message sent to mobile")
        return true
    }

    func isConnected(_ deviceID: UUID) -> Bool {
        activeConnectionID == deviceID && peripheralsByID[deviceID]?.state == .connected
    }

    private func refreshDevices() {
        devices = discoveredByID.values.sorted { lhs, rhs in
            if lhs.lastSeen != rhs.lastSeen {
                return lhs.lastSeen > rhs.lastSeen
            }
            return lhs.displayName.localizedCaseInsensitiveCompare(rhs.displayName) == .orderedAscending
        }
    }

    private func resetConnectionState() {
        activeConnectionID = nil
        connectedDeviceName = nil
        walletAddress = nil
        walletRequestState = .idle
        activeCharacteristic = nil
    }

    private func appendLog(_ message: String) {
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        logs.insert("[\(timestamp)] \(message)", at: 0)
        if logs.count > 50 {
            logs = Array(logs.prefix(50))
        }
    }
}

extension BluetoothStore: CBCentralManagerDelegate {
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        let stateText: String
        switch central.state {
        case .unknown:
            stateText = "Unknown"
        case .resetting:
            stateText = "Resetting"
        case .unsupported:
            stateText = "Unsupported"
        case .unauthorized:
            stateText = "Unauthorized"
        case .poweredOff:
            stateText = "Powered Off"
        case .poweredOn:
            stateText = "Powered On"
        @unknown default:
            stateText = "Unknown Future State"
        }

        bluetoothStateText = stateText
        appendLog("Bluetooth state: \(stateText)")

        if central.state != .poweredOn {
            stopScan()
            resetConnectionState()
        }
    }

    func centralManager(
        _ central: CBCentralManager,
        didDiscover peripheral: CBPeripheral,
        advertisementData: [String: Any],
        rssi RSSI: NSNumber
    ) {
        let localName = (advertisementData[CBAdvertisementDataLocalNameKey] as? String) ?? ""
        let resolvedName = peripheral.name ?? localName
        let connectable = (advertisementData[CBAdvertisementDataIsConnectable] as? NSNumber)?.boolValue ?? false

        peripheralsByID[peripheral.identifier] = peripheral
        discoveredByID[peripheral.identifier] = DiscoveredDevice(
            id: peripheral.identifier,
            name: resolvedName,
            rssi: RSSI.intValue,
            isConnectable: connectable,
            lastSeen: Date()
        )

        refreshDevices()
    }

    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        activeConnectionID = peripheral.identifier
        connectedDeviceName = peripheral.name ?? peripheral.identifier.uuidString
        walletRequestState = .idle
        appendLog("Connected to \(connectedDeviceName ?? "Unknown")")
        peripheral.discoverServices([serviceUUID])
    }

    func centralManager(_ central: CBCentralManager, didFailToConnect peripheral: CBPeripheral, error: Error?) {
        appendLog("Failed to connect: \(error?.localizedDescription ?? "Unknown error")")
        resetConnectionState()
    }

    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        if let error {
            appendLog("Disconnected with error: \(error.localizedDescription)")
        } else {
            appendLog("Disconnected from \(peripheral.name ?? peripheral.identifier.uuidString)")
        }

        if activeConnectionID == peripheral.identifier {
            resetConnectionState()
        }
    }
}

extension BluetoothStore: CBPeripheralDelegate {
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        if let error {
            appendLog("Service discovery failed: \(error.localizedDescription)")
            walletRequestState = .failed
            return
        }

        guard let services = peripheral.services else {
            appendLog("No services discovered")
            walletRequestState = .failed
            return
        }

        guard let service = services.first(where: { $0.uuid == serviceUUID }) else {
            appendLog("Connected, but expected service not found")
            walletRequestState = .failed
            return
        }

        appendLog("Target service discovered")
        peripheral.discoverCharacteristics([characteristicUUID], for: service)
    }

    func peripheral(
        _ peripheral: CBPeripheral,
        didDiscoverCharacteristicsFor service: CBService,
        error: Error?
    ) {
        if let error {
            appendLog("Characteristic discovery failed: \(error.localizedDescription)")
            walletRequestState = .failed
            return
        }

        guard let characteristics = service.characteristics,
              let characteristic = characteristics.first(where: { $0.uuid == characteristicUUID }) else {
            appendLog("Target characteristic not found")
            walletRequestState = .failed
            return
        }

        activeCharacteristic = characteristic
        appendLog("Target characteristic ready")
        requestWalletAddress()
    }

    func peripheral(
        _ peripheral: CBPeripheral,
        didWriteValueFor characteristic: CBCharacteristic,
        error: Error?
    ) {
        if let error {
            walletRequestState = .failed
            appendLog("Wallet request write failed: \(error.localizedDescription)")
            return
        }

        appendLog("Wallet request write succeeded")
        if walletRequestState == .waiting && characteristic.properties.contains(.read) {
            peripheral.readValue(for: characteristic)
        }
    }

    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard walletRequestState == .waiting else {
            appendLog("Ignoring characteristic update for non-wallet request flow")
            return
        }

        if let error {
            walletRequestState = .failed
            appendLog("Wallet response read failed: \(error.localizedDescription)")
            return
        }

        guard let parsedWallet = BluetoothProtocolUtils.parseWalletAddressResponse(from: characteristic.value) else {
            walletRequestState = .failed
            appendLog("Wallet response parsing failed")
            return
        }

        walletAddress = parsedWallet
        walletRequestState = .received
        appendLog("Wallet response received: \(parsedWallet ?? "null")")
    }
}
