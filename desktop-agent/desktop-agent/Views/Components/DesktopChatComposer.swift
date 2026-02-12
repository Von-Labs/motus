import SwiftUI

struct DesktopChatComposer: View {
    @State private var messageText: String = ""
    let isConnected: Bool
    let onSend: (String) -> Bool

    var body: some View {
        GroupBox("Send To Mobile Chat") {
            VStack(alignment: .leading, spacing: 10) {
                Text("Type a message from desktop and inject it into mobile chat input.")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                TextField("Type message...", text: $messageText)
                    .textFieldStyle(.roundedBorder)
                    .disabled(!isConnected)

                HStack {
                    Spacer()
                    Button("Send") {
                        let payload = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard !payload.isEmpty else { return }

                        if onSend(payload) {
                            messageText = ""
                        }
                    }
                    .buttonStyle(.borderedProminent)
                    .disabled(!isConnected || messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}
