import Foundation

enum BluetoothConstants {
    static let mobileServiceUUID = "0000fe40-cc7a-482a-984a-7f2ed5b3e58f"
    static let mobileCharacteristicUUID = "0000fe41-cc7a-482a-984a-7f2ed5b3e58f"
    static let expectedMobileName = "DefiAgentMobile"
}

enum BluetoothEventName {
    static let walletAddressRequest = "wallet_address_request"
    static let walletAddressResponse = "wallet_address_response"
    static let desktopChatInput = "desktop_chat_input"
}
