import Foundation
import Capacitor
import AuthenticationServices
import CryptoKit

/// Native Apple Sign-In — Capacitor plugin.
///
/// JS tarafı Capacitor bridge üzerinden `NativeAppleSignIn.signIn()` çağırır.
/// Bu plugin ASAuthorizationAppleIDProvider ile native Apple sheet'i gösterir,
/// idToken ve nonce alır, call.resolve() ile JS'e döner.
///
/// JS tarafında bu Promise'in .then() içinde window.handleAppleSignIn çağrılır,
/// orada OAuthProvider.credential({idToken, rawNonce}) + signInWithCredential tamamlanır.
///
/// Alternatif olarak Swift şunu da kullanabilirdi:
///   self.bridge?.webView?.evaluateJavaScript(
///     "window.handleAppleSignIn({idToken: '\(idToken)', nonce: '\(nonce)'})"
///   )
/// Bu pattern nativeAuthService.js'de de desteklenmektedir.
@objc(NativeAppleSignInPlugin)
public class NativeAppleSignInPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NativeAppleSignInPlugin"
    public let jsName = "NativeAppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise)
    ]

    private var currentNonce: String?
    private var pendingCall: CAPPluginCall?

    @objc func signIn(_ call: CAPPluginCall) {
        pendingCall = call
        let nonce = randomNonceString()
        currentNonce = nonce

        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.fullName, .email]
        request.nonce = sha256(nonce)

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self

        DispatchQueue.main.async {
            controller.performRequests()
        }
    }

    // MARK: - Crypto helpers

    private func randomNonceString(length: Int = 32) -> String {
        let charset: [Character] = Array(
            "0123456789ABCDEFGHIJKLMNOPQRSTUVXYZabcdefghijklmnopqrstuvwxyz-._"
        )
        var bytes = [UInt8](repeating: 0, count: length)
        _ = SecRandomCopyBytes(kSecRandomDefault, length, &bytes)
        return String(bytes.map { charset[Int($0) % charset.count] })
    }

    private func sha256(_ input: String) -> String {
        SHA256.hash(data: Data(input.utf8))
            .compactMap { String(format: "%02x", $0) }
            .joined()
    }
}

// MARK: - ASAuthorizationControllerDelegate

extension NativeAppleSignInPlugin: ASAuthorizationControllerDelegate {
    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithAuthorization authorization: ASAuthorization
    ) {
        let call = pendingCall
        let nonce = currentNonce
        pendingCall = nil
        currentNonce = nil

        guard
            let call = call,
            let nonce = nonce,
            let appleCredential = authorization.credential as? ASAuthorizationAppleIDCredential,
            let tokenData = appleCredential.identityToken,
            let idToken = String(data: tokenData, encoding: .utf8)
        else {
            call?.reject("Apple kimlik bilgileri alınamadı.")
            return
        }

        call.resolve(["idToken": idToken, "nonce": nonce])
    }

    public func authorizationController(
        controller: ASAuthorizationController,
        didCompleteWithError error: Error
    ) {
        let call = pendingCall
        pendingCall = nil
        currentNonce = nil

        let nsError = error as NSError
        if nsError.code == ASAuthorizationError.canceled.rawValue {
            call?.reject("USER_CANCELLED")
        } else {
            call?.reject(error.localizedDescription)
        }
    }
}

// MARK: - ASAuthorizationControllerPresentationContextProviding

extension NativeAppleSignInPlugin: ASAuthorizationControllerPresentationContextProviding {
    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        self.bridge?.viewController?.view.window ?? UIWindow()
    }
}
