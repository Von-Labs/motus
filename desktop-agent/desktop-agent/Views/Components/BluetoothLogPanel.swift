import SwiftUI

struct BluetoothLogPanel: View {
    let logs: [String]

    var body: some View {
        GroupBox("Logs") {
            if logs.isEmpty {
                Text("No logs yet")
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .foregroundStyle(.secondary)
                    .padding(.vertical, 8)
            } else {
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 6) {
                        ForEach(logs, id: \.self) { line in
                            Text(line)
                                .font(.caption)
                                .textSelection(.enabled)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
                .frame(minHeight: 140, maxHeight: 220)
            }
        }
    }
}
