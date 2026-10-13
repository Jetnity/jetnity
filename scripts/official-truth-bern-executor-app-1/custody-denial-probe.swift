import Foundation
import Security

// Rehearsal-only foreign executable. Its path and public pin are compiled from
// the same fresh synthetic run. It is NEVER added to the import ACL.
@main
struct DenialProbe {
    static func main() {
        SecKeychainSetUserInteractionAllowed(false)
        var vault: SecKeychain?
        guard SecKeychainOpen(SyntheticConfiguration.directory + "/synthetic.keychain-db", &vault) == errSecSuccess,
              let vault else { print("{\"probeUnavailable\":true}"); exit(2) }
        let query: [CFString: Any] = [kSecClass: kSecClassKey, kSecAttrKeyClass: kSecAttrKeyClassPrivate,
            kSecMatchSearchList: [vault], kSecReturnRef: true, kSecMatchLimit: kSecMatchLimitAll]
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let keys = result as? [SecKey], keys.count == 1, let key = keys.first,
              let publicKey = SecKeyCopyPublicKey(key),
              let bytes = SecKeyCopyExternalRepresentation(publicKey, nil) as Data?,
              bytes.base64EncodedString() == SyntheticConfiguration.publicKey else {
            print("{\"probeUnavailable\":true}"); exit(2)
        }
        var error: Unmanaged<CFError>?
        let signature = SecKeyCreateSignature(key, .rsaSignatureMessagePKCS1v15SHA256,
            Data("unregistered-synthetic-denial-probe".utf8) as CFData, &error)
        let signCode = error.map { CFErrorGetCode($0.takeRetainedValue()) } ?? 0
        error = nil
        let exported = SecKeyCopyExternalRepresentation(key, &error)
        let exportCode = error.map { CFErrorGetCode($0.takeRetainedValue()) } ?? 0
        print("{\"signDenied\":\(signature == nil),\"exportDenied\":\(exported == nil),\"signCode\":\(signCode),\"exportCode\":\(exportCode)}")
        exit(signature == nil && exported == nil ? 0 : 2)
    }
}
