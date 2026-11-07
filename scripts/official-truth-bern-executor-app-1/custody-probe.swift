import Foundation
import Security

// Synthetic temporary keychain only. No global keychain search or real key.
SecKeychainSetUserInteractionAllowed(false)
guard CommandLine.arguments.count == 2 else { print("invalid_arguments"); exit(2) }
let target = CommandLine.arguments[1]
guard target.hasPrefix("/private/tmp/jetnity-app-synthetic-custody-"),
  target.hasSuffix("/synthetic.keychain-db"), !target.contains("..") else {
  print("synthetic_target_required"); exit(2)
}
var keychain: SecKeychain?
let opened = SecKeychainOpen(CommandLine.arguments[1], &keychain)
guard opened == errSecSuccess, let keychain else { print("open_status=\(opened)"); exit(2) }
let query: [CFString: Any] = [kSecClass: kSecClassKey, kSecAttrKeyClass: kSecAttrKeyClassPrivate,
  kSecMatchSearchList: [keychain], kSecReturnRef: true, kSecMatchLimit: kSecMatchLimitOne]
var item: CFTypeRef?
let found = SecItemCopyMatching(query as CFDictionary, &item)
guard found == errSecSuccess, let item else { print("lookup_status=\(found)"); exit(2) }
let key = item as! SecKey
var error: Unmanaged<CFError>?
let signature = SecKeyCreateSignature(key, .rsaSignatureMessagePKCS1v15SHA256,
  Data("synthetic-custody-proof".utf8) as CFData, &error)
print("signature_available=\(signature != nil)")
if let e = error { print("sign_error_code=\(CFErrorGetCode(e.takeRetainedValue()))") }
error = nil
let exported = SecKeyCopyExternalRepresentation(key, &error)
print("private_export_available=\(exported != nil)")
if let e = error { print("export_error_code=\(CFErrorGetCode(e.takeRetainedValue()))") }
exit(signature != nil && exported == nil ? 0 : 2)
