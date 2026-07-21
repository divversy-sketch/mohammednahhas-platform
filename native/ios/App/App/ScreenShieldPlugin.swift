import Foundation
import Capacitor
import UIKit

@objc(ScreenShieldPlugin)
public class ScreenShieldPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScreenShieldPlugin"
    public let jsName = "ScreenShield"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "enable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "disable", returnType: CAPPluginReturnPromise)
    ]

    private var privacyView: UIView?

    @objc func enable(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard let window = UIApplication.shared.connectedScenes
                .compactMap({ ($0 as? UIWindowScene)?.keyWindow }).first else {
                call.reject("Window unavailable")
                return
            }
            let field = UITextField(frame: window.bounds)
            field.isSecureTextEntry = true
            field.isUserInteractionEnabled = false
            field.backgroundColor = .clear
            window.addSubview(field)
            window.layer.superlayer?.addSublayer(field.layer)
            field.layer.sublayers?.first?.addSublayer(window.layer)
            self.privacyView = field
            call.resolve(["enabled": true])
        }
    }

    @objc func disable(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.privacyView?.removeFromSuperview()
            self.privacyView = nil
            call.resolve(["enabled": false])
        }
    }
}
