import SwiftUI

struct DeviceScreen: View {
    @ObservedObject var store: BluetoothStore

    var body: some View {
        VStack(alignment: .leading, spacing: 18) {
            Text("Connected Device")
                .font(.largeTitle)
                .fontWeight(.bold)

            ConnectedDeviceCard(
                connectedDeviceName: store.connectedDeviceName,
                walletAddress: store.walletAddress,
                requestState: store.walletRequestState,
                onRequestAddress: { store.requestWalletAddress() }
            )

            DesktopChatComposer(
                isConnected: store.hasConnectedDevice,
                onSend: { store.sendDesktopChatInput($0) }
            )

            BluetoothLogPanel(logs: store.logs)
            Spacer(minLength: 0)
        }
        .padding(22)
    }
}
