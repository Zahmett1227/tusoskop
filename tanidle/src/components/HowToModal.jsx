import { Overlay } from "./StatsModal.jsx";

export default function HowToModal({ onClose }) {
  return (
    <Overlay onClose={onClose}>
      <h2 className="mb-3 text-lg font-extrabold text-slate-800">Nasıl Oynanır?</h2>
      <ul className="space-y-3 text-[15px] leading-relaxed text-slate-700">
        <li className="flex gap-3">
          <span className="text-xl">🩺</span>
          <span>Her gün bir <strong>klinik vaka</strong>. İlk ipucu açık başlar.</span>
        </li>
        <li className="flex gap-3">
          <span className="text-xl">⌨️</span>
          <span>
            <strong>Tanıyı yaz</strong> — yazdıkça öneriler çıkar (örn. "ap" →
            <em> Akut apandisit</em>). Öneriye dokun ya da Enter'a bas.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-xl">🔓</span>
          <span>
            Her <strong>yanlış tahmin</strong> yeni bir ipucu açar. İpucu sayısı
            kadar (+1) hakkın var.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-xl">🏆</span>
          <span>Ne kadar <strong>az ipucuyla</strong> bulursan o kadar iyi. Serini koru!</span>
        </li>
      </ul>
      <p className="mt-4 rounded-xl bg-brand-50 p-3 text-sm text-brand-700">
        Vakalar gerçek TUS soru bankasından (Tusoskop) gelir — klinik muhakemeni
        günde bir vakayla keskin tut.
      </p>
    </Overlay>
  );
}
