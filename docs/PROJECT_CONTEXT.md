# EduLab Home — Project Context

## Identity

EduLab Home V5 Refined là portal tĩnh cho năm phòng Lab môn học — ChemLab, PhysicsLab, MathLab, BioLab, ITLab — và nền tảng kiểm tra trực tuyến **Exa**. Mỗi sản phẩm là một deployment độc lập; Home chỉ hiển thị metadata và liên kết đã cấu hình, không chứa source của chúng.

Exa **không phải Lab thứ sáu**: không nằm trong `LABS`, hay Knowledge Galaxy; số phòng Lab luôn là năm.

## Architecture

- Entry point: `src/main.js`; đây là nơi khởi tạo CSS và từng module theo thứ tự.
- Runtime: HTML, CSS, ES modules, Vite và Three.js cho Knowledge Nexus.
- Data: `src/data/labs.js` là nguồn duy nhất cho metadata/Lab URL; `src/data/artwork.js` chứa SVG dùng lại.
- UI modules: Discovery, FAQ, Interactions (ánh sáng theo con trỏ trên thẻ Lab), Navigation, Theme, Planet Hero, Living Universe và Nexus.
- `src/three/nexus-scene.js` sở hữu WebGL scene, render loop và disposal. `src/modules/nexus.js` chỉ tải scene khi gần viewport và giữ fallback HTML hoạt động.
- Runtime assets: logo và poster Earth/Venus/Mars nằm trong `public/assets/` và được tham chiếu bằng `/assets/...`. Poster là fallback khi video/CDN không sẵn sàng.
- Exa là một panel riêng: phần copy, visual 2.5D, bốn năng lực (luyện tập, làm bài kiểm tra, đánh giá năng lực, theo dõi tiến trình) và dải “5 phòng Lab → Exa”. Không thêm tính năng nào chưa được xác nhận.
- Thứ tự section: Hero `#top` → `#kham-pha-lab` → `#nexus` → `#exa` → `#faq` → footer. Bốn section `#bo-kham-pha` (Lab Explorer), `#ve-edulab` (Philosophy), `#cach-hoat-dong` (Timeline) và `#he-sinh-thai` (sơ đồ Hệ sinh thái) đã bị chủ dự án xóa hẳn vào 2026-11; không thêm lại, kể cả dưới dạng thu nhỏ hay animation. CTA cuối “Hành trình khám phá bắt đầu từ đây” đã bị bỏ có chủ đích; không thêm lại.
- `discovery.js` render thẻ Lab, danh sách sản phẩm ở footer (5 Lab + Exa) và nút “Vào Exa”. `index.html` chứa sẵn `<span data-lab-url="VITE_*_URL">`; plugin `staticLabLinks` trong `vite.config.js` biến năm Lab thành link tĩnh khi build, dùng URL cấu hình hợp lệ hoặc cùng fallback đã có trong `labs.js`, để điều hướng Lab vẫn hoạt động khi tắt JavaScript. Cơ chế URL Exa không đổi.
- Script inline trong `<head>` đặt `data-theme`, `data-motion` và class `anim` trước lần paint đầu tiên (tránh nháy giao diện). Logic preference của nó phải luôn khớp với `readPreference()` trong `motion-controller.js`.

## Typography

- Hero (EARTH/VENUS/MARS), và wordmark “Exa” dùng Prata — điểm nhấn display.
- `.section-title` dùng Be Vietnam Pro 600 (font thiết kế cho dấu tiếng Việt) với line-height 1.14 để dấu chồng như “ể”, “ộ” không bị cắt.
- Nhãn kỹ thuật/eyebrow dùng Space Grotesk; nội dung dùng Be Vietnam Pro. Không tải thêm font ngoài bốn họ trong `index.html`.

## Knowledge Galaxy

`nexus-scene.js` vẽ năm quỹ đạo đồng tâm (`RADII`) trên một mặt phẳng nghiêng thật trong 3D (`TILT`), kèm vòng biên có vạch chia, vòng trong dạng nét đứt, lớp bụi và lõi ba lớp (ring, vạch, nét đứt) bao quanh huy hiệu HTML.

- Node: cầu, halo, vòng ngoài, glow phẳng, vệt quỹ đạo phía sau và nhãn sprite có cỡ cố định theo pixel (ẩn khi canvas hẹp hơn 520px, vì hàng nút `.galaxy-controls` đã đảm nhiệm).
- Chuyển động: các node quay chung một tốc độ (`SPIN`) cộng thêm dao động nhỏ có giới hạn, nên năm Lab luôn cách đều nhau và không bao giờ chồng lên nhau.
- Màu lấy từ `PALETTES`; `MutationObserver` trên `data-theme` vẽ lại màu và nhãn khi đổi theme.
- Kích thước và tâm: camera là **orthographic**, nên mọi quỹ đạo nghiêng luôn đồng tâm với lõi (camera phối cảnh sẽ kéo tâm các ellipse xuống dưới logo). `resize()` chọn tỷ lệ pixel/đơn vị để hệ vừa vùng phía trên `.galaxy-controls`, đặt tâm hệ vào giữa vùng đó và ghi `--nexus-core-y` cùng `--nexus-core-size` cho huy hiệu HTML. Parallax theo chuột chỉ xoay mặt phẳng quanh tâm; zoom khi chọn Lab thì scale group `world` quanh tâm, nên tâm không bao giờ bị dịch. Muốn đổi kích thước thì chỉnh chiều cao `.nexus-viewport`, không scale bằng CSS.
- `.nexus-canvas` phải có `width: 100%; height: 100%`. `renderer.setSize(..., false)` không đặt cỡ CSS; nếu thiếu, ở DPR > 1 (ví dụ Windows scaling 125%/150%) canvas hiển thị theo kích thước nội tại (khung × DPR), và hình WebGL lệch khỏi huy hiệu HTML khoảng 100–200px. Test "share one rendered centre" đo tâm từ pixel thật (viền huy hiệu, vòng lõi WebGL, quỹ đạo ITLab) ở DPR 1 và 1.25, với sai lệch tối đa 3px.
- Huy hiệu tâm hiển thị **logo EduLab chính thức đầy đủ**, không cắt (quyết định của chủ dự án). Cỡ huy hiệu bằng `1.24 ×` đơn vị quỹ đạo, khoảng 108px ở 1440×900; các vòng lõi WebGL (0.69 / 0.76–0.82 / 0.93) bao quanh nó. Test E2E khóa cỡ này trong khoảng 98–120px để phát hiện Galaxy bị co lại hoặc tràn khung.

## Motion lifecycle

`src/modules/motion-controller.js` là nguồn state chung. Nó dùng ba preference:

- `auto`: tôn trọng `prefers-reduced-motion`.
- `reduce`: preference accessibility rõ ràng, lưu `edulab-reduce-motion=true`.
- `allow`: motion được người dùng cho phép, lưu `edulab-reduce-motion=false`.

`initializeMotionSystem()` chỉ chạy một lần sau khi module đã gắn listener. `living-universe.js` tạm dừng motion trang trí cho section ngoài viewport; Hero và Nexus tự xử lý visibility/tab riêng. Không gắn motion engine vào button UI.

Cách thêm motion trang trí mới (ví dụ Exa): đặt nó trong một `main > section` và gắn class `.ambient`. CSS giữ `.ambient` ở trạng thái paused, chỉ chạy dưới `.motion-running`, class mà `living-universe.js` bật khi section nằm trong viewport, tab hiển thị và `canAnimate` đúng. Không tạo vòng `requestAnimationFrame` hay preference riêng. Dùng `animation-delay` âm để chọn frame tĩnh có ý nghĩa khi motion bị giảm.

### Lịch sử P0

UI Play/Pause cũ từng lưu `edulab-motion`. Khi bỏ nút này, có một phiên bản đã coi `prefers-reduced-motion: reduce` của Windows là lệnh dừng tuyệt đối và bỏ qua `running` mà người dùng đã chọn, khiến homepage đứng yên. Bản sửa là mô hình `auto`/`reduce`/`allow` dưới đây.

### Invariant P0

Một Windows có thể trả `prefers-reduced-motion: reduce`. V5 cũ có thể lưu `edulab-motion=running`; trạng thái này biểu thị người dùng đã chọn cho phép motion và được migrate sang `allow`. Ngược lại, `edulab-motion=paused` cũ không được âm thầm làm website tĩnh sau khi UI Play/Pause đã bị bỏ. Explicit `reduce` mới luôn được tôn trọng.

Khi sửa motion, chạy `npm run test:e2e` và kiểm tra: system reduce, legacy running/paused, explicit allow/reduce, reload, Hero switching, section visibility và Nexus lifecycle.

## Data (kiểm toán 2026-11-16)

Cơ sở cho câu trả lời về dữ liệu trong mục Thông tin. Kiểm tra trên source và trên HTML production:

- `localStorage`: `edulab-theme` (sáng/tối) và `edulab-reduce-motion` (giảm chuyển động); `edulab-motion` là khóa cũ chỉ được đọc để migrate. Không dùng `sessionStorage`, cookie hay IndexedDB.
- Không có biểu mẫu, tài khoản, `fetch`/XHR/beacon, analytics hay script bên thứ ba trong source; HTML production không có beacon được chèn thêm.
- Yêu cầu tới bên thứ ba khi tải trang: Cloudflare Pages (hosting), Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), CloudFront (`d8j0ntlcm91z4.cloudfront.net`, ảnh và video hành tinh). Liên kết ra ngoài: năm Lab, Exa, `mailto:` và Facebook.
- Test `information and policies state the confirmed facts…` khóa đúng hai khóa `localStorage` này và việc không có cookie.

## Motion bổ sung (premium.css)

Tất cả chỉ dùng transform/opacity và tắt dưới `[data-motion="off"]`: vệt sáng chạy dọc mép trên mỗi section (chỉ chạy khi section có `.motion-running`), ánh sáng theo con trỏ trên thẻ Lab (`interactions.js`, một listener ủy quyền), sheen trên nút chính, dấu cộng gập thành dấu trừ ở accordion, và Hero lùi dần khi cuộn bằng `animation-timeline: scroll()` (chỉ ở trình duyệt hỗ trợ; nơi khác Hero đứng yên như cũ). Không thêm thư viện animation.

## Evolution layer V6 (evolution.css, 2026-11)

Lớp nâng cấp nằm sau `premium.css`, chỉ dùng transform/opacity hoặc các thuộc tính độc lập `translate`/`rotate`/`scale` để không xung đột với `transform` của scroll reveal (`.motion-item`). Tất cả tắt dưới `[data-motion="off"]`; không thêm gradient hay thư viện.

- `hero-particles.js`: một canvas 2D (không phải WebGL thứ hai) sau `.planet-shade`, `pointer-events: none`, chỉ dành cho màn hình ≥ 768px có chuột/trackpad (`hover: hover` và `pointer: fine`). Hạt trôi quanh điểm gốc, tránh con trỏ có quán tính, nối đường mảnh khi gần nhau; click vào vùng trời trống (không phải link/button) tạo burst. Canvas chỉ được tạo khi trang đã `load` và rảnh (`requestIdleCallback`), vì riêng việc khởi tạo context 2D đã tạo long task lúc khởi động. Một vòng rAF, chỉ chạy khi Hero trong viewport, tab hiển thị và `canAnimate`; giảm motion thì giữ một frame tĩnh. Đường nối và điểm được gom theo mức opacity để mỗi frame chỉ có vài lệnh vẽ. Điện thoại/màn hình cảm ứng không tạo canvas (đo với CPU chậm 4×: +~340ms long task mà không có hover để tương tác); Hero ở đó giữ nguyên video hành tinh và mọi điều khiển.
- `click-feedback.js`: một listener `pointerdown` ủy quyền, hiệu ứng theo ngữ cảnh (ripple cho CTA/nút chính, vòng quỹ đạo cho hành tinh, xung viền cho thẻ Lab, xoay icon theme, lò xo icon FAQ, nhấn nhẹ cho link). Không `preventDefault`, không chờ animation; phần tử hiệu ứng tự xóa.
- `interactions.js`: ngoài ánh sáng theo con trỏ còn tính tilt ≤ 4° thành một trục-góc ghi vào `--tilt` cho thuộc tính `rotate`; reset khi rời thẻ. Chỉ chuột và khi motion bật; bàn phím có lift tương đương qua `:focus-within`.
- Scroll storytelling thuần CSS (`animation-timeline: view()`, trong `@supports`, chỉ từ 768px trở lên): artwork thẻ Lab và Exa trôi theo chiều sâu, emblem xoay, tiêu đề section sáng dần từ `--text-muted` lên `--text-primary`. Không animation nào đưa opacity về 0, nên cuộn nhanh không làm mất nội dung; trình duyệt không hỗ trợ giữ trạng thái tĩnh.
- Bài học hiệu năng: đừng đọc `scrollHeight`/layout trong lúc khởi tạo module. Một lần đồng bộ thanh tiến trình lúc khởi động (kể cả trong rAF) đã làm long task khởi động trên mobile tăng ~4 lần; `navigation.js` vì vậy giữ nguyên bản cũ.
- Thông tin & Chính sách: accordion dạng thẻ có số thứ tự (CSS counter), thanh nhấn trái khi mở. Footer: tiêu đề cột có vạch nhấn, đường sáng mảnh ở mép trên. Nội dung chính sách không đổi.

### Ghi chú test con lắc (đã đóng)

Test “ambient artwork visibly changes…” từng thất bại ngẫu nhiên ở PhysicsLab. Đo trên baseline: animation luôn `running` và `currentTime` tăng đúng, nhưng con lắc dao động tuần hoàn (alternate 3.2s) nên hai mẫu đơn lẻ ở ~2.1s/~5.2s có thể nằm đối xứng quanh điểm quay đầu và cho cùng góc (3/12 lần dưới ngưỡng). Đây là lỗi lấy mẫu của test, không phải lỗi animation; test nay lấy mẫu mỗi 250ms trong từng cửa sổ 0–2s và 2–5s với cùng ngưỡng.

## Planet media

`planet-hero.js` chỉ nạp video hành tinh đang được chọn. Video muted, loop và playsinline; `syncVideo()` dừng media khi Hero/tab không visible hoặc motion không được phép. Poster cục bộ vẫn phải tồn tại. Không thay playback rate, opacity hoặc nguồn CDN nếu task không yêu cầu.

## Configuration and deployment

- Copy `.env.example` to `.env.local` để đặt `VITE_*_URL` cho các Lab và `VITE_EXA_URL` cho Exa. Không tự đặt domain cho Exa; khi trống, giao diện hiển thị “Chưa cập nhật liên kết”.
- Liên hệ chính thức (email và Facebook của chủ dự án) nằm tĩnh trong `index.html`, ở mục Thông tin và footer. Không thêm số điện thoại, trang chính sách hay kênh khác khi chưa có dữ liệu thật.
- Chỉ HTTP/HTTPS là URL hợp lệ. Các biến `VITE_*` là public khi build.
- Cloudflare Pages build từ source với `npm run build` và publish `dist`.
- `VITE_BASE_PATH` chỉ dùng khi deploy dưới subpath.

## Quality gates

```powershell
npm run build
npm run test:e2e
```

`artifacts/`, `dist/`, test reports và cache là output local ignored; không dùng làm fixture hoặc source of truth.

## Known limits

- Hero video còn phụ thuộc CDN; poster cục bộ là fallback.
- Three.js bundle vượt ngưỡng cảnh báo 500 kB của Vite.
- Bộ test mặc định dùng Chrome. Firefox và WebKit (Playwright trên Windows, không phải Safari thật) đã được chạy thủ công cho V6 bằng config tạm; thiết bị vật lý chưa được kiểm thử.
