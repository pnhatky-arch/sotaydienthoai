# Sổ tay điện thoại TP.HCM

Ứng dụng web tối ưu cho iPhone/iPad, tra cứu danh bạ điện thoại Thường trực Đảng ủy 168 xã, phường và Đặc khu Côn Đảo của Thành phố Hồ Chí Minh (ngày 08/07/2025).

## Chạy ứng dụng

```bash
npm start
```

Mở `http://127.0.0.1:4180`. Máy chủ chỉ lắng nghe trên thiết bị hiện tại để bảo vệ danh bạ nội bộ. Dữ liệu được trích xuất từ bảng trong PDF bằng `scripts/extract_phonebook.py` và lưu tại `data/phonebook.json`.

## Đóng gói Cloudflare Pages

```bash
npm run build:cloudflare
```

Thư mục `dist/cloudflare` là bản tĩnh sẵn sàng cho Cloudflare Pages Direct Upload. Vì danh bạ là tài liệu nội bộ, cần bật Cloudflare Zero Trust Access sau khi triển khai.
