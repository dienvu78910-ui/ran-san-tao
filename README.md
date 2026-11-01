# Rắn Săn Táo – Hướng dẫn triển khai GitHub → Vercel → Firebase

Game Snake có bảng xếp hạng Top 5 lưu trên Firebase Firestore. Cấu trúc project:

```
index.html   style.css   script.js   firebase-config.js   README.md
```

## Bước 0. Chạy thử trên máy
1. Cài VS Code, cài extension **Live Server**.
2. Mở thư mục project, chuột phải `index.html` → **Open with Live Server**.
3. Chưa nối Firebase thì game vẫn chạy, điểm lưu tạm trong trình duyệt. (Không mở bằng cách bấm đúp file, vì `type="module"` cần chạy qua http.)

## Bước 1. Đưa code lên GitHub
1. Vào github.com, đăng nhập, bấm **New repository**.
2. Đặt tên `ran-san-tao`, chọn **Public**, bấm **Create repository**.
3. Bấm **uploading an existing file** (hoặc **Add file → Upload files**).
4. Kéo cả 5 file vào. Không upload `node_modules` và file `.env`.
5. Ghi commit message `Phiên bản đầu tiên`, bấm **Commit changes**.
6. Kiểm tra repository đã hiện đủ file.

## Bước 2. Deploy bằng Vercel
1. Vào vercel.com, chọn **Continue with GitHub**.
2. Dashboard → **Add New… → Project**.
3. Cấp quyền cho Vercel đọc repository, rồi bấm **Import** ở `ran-san-tao`.
4. Cấu hình: Framework Preset = **Other**; Build Command và Output Directory để trống.
5. Bấm **Deploy**, đợi vài chục giây sẽ nhận link dạng `https://ran-san-tao.vercel.app`.
6. Mở link: game chạy, bảng xếp hạng báo "Chưa nối Firebase".

## Bước 3. Tạo Firebase project và Firestore
1. Vào console.firebase.google.com → **Create a Firebase project**.
2. Đặt tên `ran-san-tao`, bấm **Continue**, có thể tắt Google Analytics, bấm **Create project**.
3. Menu trái **Build → Firestore Database → Create database**.
4. Chọn **Standard edition**, Location `asia-southeast1` (Singapore) – không đổi được sau này, bấm **Next**.
5. Chọn **Start in test mode** → **Create**.

## Bước 4. Lấy cấu hình SDK
1. Trang **Project Overview**, bấm biểu tượng web **`</>`**.
2. App nickname: `snake-web`. **Không** tick Firebase Hosting (đã có Vercel). Bấm **Register app**.
3. Ở mục **Add Firebase SDK**, chọn **Use npm**/CDN đều được, chỉ cần copy khối `const firebaseConfig = { ... }`.
4. Mở `firebase-config.js`, dán các giá trị vào `apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`.
5. Lưu ý: `apiKey` của Firebase web không phải mật khẩu bí mật; an toàn nằm ở Security Rules (Bước 6).

## Bước 5. Cập nhật lại GitHub
1. Vào repository → bấm file `firebase-config.js` → biểu tượng bút chì (**Edit**), dán nội dung mới, hoặc dùng **Add file → Upload files** để ghi đè.
2. Bấm **Commit changes**.
3. Vercel tự phát hiện commit và build lại. Vào tab **Deployments** chờ trạng thái **Ready**.

## Bước 6. Khóa Security Rules
Test mode chỉ có hiệu lực 30 ngày. Vào **Firestore → Rules**, thay bằng đoạn sau rồi **Publish**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /apple_snake_scores/{id} {
      allow read: if true;
      allow create: if request.resource.data.keys().hasOnly(['name','score','createdAt'])
        && request.resource.data.name is string
        && request.resource.data.name.size() <= 12
        && request.resource.data.score is int
        && request.resource.data.score >= 0
        && request.resource.data.score < 1000;
      allow update, delete: if false;
    }
  }
}
```

## Bước 7. Kiểm thử
1. Mở link Vercel, chơi, ăn vài quả táo, khi thua nhập tên rồi bấm **Lưu điểm**.
2. Dòng trạng thái ghi "Dữ liệu từ Firebase Firestore", tên và điểm hiện trong Top 5.
3. Vào Firebase Console → Firestore, sẽ thấy collection `apple_snake_scores` có document mới.
4. Mở link bằng điện thoại để kiểm tra vuốt điều khiển.

## Lỗi thường gặp
- `permission-denied`: Rules chưa publish hoặc test mode đã hết hạn.
- Bảng xếp hạng vẫn báo "Chưa nối Firebase": `apiKey` vẫn là `DAN_API_KEY_VAO_DAY`, hoặc Vercel chưa build xong.
- Trang trắng khi mở file trực tiếp: dùng Live Server thay vì bấm đúp.
- Firebase báo lỗi domain: vào **Authentication → Settings → Authorized domains** và thêm domain Vercel (chỉ cần nếu sau này dùng Authentication).
