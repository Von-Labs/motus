import SwiftUI

struct MenuBarBluetoothStatusView: View {
    @ObservedObject var store: BluetoothStore
    @State private var messageText: String = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("Defi Agent")
                .font(.headline)

            HStack {
                Circle()
                    .fill(store.hasConnectedDevice ? Color.green : Color.orange)
                    .frame(width: 8, height: 8)
                Text(store.hasConnectedDevice ? "Connected" : "Not Connected")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text("Device")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text(store.connectedDeviceName ?? "No phone connected")
                    .font(.subheadline)
                    .lineLimit(2)
            }

            if let wallet = store.walletAddress {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Wallet")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                    Text(wallet)
                        .font(.caption.monospaced())
                        .lineLimit(1)
                }
            }

            Divider()

            VStack(alignment: .leading, spacing: 6) {
                Text("Send Message")
                    .font(.caption2)
                    .foregroundStyle(.secondary)

                HStack(spacing: 6) {
                    TextField("Type...", text: $messageText)
                        .textFieldStyle(.roundedBorder)
                        .disabled(!store.hasConnectedDevice)

                    Button("Send") {
                        let payload = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard !payload.isEmpty else { return }

                        if store.sendDesktopChatInput(payload) {
                            messageText = ""
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!store.hasConnectedDevice || messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }

            Divider()

            HStack(spacing: 8) {
                Button("Scan") {
                    store.startScan()
                }
                .disabled(!store.canStartScan)

                if store.hasConnectedDevice {
                    Button("Disconnect") {
                        store.disconnectActive()
                    }
                }
            }

            Text("Bluetooth: \(store.bluetoothStateText)")
                .font(.caption2)
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .frame(width: 280)
    }
}
