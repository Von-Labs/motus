import Foundation

enum AppSection: String, CaseIterable, Hashable, Identifiable {
    case bluetooth
    case device

    var id: String { rawValue }

    var title: String {
        switch self {
        case .bluetooth:
            return "Bluetooth Scan"
        case .device:
            return "Device"
        }
    }

    var systemImage: String {
        switch self {
        case .bluetooth:
            return "dot.radiowaves.left.and.right"
        case .device:
            return "iphone.gen3"
        }
    }
}
