# EduLab Home — Project Context

## Identity

EduLab Home V5 Refined là portal tĩnh cho năm phòng Lab môn học — ChemLab, PhysicsLab, MathLab, BioLab, ITLab — và nền tảng kiểm tra trực tuyến **Exa**. Mỗi sản phẩm là một deployment độc lập; Home chỉ hiển thị metadata và liên kết đã cấu hình, không chứa source của chúng.

Exa **không phải Lab thứ sáu**: không nằm trong `LABS`, Knowledge Galaxy hay sơ đồ Hệ sinh thái; số phòng Lab luôn là năm.

## Architecture

- Entry point: `src/main.js`; đây là nơi khởi tạo CSS và từng module theo thứ tự.
- Runtime: HTML, CSS, ES modules, Vite và Three.js cho Knowledge Nexus.
- Data: `src/data/labs.js` là nguồn duy nhất cho metadata/Lab URL; `src/data/artwork.js` chứa SVG dùng lại.
- UI modules: Discovery, Explorer, Ecosystem, FAQ, Navigation, Theme, Planet Hero, Living Universe và Nexus.
- `src/three/nexus-scene.js` sở hữu WebGL scene, render loop và disposal. `src/modules/nexus.js` chỉ tải scene khi gần viewport và giữ fallback HTML hoạt động.
- Runtime assets: logo và poster Earth/Venus/Mars nằm trong `public/assets/` và được tham chiếu bằng `/assets/...`. Poster là fallback khi video/CDN không sẵn sàng.
- Exa là một panel riêng: phần copy, visual 2.5D, bốn năng lực (luyện tập, làm bài kiểm tra, đánh giá năng lực, theo dõi tiến trình) và dải “5 phòng Lab → Exa”. Không thêm tính năng nào chưa được xác nhận.
- Thứ tự section: Hero `#top` → `#kham-pha-lab` → `#nexus` → `#bo-kham-pha` → `#exa` → `#ve-edulab` → `#cach-hoat-dong` → `#he-sinh-thai` → `#faq` → footer. CTA cuối “Hành trình khám phá bắt đầu từ đây” đã bị bỏ có chủ đích; không thêm lại.
- `discovery.js` render thẻ Lab, danh sách sản phẩm ở footer (5 Lab + Exa), nút “Vào Exa” và mục Liên hệ tùy chọn. `index.html` chứa sẵn `<span data-lab-url="VITE_*_URL">`; plugin `staticLabLinks` trong `vite.config.js` biến chúng thành link khi build để nội dung vẫn dùng được khi tắt JavaScript.
- Script inline trong `<head>` đặt `data-theme`, `data-motion` và class `anim` trước lần paint đầu tiên (tránh nháy giao diện). Logic preference của nó phải luôn khớp với `readPreference()` trong `motion-controller.js`.

## Typography

- Hero (EARTH/VENUS/MARS), số thứ tự About/Timeline và wordmark “Exa” dùng Prata — điểm nhấn display.
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

## Planet media

`planet-hero.js` chỉ nạp video hành tinh đang được chọn. Video muted, loop và playsinline; `syncVideo()` dừng media khi Hero/tab không visible hoặc motion không được phép. Poster cục bộ vẫn phải tồn tại. Không thay playback rate, opacity hoặc nguồn CDN nếu task không yêu cầu.

## Configuration and deployment

- Copy `.env.example` to `.env.local` để đặt `VITE_*_URL` cho các Lab và `VITE_EXA_URL` cho Exa. Không tự đặt domain cho Exa; khi trống, giao diện hiển thị “Chưa cập nhật liên kết”.
- `VITE_CONTACT_EMAIL` (tùy chọn) bật mục “Liên hệ” trong footer. Footer không có trang chính sách, số điện thoại hay mạng xã hội cho tới khi có dữ liệu thật.
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
- Browser regression hiện dùng Chrome; Firefox, WebKit và thiết bị vật lý chưa nằm trong suite.
