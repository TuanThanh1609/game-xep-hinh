# 🧋 Maycha Speed Jigsaw — Setup Guide

## 📁 Cấu trúc thư mục

```
Game xếp hình tốc độ/
├── index.html              ← Game chính (HTML/CSS/JS, chạy độc lập)
├── start.html              ← Reference: màn hình bắt đầu (tham khảo)
├── ingame.html             ← Reference: màn hình chơi (tham khảo)
├── result.html             ← Reference: màn hình kết quả (tham khảo)
├── DESIGN.md               ← Design System Document
├── nocodb/
│   └── schema.json         ← Schema để import vào NocoDB
├── webhook/
│   ├── server.js           ← Messenger Webhook (Node.js)
│   ├── package.json
│   └── .env.example
└── README.md               ← (file này)
```

---

## 🚀 Cách deploy nhanh

### Cách 1: Không cần webhook (đơn giản nhất)

Game hoạt động **hoàn toàn standalone** — chỉ cần upload `index.html` lên:
- **Netlify** (kéo thả) → https://app.netlify.com/drop
- **Vercel** → https://vercel.com/new
- **GitHub Pages** → tạo repo, enable Pages
- **Render** → tạo Static Site

> ⚠️ Nếu không có webhook, kết quả game vẫn hiển thị đầy đủ nhưng **không gửi về Messenger**.

---

### Cách 2: Deploy webhook (để gửi kết quả về Messenger)

```bash
# 1. Clone repo hoặc copy thư mục webhook/
cd webhook

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env từ .env.example
cp .env.example .env

# 4. Sửa .env với thông tin thực tế
# FB_PAGE_TOKEN, NOCODB_TOKEN, GAME_BASE_URL...

# 5. Deploy lên Railway / Render / VPS
npm start
```

---

## 🗄️ NocoDB Setup

### Bước 1: Tạo database NocoDB
1. Đăng ký tại https://nocodb.com (hoặc self-host)
2. Tạo Workspace mới → tạo Database tên: `maycha_speed_jigsaw`

### Bước 2: Import schema
1. Trong database mới → **Settings → Import JSON**
2. Paste nội dung file `nocodb/schema.json`
3. Hoặc tạo 3 bảng thủ công theo schema:

**Bảng `jigsaw_leads`:**
| Column | Type | Required |
|--------|------|----------|
| phone | varchar(15) | ✅ |
| fb_psid | varchar(100) | |
| source | enum(MESSENGER/WEB/DIRECT) | |
| campaign | varchar(255) | |
| played_at | datetime | |
| completed | boolean | |
| created_at | datetime (default: now) | |

**Bảng `jigsaw_results`:**
| Column | Type | Required |
|--------|------|----------|
| phone | varchar(15) | ✅ |
| fb_psid | varchar(100) | |
| time_seconds | int | |
| completed | boolean | |
| prize | varchar(255) | |
| prize_code | varchar(50) | |
| prize_value | int | |
| won_at | datetime | |
| campaign | varchar(255) | |
| redeeemed | boolean | |

**Bảng `jigsaw_vouchers`:**
| Column | Type |
|--------|------|
| code | varchar(50) ✅ |
| prize | varchar(255) |
| prize_value | int |
| phone | varchar(15) |
| issued_at | datetime |
| expires_at | datetime |
| redeeemed | boolean |

### Bước 3: Tạo API Token
1. Settings → API Tokens → Create Token
2. Copy token vào `NOCODB_TOKEN` trong `.env`
3. Copy table IDs vào `NOCODB_LEADS_TABLE`, `NOCODB_RESULTS_TABLE`, `NOCODB_VOUCHERS_TABLE`

### Bước 4: Tạo voucher (mẫu)
Thêm voucher vào bảng `jigsaw_vouchers`:

```sql
INSERT INTO jigsaw_vouchers (code, prize, prize_value, expires_at, campaign)
VALUES
  ('MCJIG00001', 'Voucher 10K',  10000,  '2025-06-30', 'Festival 30/4 - 1/5'),
  ('MCJIG00002', 'Voucher 10K',  10000,  '2025-06-30', 'Festival 30/4 - 1/5'),
  ('MCJIG00003', 'Voucher 20K',  20000,  '2025-06-30', 'Festival 30/4 - 1/5'),
  ('MCJIG00004', 'Voucher 20K',  20000,  '2025-06-30', 'Festival 30/4 - 1/5'),
  ('MCJIG00005', 'Voucher 30K',  30000,  '2025-06-30', 'Festival 30/4 - 1/5'),
  ('MCJIG00006', 'Voucher 50K',  50000,  '2025-06-30', 'Festival 30/4 - 1/5'),
  ('MCJIG00007', 'Voucher 100K', 100000, '2025-06-30', 'Festival 30/4 - 1/5');
```

---

## 📱 Facebook Messenger Setup

### Bước 1: Tạo Facebook App
1. https://developers.facebook.com → Create App → Business
2. Thêm sản phẩm **Messenger**

### Bước 2: Setup Webhook
1. Trong Messenger Settings → Webhooks → **Add Callback URL**
2. URL: `https://your-webhook-domain.com/webhook`
3. Verify Token: điền giống `FB_VERIFY_TOKEN` trong `.env`
4. Subscribe events: `messages`, `messaging_postbacks`

### Bước 3: Lấy Page Access Token
1. Messenger Settings → Token Generation
2. Chọn Page → Copy token vào `FB_PAGE_TOKEN`

### Bước 4: Setup Messenger Extensions (cho WebView)
Trong Facebook App Settings:
1. Products → Messenger → Settings
2. Allowed Domains: thêm domain deploy game (VD: `maycha-jigsaw.netlify.app`)
3. Enable " Messenger Extensions SDK"

---

## 🎮 Game Logic

### Gameplay
1. Người chơi nhập SĐT → bắt đầu chơi
2. 3-2-1 countdown → 60 giây bắt đầu
3. **Chọn mảnh ghép** từ khay bên dưới
4. **Click vào ô đúng** trên lưới 6×6 để đặt mảnh
5. Hoàn thành đủ 36 mảnh → thắng

### Prize Logic
```javascript
// Probability distribution (có thể điều chỉnh)
Voucher 10K  → 35%
Voucher 20K  → 30%
Voucher 30K  → 20%
Voucher 50K  → 10%
Voucher 100K → 5%
```

### Flow hoàn chỉnh
```
Messenger Bot → Gửi link game → User mở WebView
    → Nhập SĐT (lưu vào NocoDB leads)
    → Chơi game → Kết quả gửi về NocoDB results
    → Webhook gửi kết quả về Messenger
```

---

## 🎨 Design System

Game sử dụng **"Festive Effervescence"** design language:

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#b71029` | Buttons, timer, accents |
| `--color-secondary` | `#795500` | Labels, secondary text |
| `--color-tertiary-fixed` | `#ff973e` | Progress bar, hints |
| `--color-surface` | `#fcf6ed` | Background (creamy canvas) |
| `--color-surface-container-highest` | `#e2dcd1` | Interactive pieces |

> Không dùng borders để phân cách — dùng **tonal shifts** (thay đổi màu nền)

---

## 🔧 Customization

### Đổi hình ảnh puzzle
```javascript
// Trong index.html, thay đổi dòng:
const GAME_IMAGE = 'YOUR_IMAGE_URL_HERE';
```

### Đổi thời gian chơi
```javascript
const GAME_TIME = 60; // seconds
```

### Đổi prize pool
```javascript
const PRIZE_TIERS = [
  { label: 'Voucher 10K',  value: 10000,  probability: 0.35 },
  // ... điều chỉnh các tier khác
];
```

### Đổi màu theme
Cập nhật CSS variables trong `:root` của `index.html`

---

## 📋 Checklist trước khi live

- [ ] `index.html` deploy lên HTTPS (Messenger yêu cầu HTTPS)
- [ ] Webhook server chạy và verify token thành công
- [ ] NocoDB tables tạo đủ, API token có quyền ghi
- [ ] Facebook App: Page Access Token còn hiệu lực
- [ ] Messenger WebView domain whitelist đúng
- [ ] Voucher codes đã được tạo trong NocoDB
- [ ] Test flow: Messenger → Lead → Game → Result → Messenger message
