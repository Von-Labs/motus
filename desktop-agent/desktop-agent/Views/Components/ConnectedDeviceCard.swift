import SwiftUI

struct ConnectedDeviceCard: View {
    let connectedDeviceName: String?
    let walletAddress: String?
    let requestState: WalletRequestState
    let onRequestAddress: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            HStack(spacing: 16) {
                Image(systemName: "iphone.gen3")
                    .font(.system(size: 48, weight: .medium))
                    .foregroundStyle(.white.opacity(0.9))
                    .padding(16)
                    .background(
                        RoundedRectangle(cornerRadius: 18)
                            .fill(Color.cyan.opacity(0.28))
                    )

                VStack(alignment: .leading, spacing: 6) {
                    Text(connectedDeviceName ?? "No phone connected")
                        .font(.title2)
                        .fontWeight(.semibold)
                    Text("Wallet Address")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                    Text(walletAddress ?? "null")
                        .font(.body.monospaced())
                        .foregroundStyle(walletAddress == nil ? .secondary : .primary)
                }

                Spacer()
            }

            HStack {
                Text("Request State: \(requestState.label)")
                    .font(.caption)
                    .foregroundStyle(.secondary)

                Spacer()

                Button("Request Wallet Address", action: onRequestAddress)
                    .buttonStyle(.borderedProminent)
                    .disabled(connectedDeviceName == nil || requestState == .waiting)
            }
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 24)
                .fill(
                    LinearGradient(
                        colors: [Color.white.opacity(0.18), Color.white.opacity(0.05)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .background(.ultraThinMaterial)
        )
        .overlay(
            RoundedRectangle(cornerRadius: 24)
                .stroke(Color.white.opacity(0.2), lineWidth: 1)
        )
    }
}
