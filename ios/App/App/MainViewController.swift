import UIKit
import Capacitor

class MainViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        print("⚡️ [Tusoskop] MainViewController.capacitorDidLoad — IAPPlugin kaydediliyor")
        bridge?.registerPluginInstance(IAPPlugin())
        print("⚡️ [Tusoskop] IAPPlugin kaydı tamamlandı")
    }
}
