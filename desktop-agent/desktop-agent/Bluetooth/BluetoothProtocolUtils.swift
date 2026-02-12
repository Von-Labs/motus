import Foundation

enum BluetoothProtocolUtils {
    static func buildWalletAddressRequestData() -> Data {
        let payload: [String: String] = ["type": BluetoothEventName.walletAddressRequest]
        return (try? JSONSerialization.data(withJSONObject: payload, options: [])) ?? Data()
    }

    static func buildDesktopChatInputData(message: String) -> Data {
        let payload: [String: String] = [
            "type": BluetoothEventName.desktopChatInput,
            "message": message,
        ]
        return (try? JSONSerialization.data(withJSONObject: payload, options: [])) ?? Data()
    }

    static func parseWalletAddressResponse(from data: Data?) -> String?? {
        guard let data else {
            return nil
        }

        guard let response = try? JSONDecoder().decode(WalletAddressResponse.self, from: data) else {
            return nil
        }

        guard response.type == BluetoothEventName.walletAddressResponse else {
            return nil
        }

        return response.walletAddress
    }
}
