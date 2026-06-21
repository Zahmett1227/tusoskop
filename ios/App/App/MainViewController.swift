import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        NSLog("⚡️ [Tusoskop] MainViewController.capacitorDidLoad — IAPPlugin kaydediliyor")
        bridge?.registerPluginInstance(IAPPlugin())
        NSLog("⚡️ [Tusoskop] IAPPlugin kaydı tamamlandı")
    }
}
