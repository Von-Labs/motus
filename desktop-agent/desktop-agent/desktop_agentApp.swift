import SwiftUI

@main
struct desktop_agentApp: App {
    @StateObject private var store = BluetoothStore()

    var body: some Scene {
        WindowGroup {
            ContentView(store: store)
        }

        MenuBarExtra {
            MenuBarBluetoothStatusView(store: store)
        } label: {
            Image(systemName: store.hasConnectedDevice ? "iphone.radiowaves.left.and.right" : "antenna.radiowaves.left.and.right")
        }
        .menuBarExtraStyle(.window)
    }
}
