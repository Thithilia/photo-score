# Photo Score

Web mẫu React + Vite để hai người thả ảnh, upload ảnh vào một Google Drive folder chung, nhận cá và mua vật phẩm. Bản hiện tại không dùng database và không dùng Supabase.

Dữ liệu ví cá, lịch sử giao dịch cá, lịch sử mua hàng, kho nội thất và phòng trang trí được lưu trong file `photo-score-state.json` ở Google Drive folder chung. `localStorage` chỉ dùng làm cache/dữ liệu dự phòng khi chưa kết nối Drive.

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

1. Tạo một folder Google Drive chung và cấp quyền `Editor` cho cả hai tài khoản Google sẽ dùng app.
2. Copy folder ID từ URL. Ví dụ `https://drive.google.com/drive/folders/abc123` thì folder ID là `abc123`.
3. Vào Google Cloud Console và tạo hoặc chọn một project.
4. Bật `Google Drive API`.
5. Vào `APIs & Services` / `OAuth consent screen`, cấu hình app ở chế độ test nếu chưa publish.
6. Vào `Credentials`, tạo `OAuth client ID` loại `Web application`.
7. Thêm authorized JavaScript origin:

```text
http://localhost:5173
https://photo-score-olive.vercel.app
```

8. Copy Client ID dạng `xxxxx.apps.googleusercontent.com`.
9. Mở app, dán Client ID và Folder ID, bấm `Kết nối Drive`.

Khi kết nối lần đầu, app sẽ tìm file `photo-score-state.json` trong folder Drive. Nếu chưa có, app tạo file này từ dữ liệu hiện tại trên trình duyệt. Các lần sau app sẽ tải dữ liệu chung từ file này.

Nếu file Drive cũ chưa có ví cá và lịch sử giao dịch, app sẽ tự tạo dữ liệu này từ ảnh và vật phẩm đã mua hiện có trong lần tải tiếp theo.

## Cách tính cá và mua vật phẩm

- Mỗi ảnh upload thành công lên Google Drive cộng cố định `5` cá.
- Mỗi người có vùng thả ảnh riêng.
- Ảnh gốc upload lên Google Drive. App lưu thumbnail nhỏ, ví cá, lịch sử giao dịch, tên người chơi, lịch sử mua, bố cục phòng và link Drive trong `photo-score-state.json`.
- Cá khả dụng được đọc từ ví cá đã lưu, không còn tính lại trực tiếp từ số ảnh hiện có.
- Đăng ảnh tạo giao dịch `+5 cá`; mua vật phẩm tạo giao dịch trừ đúng giá món đó.
- Khi chọn/thả ảnh, app hiển thị ảnh ngay ở trạng thái `Đang tải`; ví cá chỉ cộng sau khi upload Drive thành công.
- Xóa ảnh khỏi danh sách không tự trừ cá đã nhận, vì ví cá theo lịch sử giao dịch đã phát sinh.
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

- Google token chỉ nằm trong phiên trình duyệt hiện tại. Reload trang hoặc hết hạn token thì bấm `Kết nối Drive` lại.
- Nếu chưa kết nối Drive, app vẫn chạy bằng dữ liệu local trên trình duyệt đó nhưng chưa chia sẻ sang người còn lại.
- Đồng bộ hiện dùng cơ chế đơn giản: lần lưu cuối sẽ thắng nếu hai người cùng sửa đúng một lúc. Với nhu cầu cá nhân hai người thì đủ dùng, nhưng chưa phải realtime như backend riêng.
- File `photo-score-state.json` có chứa thumbnail nhỏ dạng base64. Nếu dùng rất nhiều ảnh, file này có thể lớn dần; ảnh gốc vẫn nằm riêng trong Google Drive folder chung.
