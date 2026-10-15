# EduLab Home — Project Context

## Identity

EduLab Home V5 Refined là portal tĩnh cho ChemLab, PhysicsLab, MathLab, BioLab và ITLab. Mỗi Lab là một sản phẩm và deployment độc lập; Home chỉ hiển thị metadata và liên kết đã cấu hình, không chứa source của các Lab.

## Architecture

- Entry point: `src/main.js`; đây là nơi khởi tạo CSS và từng module theo thứ tự.
- Runtime: HTML, CSS, ES modules, Vite và Three.js cho Knowledge Nexus.
- Data: `src/data/labs.js` là nguồn duy nhất cho metadata/Lab URL; `src/data/artwork.js` chứa SVG dùng lại.
- UI modules: Discovery, Explorer, Ecosystem, FAQ, Navigation, Theme, Planet Hero, Living Universe và Nexus.
- `src/three/nexus-scene.js` sở hữu WebGL scene, render loop và disposal. `src/modules/nexus.js` chỉ tải scene khi gần viewport và giữ fallback HTML hoạt động.
- Runtime assets: logo và poster Earth/Venus/Mars nằm trong `public/assets/`. Poster là fallback khi video/CDN không sẵn sàng.

## Motion lifecycle

`src/modules/motion-controller.js` là nguồn state chung. Nó dùng ba preference:

- `auto`: tôn trọng `prefers-reduced-motion`.
- `reduce`: preference accessibility rõ ràng, lưu `edulab-reduce-motion=true`.
- `allow`: motion được người dùng cho phép, lưu `edulab-reduce-motion=false`.

`initializeMotionSystem()` chỉ chạy một lần sau khi module đã gắn listener. `living-universe.js` tạm dừng motion trang trí cho section ngoài viewport; Hero và Nexus tự xử lý visibility/tab riêng. Không gắn motion engine vào button UI.

### Invariant P0

Một Windows có thể trả `prefers-reduced-motion: reduce`. V5 cũ có thể lưu `edulab-motion=running`; trạng thái này biểu thị người dùng đã chọn cho phép motion và được migrate sang `allow`. Ngược lại, `edulab-motion=paused` cũ không được âm thầm làm website tĩnh sau khi UI Play/Pause đã bị bỏ. Explicit `reduce` mới luôn được tôn trọng.

Khi sửa motion, chạy `npm run test:e2e` và kiểm tra: system reduce, legacy running/paused, explicit allow/reduce, reload, Hero switching, section visibility và Nexus lifecycle.

## Planet media

`planet-hero.js` chỉ nạp video hành tinh đang được chọn. Video muted, loop và playsinline; `syncVideo()` dừng media khi Hero/tab không visible hoặc motion không được phép. Poster cục bộ vẫn phải tồn tại. Không thay playback rate, opacity hoặc nguồn CDN nếu task không yêu cầu.

## Configuration and deployment

- Copy `.env.example` to `.env.local` để đặt `VITE_*_URL` cho các Lab.
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
