import Capacitor
import StoreKit

@objc(IAPPlugin)
public class IAPPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "IAPPlugin"
    public let jsName = "IAP"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchaseProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getActiveSubscriptions", returnType: CAPPluginReturnPromise),
    ]

    private var cachedProducts: [Product] = []

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let productIds = call.getArray("productIds", String.self), !productIds.isEmpty else {
            call.reject("productIds array required")
            return
        }
        Task {
            do {
                NSLog("⚡️ [Tusoskop IAP] getProducts istenen ID'ler: \(productIds)")
                let products = try await Product.products(for: Set(productIds))
                NSLog("⚡️ [Tusoskop IAP] StoreKit \(products.count) ürün döndürdü: \(products.map { $0.id })")
                self.cachedProducts = products
                let list = products.map { p -> [String: Any] in
                    var d: [String: Any] = [
                        "productId": p.id,
                        "localizedTitle": p.displayName,
                        "localizedDescription": p.description,
                        "localizedPrice": p.displayPrice,
                        "priceDecimal": (p.price as NSDecimalNumber).doubleValue,
                    ]
                    if let sub = p.subscription {
                        let unit: String
                        switch sub.subscriptionPeriod.unit {
                        case .day:   unit = "day"
                        case .week:  unit = "week"
                        case .month: unit = "month"
                        case .year:  unit = "year"
                        @unknown default: unit = "unknown"
                        }
                        d["subscriptionPeriodUnit"] = unit
                        d["subscriptionPeriodValue"] = sub.subscriptionPeriod.value
                    }
                    return d
                }
                call.resolve(["products": list])
            } catch {
                NSLog("⚡️ [Tusoskop IAP] getProducts HATA: \(error.localizedDescription)")
                call.reject("PRODUCTS_ERROR", error.localizedDescription, error)
            }
        }
    }

    @objc func purchaseProduct(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("productId required")
            return
        }
        Task {
            do {
                if cachedProducts.isEmpty {
                    cachedProducts = try await Product.products(for: [productId])
                }
                guard let product = cachedProducts.first(where: { $0.id == productId }) else {
                    call.reject("PRODUCT_NOT_FOUND", "Product \(productId) not found")
                    return
                }
                let result = try await product.purchase()
                switch result {
                case .success(let vr):
                    switch vr {
                    case .verified(let tx):
                        await tx.finish()
                        // En güncel transaction'ı kullan. Sandbox'ta product.purchase()
                        // bazen aboneliğin ESKİ/orijinal transaction'ını döndürebiliyor;
                        // bunun expirationDate'i (hızlandırılmış sandbox süresi) geçmişte
                        // kalıp sunucuda "süresi dolmuş" hatasına yol açıyor.
                        // Transaction.latest mevcut dönemi yansıtır.
                        var bestVR = vr
                        var bestTx = tx
                        if let latest = await Transaction.latest(for: tx.productID),
                           case .verified(let ltx) = latest {
                            bestVR = latest
                            bestTx = ltx
                        }
                        var d: [String: Any] = [
                            "transactionId": String(bestTx.id),
                            "productId": bestTx.productID,
                            "jwsRepresentation": bestVR.jwsRepresentation,
                            "originalTransactionId": String(bestTx.originalID),
                            "purchaseDate": bestTx.purchaseDate.timeIntervalSince1970 * 1000,
                        ]
                        if let exp = bestTx.expirationDate {
                            d["expirationDate"] = exp.timeIntervalSince1970 * 1000
                        }
                        call.resolve(d)
                    case .unverified(_, let err):
                        call.reject("VERIFICATION_FAILED", err.localizedDescription)
                    }
                case .userCancelled:
                    call.reject("USER_CANCELLED", "Purchase cancelled by user")
                case .pending:
                    call.reject("PENDING", "Purchase pending approval")
                @unknown default:
                    call.reject("UNKNOWN", "Unknown purchase result")
                }
            } catch {
                call.reject("PURCHASE_ERROR", error.localizedDescription, error)
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            do {
                try await AppStore.sync()
                var list: [[String: Any]] = []
                for await result in Transaction.currentEntitlements {
                    if case .verified(let tx) = result,
                       tx.productType == .autoRenewable,
                       let exp = tx.expirationDate,
                       exp > Date() {
                        list.append([
                            "transactionId": String(tx.id),
                            "productId": tx.productID,
                            "jwsRepresentation": result.jwsRepresentation,
                            "originalTransactionId": String(tx.originalID),
                            "purchaseDate": tx.purchaseDate.timeIntervalSince1970 * 1000,
                            "expirationDate": exp.timeIntervalSince1970 * 1000,
                        ])
                    }
                }
                call.resolve(["transactions": list])
            } catch {
                call.reject("RESTORE_ERROR", error.localizedDescription, error)
            }
        }
    }

    @objc func getActiveSubscriptions(_ call: CAPPluginCall) {
        Task {
            var list: [[String: Any]] = []
            for await result in Transaction.currentEntitlements {
                if case .verified(let tx) = result,
                   tx.productType == .autoRenewable,
                   let exp = tx.expirationDate,
                   exp > Date() {
                    list.append([
                        "transactionId": String(tx.id),
                        "productId": tx.productID,
                        "jwsRepresentation": result.jwsRepresentation,
                        "expirationDate": exp.timeIntervalSince1970 * 1000,
                    ])
                }
            }
            call.resolve(["subscriptions": list])
        }
    }
}
