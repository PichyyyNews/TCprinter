# TCprinter - Android Mobile Notification Listener

คู่มือและข้อกำหนดการตั้งค่าโทรศัพท์ Android เพื่อทำหน้าที่เป็นตัวดักจับการแจ้งเตือนเงินเข้าจากแอปพลิเคชันธนาคาร (Bank Notification Forwarder) สำหรับระบบชำระเงินอัตโนมัติฟรี ไม่มีค่าธรรมเนียม

## 1. อุปกรณ์ที่จำเป็น
* โทรศัพท์มือถือ Android เครื่องสำรอง (เวอร์ชัน Android 8.0 ขึ้นไป)
* เชื่อมต่อ Wi-Fi หรือ Cellular Data ตลอด 24 ชม. และเสียบสายชาร์จทิ้งไว้
* ติดตั้งแอปพลิเคชันธนาคารที่ผูกบัญชีพร้อมเพย์ของตู้ (เช่น K PLUS, SCB EASY, Krungthai NEXT)
* เปิดการแจ้งเตือนยอดเงินเข้า (Push Notifications) ในแอปธนาคารให้เรียบร้อย

## 2. ทางเลือกในการติดตั้ง Forwarder

### ทางเลือกที่ 1: ใช้แอป MacroDroid (แนะนำ: ตั้งค่าง่ายสุด)
1. ติดตั้งแอป **MacroDroid - Device Automation** จาก Google Play Store
2. ไปที่ **Settings** $\rightarrow$ ให้สิทธิ์ **Notification Access (การเข้าถึงการแจ้งเตือน)**
3. สร้าง Macro ใหม่:
   * **Trigger (ตัวกระตุ้น):** `Notification` $\rightarrow$ `Notification Received` $\rightarrow$ เลือกแอปธนาคาร (เช่น K PLUS, SCB EASY) $\rightarrow$ ระบุข้อความตรงกับคำว่า `"เงินเข้า"` หรือ `"รับโอน"`
   * **Action (การกระทำ):** `Connectivity` $\rightarrow$ `HTTP Request`
     - **Method:** `POST`
     - **URL:** `https://your-api-domain.com/api/v1/payments/webhook`
     - **Headers:** `X-Webhook-Secret: YOUR_SECRET_KEY`, `Content-Type: application/json`
     - **Body Content:**
       ```json
       {
         "bank": "[not_app_name]",
         "rawText": "[not_body]",
         "title": "[not_title]",
         "timestamp": "[year]-[month_digit]-[day_digit]T[hour]:[minute]:00+07:00"
       }
       ```

### ทางเลือกที่ 2: ใช้แอป Tasker
1. ติดตั้ง **Tasker**
2. สร้าง Profile: `Event` $\rightarrow$ `UI` $\rightarrow$ `Notification` $\rightarrow$ เลือก Owner Application เป็นแอปธนาคาร
3. สร้าง Task: `Net` $\rightarrow$ `HTTP Request` แบบ POST ยิงไปยัง Webhook ของ Backend

## 3. รายการ Package Name ของแอปพลิเคชันธนาคารในไทย

| ธนาคาร | ชื่อแอปพลิเคชัน | Android Package Name |
|---|---|---|
| ธนาคารกสิกรไทย | K PLUS | `com.kasikorn.retail.mbanking.wap` |
| ธนาคารไทยพาณิชย์ | SCB EASY | `com.scb.phone` |
| ธนาคารกรุงไทย | Krungthai NEXT | `ktbcs.netbank` |
| ธนาคารกรุงเทพ | Bangkok Bank Mobile | `com.bbl.mobilephone` |
| ธนาคารทหารไทยธนชาต | ttb touch | `com.ttbbank.oneapp` |
