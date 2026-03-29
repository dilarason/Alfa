Cloudflare Pages deploy notlari

Klasor:
`/home/ted/alfa-scene3-cloudflare-publish`

Bu klasor:
- symlink icermez
- `index.html` ve `work/index.html` ile dogrudan yayinlanabilir
- mevcut `scene3` deneyimi icin gereken temel assetleri fiziksel dosya olarak icerir

Cloudflare Pages ayarlari:
- Framework preset: `None`
- Build command: bos birak
- Build output directory: `/`

Dashboard adimlari:
1. Cloudflare Pages icinde `Create project` ac.
2. Git baglayacaksan bu klasoru repo icine koyup push et.
3. Direct Upload kullanacaksan bu klasorun icini yukle.
4. Deploy tamamlaninca `Custom domains` bolumunden alan adini bagla.

Alan adi notu:
- `www` gibi subdomain baglamak daha kolaydir.
- Apex domain kullanacaksan DNS yonetimini Cloudflare'a alman gerekebilir.

Lokal kontrol:
- Klasoru test etmek icin:
  `python3 -m http.server 4181 --directory /home/ted/alfa-scene3-cloudflare-publish`
- Sonra:
  `http://127.0.0.1:4181/`
  `http://127.0.0.1:4181/work/`

Bu kopyada dogrulanan temel dosyalar:
- `/`
- `/work/`
- `/scene3-assets/js/app.scene3.9.js`
- `/assets/cms/projects-dev.json`
- `/assets/media/alfa-cards/04-david-guetta-yenikapi.mp4`
