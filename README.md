# EduLab Home

EduLab Home là cổng điều hướng trung tâm cho năm website học tập độc lập: ChemLab, PhysicsLab, MathLab, BioLab và ITLab. Ứng dụng dùng HTML5, CSS3, JavaScript ES Modules và Vite; không có backend hay framework giao diện.

## Yêu cầu

- Node.js `^20.19.0` hoặc `>=22.12.0` (đề xuất Node.js 22 LTS trở lên).
- npm đi kèm Node.js.
- Google Chrome để chạy bộ kiểm thử Playwright hiện tại.

## Cài đặt và chạy

Mở PowerShell tại thư mục dự án:

```powershell
cd D:\EduLab\EduLabHome
npm install
npm run dev
```

Vite in địa chỉ local, mặc định là `http://127.0.0.1:5173/`, và tự cập nhật trình duyệt khi mã nguồn thay đổi.

Tạo bản production và chạy thử:

```powershell
npm run build
npm run preview
```

Kiểm tra tương tác thật trên Chrome:

```powershell
npm run test:e2e
```

Bộ kiểm thử tự mở một Vite server riêng tại `http://127.0.0.1:5187/`, dùng URL giả `https://example.org/chem` cho ChemLab và một URL sai cho PhysicsLab để xác nhận cả trạng thái hợp lệ, thiếu và sai định dạng. Ảnh và video QA được sinh trong `artifacts/`, một thư mục ignored và không chứa fixture cho production.

Build được tạo trong `dist/`; preview mặc định chạy tại `http://127.0.0.1:4173/`.

## Cấu trúc

```text
EduLabHome/
├── index.html
├── public/
│   └── assets/
│       ├── edulab-logo.png
│       ├── planet-earth.webp
│       ├── planet-mars.webp
│       └── planet-venus.webp
├── docs/
│   └── PROJECT_CONTEXT.md
├── scripts/
│   ├── capture-visuals.mjs
│   ├── measure-performance.mjs
│   └── record-motion.mjs
├── src/
│   ├── main.js
│   ├── data/
│   │   ├── artwork.js
│   │   └── labs.js
│   ├── modules/
│   │   ├── animations.js
│   │   ├── discovery.js
│   │   ├── ecosystem.js
│   │   ├── explorer.js
│   │   ├── living-universe.js
│   │   ├── motion-controller.js
│   │   ├── faq.js
│   │   ├── navigation.js
│   │   ├── nexus.js
│   │   ├── planet-hero.js
│   │   └── theme.js
│   ├── three/
│   │   └── nexus-scene.js
│   ├── styles/
│   │   ├── main.css
│   │   ├── planet-hero.css
│   │   ├── responsive.css
│   │   ├── living-universe.css
│   │   └── tokens.css
│   └── utils/
│       └── helpers.js
├── .env.example
├── package.json
├── playwright.config.js
├── tests/
│   ├── home.spec.js
│   └── motion.spec.js
└── vite.config.js
```

Logo trong `public/assets/edulab-logo.png` là bản sao nguyên gốc để Vite phục vụ; tệp nguồn ban đầu trong `assets/edulab-logo.png` được giữ lại. Không dùng gradient trong CSS/SVG.

## Cấu hình liên kết Lab

Metadata, mô tả và URL của năm Lab được quản lý tập trung trong `src/data/labs.js`; artwork SVG dùng chung nằm trong `src/data/artwork.js`. Đích đến không mặc định trỏ vào các thư mục sibling trong workspace; một bản build độc lập không thể dựa vào chúng. Chỉ URL tuyệt đối dùng HTTP hoặc HTTPS mới được chấp nhận. URL bỏ trống hiển thị trạng thái **“Chưa cập nhật liên kết”**; URL sai định dạng được bỏ qua riêng cho Lab đó và ghi cảnh báo trong console, trong khi các Lab còn lại vẫn hoạt động.

Tạo `.env.local` từ `.env.example` và điền URL của các website đã triển khai:

```dotenv
VITE_CHEMLAB_URL=https://...
VITE_PHYSICSLAB_URL=https://...
VITE_MATHLAB_URL=https://...
VITE_BIOLAB_URL=
VITE_ITLAB_URL=
```

Không đưa thông tin bí mật vào biến `VITE_*`: các giá trị này được nhúng vào mã client khi build. Thẻ khám phá, Nexus, Explorer, sơ đồ hệ sinh thái và footer đều đọc từ cùng cấu hình.

## Giao diện và tùy chọn

- Dark/Light mode lưu lựa chọn trong `localStorage` với khóa `edulab-theme`.
- Hero chuyển giữa Trái Đất, Sao Kim và Sao Hỏa. Video chỉ tải khi cần; nếu video, poster hoặc ảnh hành tinh từ CDN lỗi, giao diện tự chuyển sang poster hoặc hình học CSS cục bộ mà không hiện biểu tượng ảnh hỏng.
- Knowledge Galaxy nằm trong mục Nexus, nạp Three.js khi gần khung nhìn; năm node nhỏ di chuyển trên quỹ đạo với đường nối và hạt ánh sáng. Nhãn HTML đứng yên để luôn đọc và chọn được, kể cả khi WebGL không sẵn sàng.
- Living Universe dùng SVG/CSS cho minh họa từng môn, About, Timeline, Ecosystem, FAQ và footer. `motion-controller.js` cung cấp `initializeMotionSystem()`, `pauseMotion()`, `resumeMotion()`, `toggleMotion()` và `getMotionState()` cho SVG/CSS, WebGL và video Hero. Motion tự chạy khi tải trang; trạng thái `edulab-motion=paused` cũ bị bỏ qua, còn lựa chọn `running` được chuyển sang preference mới. Tùy chọn “Giảm chuyển động trang trí” ở footer lưu bằng khóa `edulab-reduce-motion`; chế độ hệ thống được áp dụng khi người dùng chưa chọn preference riêng, đồng thời tab ẩn và section ngoài màn hình vẫn tạm dừng motion.
- Media hành tinh dùng URL từ tài liệu tham chiếu do người dùng cung cấp. Cần xác nhận quyền sử dụng và tính ổn định của CDN trước khi phát hành công khai.
- `src/data/labs.js` là nguồn dữ liệu Lab; `src/modules/` chứa các hành vi theo trách nhiệm; `src/utils/helpers.js` chứa tiện ích dùng chung.
- Các tệp style được nạp theo thứ tự design tokens, style nền tảng, responsive overrides, Hero SpaceEdu, rồi `living-universe.css`.
- Vite đưa URL Lab hợp lệ trực tiếp vào HTML build. Vì vậy nội dung và liên kết cốt lõi vẫn dùng được khi JavaScript bị tắt; JavaScript chỉ nâng cấp chúng thành Explorer, Nexus và trạng thái tương tác đầy đủ.

## Triển khai Cloudflare Pages

Cloudflare Pages build trực tiếp từ source: đặt **Build command** là `npm run build` và **Build output directory** là `dist`. Không cần commit `dist/` hoặc `node_modules/`. Cấu hình các `VITE_*_URL` và `VITE_BASE_PATH` trong môi trường build của Pages; chúng là dữ liệu public được nhúng vào bundle. Mặc định, Vite tạo đường dẫn phù hợp tại root domain. Nếu host dưới subpath, đặt `VITE_BASE_PATH` (ví dụ `/edulab/`), với dấu `/` ở đầu và cuối.

## Khắc phục sự cố

- Nếu lệnh báo không tìm thấy `package.json`, hãy chuyển vào `D:\EduLab\EduLabHome` trước khi chạy npm.
- Nếu thay đổi `.env.local`, khởi động lại dev server; khi build production, tạo lại `dist/`.
- Nếu Lab không có URL hoặc URL sai giao thức, kiểm tra các biến tương ứng trong `.env.local`; chỉ HTTP/HTTPS được chấp nhận.
- Nếu font ngoài không tải được, trang vẫn dùng font dự phòng của hệ thống.

## QA và motion regression

`tests/motion.spec.js` lấy giá trị transform/SVG tại 0, 2 và 5 giây sau entrance, kiểm tra desktop/mobile, auto-start, preference giảm motion, focus và frame WebGL. Hero được quan sát liên tục 10 giây không cần nút Play. Bộ regression còn kiểm tra 12 chiều rộng từ 320 đến 2560px, CDN failure, JavaScript disabled và WebGL context loss.

Chạy Vite tại port 5188 để tạo ảnh và video:

```powershell
npm run dev -- --port 5188
# Trong terminal khác:
$env:QA_URL = 'http://127.0.0.1:5188'
node scripts/capture-visuals.mjs
npx playwright install ffmpeg
node scripts/record-motion.mjs
```

Tất cả output từ các lệnh này là generated QA artifact và bị ignore. Không dùng chúng làm baseline trong Git; kiến trúc và các invariant quan trọng được ghi trong `docs/PROJECT_CONTEXT.md`.

Đo hiệu năng trên production preview: build, chạy preview tại port 4188, đặt `QA_URL` tương ứng rồi chạy `node scripts/measure-performance.mjs`. Kết quả là đo cục bộ trên Chrome, không thay thế INP thực địa hoặc kiểm thử điện thoại thật.
