<<<<<<< HEAD
# ViQiTech — Website bán điện thoại, laptop & máy tính bảng

Đồ án tốt nghiệp — Website thương mại điện tử với React (frontend) + Node.js/Express (backend) + MySQL.

## Tính năng chính

### Khách hàng
- Đăng ký / đăng nhập / quên mật khẩu / đổi mật khẩu (email reset qua SMTP)
- Duyệt sản phẩm theo danh mục, brand, khoảng giá; tìm kiếm + sắp xếp
- Xem chi tiết sản phẩm với gallery, phiên bản, màu sắc, voucher đi kèm
- Quản lý giỏ hàng, thanh toán (COD / chuyển khoản / thẻ / MoMo / ZaloPay)
- Áp dụng voucher giảm giá
- Theo dõi đơn hàng, hủy đơn, đánh giá sản phẩm sau khi mua
- Chatbot AI tư vấn (Google Gemini)

### Quản trị viên
- Dashboard tổng quan + thống kê doanh thu
- CRUD sản phẩm, danh mục, thương hiệu, voucher
- Quản lý đơn hàng (đổi trạng thái), người dùng (khóa/mở khóa)
- Cấu hình chatbot (lời chào, quick replies, rules)

## Stack

| | |
|---|---|
| Frontend | React 19, Vite, React Router |
| Backend | Node.js, Express, mysql2, bcryptjs, jsonwebtoken |
| Database | MySQL 8 |
| AI | Google Gemini API (chatbot) |
| Email | Nodemailer + Gmail SMTP |

## Cấu trúc

```
.
├── backend/          # API server (Express + MySQL)
│   ├── database/schema.sql
│   ├── src/
│   ├── .env.example
│   └── package.json
├── frontend/         # React app (Vite)
│   ├── src/
│   ├── .env.example
│   └── package.json
└── README.md
```

## Cài đặt nhanh

### 1. Database
```bash
# Tạo database và seed admin
cd backend
cp .env.example .env       # rồi điền DB_PASSWORD MySQL của bạn
npm install
npm run seed
```

### 2. Backend
```bash
cd backend
npm run dev                # http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env       # mặc định trỏ localhost:4000
npm run dev                # http://localhost:5173
```

## Tài khoản mặc định

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | admin@viqitech.vn | admin123 |

## Tài liệu chi tiết

- [Backend README](backend/README.md) — API endpoints, cấu hình SMTP, Gemini, v.v.
- [Database schema](backend/database/schema.sql) — bảng + view + trigger

## License

Đồ án giáo dục — sử dụng tự do cho mục đích học tập.
=======
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
>>>>>>> fc8625954a352ad102657caac13c9d633f216ff5
