import Foundation
import Security
import Darwin

// No production lookup exists. The manual rehearsal adds a separately generated
// SyntheticConfiguration with an exact temporary path and fresh public-key pin.
// Neither configuration nor private material is accepted through argv/stdin/env.
@main
struct BernCustodySigner {
    static let identity = "org.jetnity.bern-executor-app-1.signer.synthetic.v1"
    static func refuse(_ code: String) -> Never {
        print("{\"status\":\"BLOCKED\",\"code\":\"\(code)\"}")
        exit(2)
    }

    static func main() {
        guard CommandLine.arguments == [CommandLine.arguments[0], "--synthetic-sign"] else {
            refuse("invocation_rejected")
        }
        #if CUSTODY_SYNTHETIC_REHEARSAL
        alarm(5)
        guard SecKeychainSetUserInteractionAllowed(false) == errSecSuccess else {
            refuse("interaction_policy_failed")
        }
        let forbidden = ["GH_TOKEN", "GITHUB_TOKEN", "GITHUB_APP_PRIVATE_KEY", "SSH_AUTH_SOCK",
                         "DYLD_INSERT_LIBRARIES", "DYLD_LIBRARY_PATH", "HTTP_PROXY", "HTTPS_PROXY"]
        guard forbidden.allSatisfy({ ProcessInfo.processInfo.environment[$0] == nil }) else {
            refuse("environment_rejected")
        }
        do {
            if let extra = try FileHandle.standardInput.read(upToCount: 1), !extra.isEmpty {
                refuse("input_rejected")
            }
        } catch { refuse("input_rejected") }
        signAfterInputCheck()
        #else
        refuse("production_disabled")
        #endif
    }

    #if CUSTODY_SYNTHETIC_REHEARSAL
    static func signAfterInputCheck() {
        var myself: SecCode?
        var requirement: SecRequirement?
        guard SecCodeCopySelf([], &myself) == errSecSuccess, let myself,
              SecRequirementCreateWithString(("identifier \"" + identity + "\"") as CFString, [],
                                             &requirement) == errSecSuccess, let requirement,
              SecCodeCheckValidity(myself, SecCSFlags(rawValue: kSecCSStrictValidate), requirement) == errSecSuccess else {
            refuse("executable_identity_rejected")
        }
        let started = DispatchTime.now().uptimeNanoseconds
        let wall = Date().timeIntervalSince1970
        guard wall.isFinite, wall >= 946684800, wall < 4102444800 else { refuse("clock_invalid") }
        let now = Int64(wall.rounded(.down))
        let vault = SyntheticConfiguration.directory + "/synthetic.keychain-db"
        for (path, directory) in [(SyntheticConfiguration.directory, true), (vault, false)] {
            var metadata = stat()
            guard lstat(path, &metadata) == 0,
                  (metadata.st_mode & S_IFMT) == (directory ? S_IFDIR : S_IFREG),
                  metadata.st_uid == getuid(), (metadata.st_mode & 0o777) == (directory ? 0o700 : 0o600),
                  directory || metadata.st_nlink == 1,
                  URL(fileURLWithPath: path).resolvingSymlinksInPath().path == path else {
                refuse("custody_path_rejected")
            }
        }
        var vaultRef: SecKeychain?
        guard SecKeychainOpen(vault, &vaultRef) == errSecSuccess, let vaultRef else {
            refuse("vault_unavailable")
        }
        let query: [CFString: Any] = [kSecClass: kSecClassKey, kSecAttrKeyClass: kSecAttrKeyClassPrivate,
            kSecMatchSearchList: [vaultRef], kSecReturnRef: true, kSecMatchLimit: kSecMatchLimitAll]
        var matches: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &matches) == errSecSuccess,
              let keys = matches as? [SecKey], keys.count == 1, let key = keys.first,
              let publicKey = SecKeyCopyPublicKey(key),
              let publicBytes = SecKeyCopyExternalRepresentation(publicKey, nil) as Data?,
              publicBytes.base64EncodedString() == SyntheticConfiguration.publicKey else {
            refuse("key_identity_rejected")
        }
        // The pin is freshly generated RSA2048, never an App registration/identity.
        let header = base64url(Data("{\"alg\":\"RS256\",\"typ\":\"JWT\"}".utf8))
        let claims = "{\"iss\":\"SYNTHETIC-UNREGISTERED-BERN-APP\",\"iat\":\(now - 60),\"exp\":\(now + 300)}"
        let signingInput = header + "." + base64url(Data(claims.utf8))
        guard SecKeyIsAlgorithmSupported(key, .sign, .rsaSignatureMessagePKCS1v15SHA256),
              let signature = SecKeyCreateSignature(key, .rsaSignatureMessagePKCS1v15SHA256,
                  Data(signingInput.utf8) as CFData, nil) as Data? else { refuse("signing_denied") }
        // Rehearsal-only negative test. No private bytes are printed, even on a broken import policy.
        guard SecKeyCopyExternalRepresentation(key, nil) == nil else { refuse("export_policy_failed") }
        guard DispatchTime.now().uptimeNanoseconds - started < 5_000_000_000 else {
            refuse("signing_deadline")
        }
        let assertion = signingInput + "." + base64url(signature)
        // Captured only by the local rehearsal pipe, verified and discarded there.
        print("{\"status\":\"SYNTHETIC_SIGNED\",\"privateExportDenied\":true,\"assertion\":\"\(assertion)\"}")
    }

    static func base64url(_ value: Data) -> String {
        value.base64EncodedString().replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }
    #endif
}
