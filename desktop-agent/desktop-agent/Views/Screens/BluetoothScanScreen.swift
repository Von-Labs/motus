import SwiftUI

struct BluetoothScanScreen: View {
    @ObservedObject var store: BluetoothStore

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 6) {
                Text("Bluetooth Scanner")
                    .font(.title2)
                    .fontWeight(.semibold)
                Text("Discover Android app advertising service \(BluetoothConstants.mobileServiceUUID)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text("Bluetooth: \(store.bluetoothStateText)")
                    .font(.subheadline)
                    .foregroundStyle(store.bluetoothStateText == "Powered On" ? .green : .orange)
            }

            HStack(spacing: 12) {
                Button(store.isScanning ? "Scanning..." : "Start Scan") {
                    store.startScan()
                }
                .disabled(!store.canStartScan)

                Button("Stop") {
                    store.stopScan()
                }
                .disabled(!store.isScanning)

                if store.hasConnectedDevice {
                    Button("Disconnect") {
                        store.disconnectActive()
                    }
                }
            }

            GroupBox("Discovered Devices") {
                if store.devices.isEmpty {
                    Text(store.isScanning ? "Scanning for devices..." : "No devices found yet")
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .foregroundStyle(.secondary)
                        .padding(.vertical, 8)
                } else {
                    List(store.devices) { device in
                        BluetoothDeviceRow(
                            device: device,
                            isConnected: store.isConnected(device.id),
                            onConnect: { store.connect(to: device.id) }
                        )
                    }
                    .listStyle(.plain)
                    .frame(minHeight: 240)
                }
            }

            BluetoothLogPanel(logs: store.logs)

            Spacer(minLength: 0)
        }
        .padding(20)
    }
}
