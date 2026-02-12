import SwiftUI

struct ContentView: View {
    @ObservedObject var store: BluetoothStore
    @State private var selection: AppSection? = .bluetooth

    var body: some View {
        NavigationSplitView {
            GlassSidebar(selection: $selection)
                .frame(minWidth: 240)
        } detail: {
            switch selection ?? .bluetooth {
            case .bluetooth:
                BluetoothScanScreen(store: store)
            case .device:
                DeviceScreen(store: store)
            }
        }
        .frame(minWidth: 980, minHeight: 680)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView(store: BluetoothStore())
    }
}
