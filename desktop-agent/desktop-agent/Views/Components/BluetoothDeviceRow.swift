import SwiftUI

struct BluetoothDeviceRow: View {
    let device: DiscoveredDevice
    let isConnected: Bool
    let onConnect: () -> Void

    var body: some View {
        let connectableText = device.isConnectable ? "Yes" : "No"

        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(device.displayName)
                    .font(.headline)
                Text(device.id.uuidString)
                    .font(.caption2)
                    .foregroundStyle(.secondary)
                Text("RSSI: \(device.rssi) | Connectable: \(connectableText)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if isConnected {
                Text("Connected")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundStyle(.green)
            } else {
                Button("Connect", action: onConnect)
            }
        }
        .padding(.vertical, 2)
    }
}
