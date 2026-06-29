# Photo Score

Web mẫu React + Vite để hai người thả ảnh, upload ảnh vào một Google Drive folder chung, nhận cá và mua vật phẩm. Bản hiện tại không dùng database và không dùng Supabase.

## Chạy local

```bash
npm install
npm run dev
```

Mở:

```text
http://localhost:5173
```

## Cấu hình Google Drive chung

App cần 2 giá trị, nhập trực tiếp trong giao diện:

- `Google OAuth Client ID`
- `Drive Folder ID`

Các bước:

1. Tạo một folder Google Drive chung và cấp quyền `Editor` cho tài khoản Google sẽ upload ảnh.
2. Copy folder ID từ URL. Ví dụ `https://drive.google.com/drive/folders/abc123` thì folder ID là `abc123`.
3. Vào Google Cloud Console và tạo hoặc chọn một project.
4. Bật `Google Drive API`.
5. Vào `APIs & Services` / `OAuth consent screen`, cấu hình app ở chế độ test nếu chưa publish.
6. Vào `Credentials`, tạo `OAuth client ID` loại `Web application`.
7. Thêm authorized JavaScript origin:

```text
http://localhost:5173
```

8. Copy Client ID dạng `xxxxx.apps.googleusercontent.com`.
9. Mở app, dán Client ID và Folder ID, bấm `Kết nối Drive`.

## Cách tính cá và mua vật phẩm

- Mỗi ảnh upload thành công lên Google Drive cộng cố định `5` cá.
- Mỗi người có vùng thả ảnh riêng.
- Ảnh gốc upload lên Google Drive. App chỉ giữ thumbnail nhỏ, số cá, tên người chơi và link Drive trong `localStorage`.
- Cá khả dụng = cá kiếm được từ ảnh - cá đã mua vật phẩm.
- Cửa hàng có 3 danh mục: `Thực phẩm`, `Nội thất`, `Quần áo`.
- Mua `Nội thất` sẽ đưa món đó vào kho chung của trang `Phòng`.

## Phòng trang trí

- Tab `Phòng` hiển thị một căn phòng CSS đơn giản và kho nội thất chung.
- Nội thất ai mua cũng vào kho chung.
- Mỗi lượt mua nội thất có thể đặt vào phòng một lần, do `Tôi` hoặc `Cậu iu` tự chọn người đặt.
- Nội thất được lưu bằng tọa độ tương đối nên vẫn đúng khi đổi kích thước màn hình.
- Có thể kéo thả nội thất trong phòng và gỡ khỏi phòng để đưa về kho.

## Thành tích

- `Mở màn`: có ít nhất 1 ảnh.
- `Ngày nhiều ảnh`: có ít nhất 3 ảnh trong hôm nay.
- `Bộ sưu tập 7`: có ít nhất 7 ảnh.
- `100 cá kiếm được`: đạt ít nhất 100 cá từ ảnh.
- `Chuỗi 3 ngày`: có ảnh trong 3 ngày liên tiếp.

## Giới hạn

Vì không dùng backend, số cá, lịch sử mua và bố cục phòng chỉ nằm trên trình duyệt/máy đang mở web. Nếu đổi máy, đổi trình duyệt hoặc xóa cache thì dữ liệu local sẽ không còn. Ảnh gốc vẫn nằm trong Google Drive folder chung sau khi upload thành công.

Google token chỉ nằm trong phiên trình duyệt hiện tại. Reload trang hoặc hết hạn token thì bấm `Kết nối Drive` lại.
