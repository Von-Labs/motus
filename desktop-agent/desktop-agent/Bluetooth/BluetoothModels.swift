import Foundation

struct DiscoveredDevice: Identifiable {
    let id: UUID
    let name: String
    let rssi: Int
    let isConnectable: Bool
    let lastSeen: Date

    var displayName: String {
        name.isEmpty ? "Unknown Device" : name
    }
}

enum WalletRequestState: String {
    case idle
    case waiting
    case received
    case failed

    var label: String {
        switch self {
        case .idle:
            return "Idle"
        case .waiting:
            return "Waiting For Phone Response"
        case .received:
            return "Response Received"
        case .failed:
            return "Failed"
        }
    }
}

struct WalletAddressResponse: Decodable {
    let type: String
    let walletAddress: String?
}
