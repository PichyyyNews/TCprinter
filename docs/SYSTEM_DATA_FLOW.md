# ลำดับการไหลของข้อมูลในระบบ (System Data Flow & User Journey)

เอกสารนี้แสดงแผนผังการไหลของข้อมูลในระบบ (User Journey Data Flow) ทั้งหมด 8 ขั้นตอน ตั้งแต่ผู้ใช้อัปโหลดไฟล์ไปจนถึงกระดาษพิมพ์ออกมา พร้อม Sequence Diagrams การทำงานอย่างละเอียด

---

## 📌 แผนผังการไหลของข้อมูล 8 ขั้นตอน (User Journey Data Flow)

การทำงานของระบบตู้พิมพ์เอกสารอัตโนมัติ (Automated Print Kiosk) ดำเนินการตาม 8 ขั้นตอนหลักดังนี้:

1. **`User` โยนไฟล์ PDF $\rightarrow$ `Frontend`**  
   ผู้ใช้อัปโหลดไฟล์เอกสารผ่านหน้าเว็บ (รองรับทั้งมือถือและหน้าจอทัชสกรีน)
2. **`Backend` นับหน้า / เช็คถาดกระดาษจาก `Database` $\rightarrow$ ส่งกลับมาโชว์ราคาที่ `Frontend`**  
   ระบบตรวจสอบความถูกต้องของไฟล์ นับจำนวนหน้าอัตโนมัติ ดึงข้อมูลถาดที่พร้อมใช้งานจริงจาก Admin และคำนวณราคาแบบ Real-time แสดงบนหน้าจอ
3. **`User` กดยืนยัน $\rightarrow$ `Backend` สุ่มยอดเศษสตางค์ $\rightarrow$ แสดง QR Code สร้างจาก PromptPay เบอร์ร้าน**  
   ระบบจัดสรรเศษสตางค์ (`.01` - `.99`) ที่ไม่ซ้ำกับคิวอื่นที่รออยู่ใน 15 นาที และสร้าง Dynamic PromptPay QR Code ระบุยอดเงินรวมเศษสตางค์
4. **`User` สแกนจ่ายผ่านแอปธนาคาร**  
   * **Flow A (ช่องทางหลัก):** ธนาคารแจ้งเตือนเข้ามือถือ Android (เครื่องสำรอง) $\rightarrow$ แอปดักจับ Notification ส่ง Webhook มาบอก `Backend`
   * **Flow B (ช่องทางสำรอง - ถ้า A ไม่ทำงาน):** ผู้ใช้กดปุ่ม "อัปโหลดสลิป" $\rightarrow$ `Backend` ส่งรูปสลิปเข้า Tesseract.js (OCR) เพื่ออ่านยอดเงินและเวลา
5. **`Backend` เจอว่ายอดตรงกัน $\rightarrow$ อัปเดต Database $\rightarrow$ ยิง Socket.io บอกหน้าเว็บว่า "กำลังพิมพ์"**  
   ระบบปรับสถานะงานเป็น `PAID` และแจ้งเตือนหน้าจอผู้ใช้แบบสดทันที
6. **`Backend` ส่งไฟล์และตั้งค่าไปให้ `Print Agent`**  
   ระบบส่งคำสั่ง Job Payload (ไฟล์, ถาดกระดาษ, โหมดสี, พิมพ์สองหน้า, จำนวนชุด) ไปยังเครื่องคอมพิวเตอร์ที่ต่อกับเครื่องพิมพ์
7. **`Print Agent` สั่งเครื่องพิมพ์ทำงาน $\rightarrow$ แจ้ง `Backend` เมื่อเสร็จ**  
   Agent รันคำสั่ง OS-level Silent Print สั่งเครื่องพิมพ์จริงทำงาน เมื่อกระดาษพิมพ์เสร็จจะส่ง Callback แจ้งระบบ
8. **`Frontend` ขึ้นสถานะ "สำเร็จ! รับเอกสารได้เลย" $\rightarrow$ `Backend` ลบไฟล์ทิ้ง**  
   หน้าจอผู้ใช้แสดงสถานะเสร็จสิ้น และเซิร์ฟเวอร์ลบไฟล์เอกสารชั่วคราวทิ้งทันที (`fs.unlink`) เพื่อรักษาความปลอดภัยและความเป็นส่วนตัว

---

## 1. Sequence Diagram: ลำดับการทำงานหลัก (Primary Flow - Auto Notification)

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 ผู้ใช้งาน
    participant Web as 💻 Frontend (Next.js)
    participant API as ⚙️ Backend API (Express)
    participant DB as 🗄️ Database (PostgreSQL)
    participant WS as 🔄 WebSocket Server
    actor Bank as 🏦 ธนาคาร / พร้อมเพย์
    participant Android as 📲 Android Listener
    participant Agent as 🤖 Print Agent
    participant Printer as 🖨️ เครื่องพิมพ์จริง

    %% Step 1: Upload & Quote
    Note over User,Web: ขั้นตอนที่ 1
    User->>Web: 1. ลาก/เลือกไฟล์ PDF ขึ้นระบบ
    Web->>API: 2. POST /api/v1/jobs/quote (Upload PDF)
    
    %% Step 2: Parse & Tray Check
    Note over API,Web: ขั้นตอนที่ 2
    API->>API: 3. ตรวจสอบไฟล์ & แกะจำนวนหน้า (pdf-parse)
    API->>DB: 4. ดึงสถานะถาดกระดาษ (Trays) & อัตราค่าบริการ
    DB-->>API: 5. ข้อมูลถาดที่พร้อมใช้งาน + Pricing Rules
    API-->>Web: 6. ส่งกลับมาโชว์ราคาที่ Frontend (จำนวนหน้า, ถาดที่ใช้ได้)
    
    %% Step 3: Config & Satang QR
    Note over User,Web: ขั้นตอนที่ 3
    User->>Web: 7. เลือกการตั้งค่า (สี, หน้า-หลัง, จำนวนชุด) และกดยืนยัน
    Web->>API: 8. POST /api/v1/jobs/create (ยืนยันคำสั่งพิมพ์)
    API->>API: 9. คำนวณราคา + สุ่มเศษสตางค์ที่ไม่ซ้ำ (เช่น 25.43 บาท)
    API->>API: 10. สร้าง PromptPay Payload (EMVCo QR)
    API->>DB: 11. บันทึก PrintJob (สถานะ: PENDING_PAYMENT, TTL 15 นาที)
    API-->>Web: 12. แสดง QR Code PromptPay เบอร์ร้าน + ยอด 25.43 บาท
    Web->>WS: 13. เข้าร่วมห้อง Socket (join: job_12345)
    Web-->>User: 14. หน้าเว็บแสดง QR Code พร้อมเวลานับถอยหลัง 15:00 นาที

    %% Step 4: Pay & Auto Webhook
    Note over User,Android: ขั้นตอนที่ 4 (Flow A: ทางหลัก)
    User->>Bank: 15. สแกนจ่ายด้วย Mobile Banking (ยอด 25.43 บาท)
    Bank-->>Android: 16. แจ้งเตือนเงินเข้าบัญชี (Push Notification)
    Android->>API: 17. ส่ง Webhook (POST /payments/webhook) แจ้งยอด 25.43 บาท
    
    %% Step 5: Match & Socket Notify
    Note over API,Web: ขั้นตอนที่ 5
    API->>DB: 18. ตรวจพบว่ายอดตรงกัน (25.43 บาท) และยังไม่หมดอายุ
    API->>DB: 19. อัปเดต Job เป็น PAID
    API->>WS: 20. ยิง Socket.io Event 'payment:confirmed'
    WS-->>Web: 21. หน้าเว็บปรับสถานะบอกว่า "กำลังพิมพ์"

    %% Step 6: Dispatch to Print Agent
    Note over API,Agent: ขั้นตอนที่ 6
    API->>WS: 22. ส่ง Event 'agent:new_job' (jobId, tray, duplex, color, copies)
    WS->>Agent: 23. Print Agent รับคำสั่งงาน
    Agent->>API: 24. GET /api/v1/jobs/12345/download
    API-->>Agent: 25. ส่งไฟล์ PDF ชั่วคราว

    %% Step 7: Print Hardware Execution
    Note over Agent,Printer: ขั้นตอนที่ 7
    Agent->>Printer: 26. สั่งเครื่องพิมพ์ทำงาน (SumatraPDF / Spooler)
    Printer-->>Agent: 27. พิมพ์กระดาษออกมาเรียบร้อย
    Agent->>API: 28. แจ้ง Backend เมื่อเสร็จ (POST /jobs/12345/complete)

    %% Step 8: Frontend Success & File Purge
    Note over Web,API: ขั้นตอนที่ 8
    API->>DB: 29. อัปเดตสถานะเป็น COMPLETED
    API->>WS: 30. ส่ง Event 'job:completed'
    WS-->>Web: 31. Frontend ขึ้นสถานะ "สำเร็จ! รับเอกสารได้เลย"
    API->>API: 32. Backend ลบไฟล์ PDF ทิ้งทันที (fs.unlink)
    Agent->>Agent: 33. ลบไฟล์แคชในเครื่อง Agent ทิ้ง
```

---

## 2. Sequence Diagram: ลำดับการทำงานสำรอง (Fallback Flow - OCR Slip Upload)

กรณีที่การแจ้งเตือนจากธนาคารมายังมือถือ Android ล่าช้า ผู้ใช้สามารถกดปุ่มยืนยันด้วยสลิป:

```mermaid
sequenceDiagram
    autonumber
    actor User as 👤 ผู้ใช้งาน
    participant Web as 💻 Frontend (Next.js)
    participant API as ⚙️ Backend API (Express)
    participant OCR as 🔍 Tesseract.js OCR Engine
    participant DB as 🗄️ Database (PostgreSQL)
    participant WS as 🔄 WebSocket Server
    participant Agent as 🤖 Print Agent

    Note over User,Web: ขั้นตอนที่ 4 (Flow B: ทางสำรอง)
    User->>Web: 1. กดปุ่ม "อัปโหลดสลิป"
    User->>Web: 2. เลือกภาพสลิปจากแอปธนาคาร
    Web->>API: 3. POST /api/v1/payments/verify-slip (jobId, imageFile)
    API->>API: 4. คำนวณ SHA-256 Hash ของสลิปเพื่อกันการใช้ซ้ำ
    API->>DB: 5. เช็คว่า Hash สลิปนี้เคยถูกใช้ไปแล้วหรือไม่
    alt สลิปนี้เคยใช้แล้ว (Replay Attack)
        DB-->>API: สลิปนี้มีในระบบแล้ว
        API-->>Web: แจ้งข้อผิดพลาด "สลิปนี้ถูกใช้งานไปแล้ว"
    else สลิปยังไม่เคยถูกใช้
        API->>OCR: 6. ส่งรูปสลิปเข้า Tesseract.js อ่านยอดเงินและเวลา
        OCR-->>API: 7. สกัดข้อมูล (ยอดเงิน, วันที่, เวลา)
        API->>API: 8. ตรวจสอบ: ยอดเงินตรงกับ Job (เช่น 25.43) และเวลาห่างไม่เกิน 15 นาที
        alt ข้อมูลตรงตามเงื่อนไข
            Note over API,Web: เข้าสู่ขั้นตอนที่ 5 ทันที
            API->>DB: 9. บันทึก Slip Log + ปรับสถานะเป็น PAID
            API->>WS: 10. ยิง Event 'payment:confirmed' บอกหน้าเว็บว่า "กำลังพิมพ์"
            WS-->>Web: 11. หน้าเว็บปรับสถานะเรียลไทม์
            Note over API,Agent: ไปยังขั้นตอนที่ 6-8 ตามลำดับ
            API->>Agent: 12. ส่งงานไปยัง Print Agent ตามโฟลว์ปกติ
        else ข้อมูลไม่ตรง
            API-->>Web: 13. แจ้งเตือน "ข้อมูลสลิปไม่ตรงกับยอดที่ต้องชำระ"
        end
    end
```

---

## 3. การจัดการกรณีเกิดข้อผิดพลาด (Exception Handling Scenarios)

### กรณี 3.1: กระดาษหมด หรือ เครื่องพิมพ์ติดขัด (Paper Jam / Out of Paper)
1. ระหว่างที่ Spooler สั่งพิมพ์ เครื่องพิมพ์ส่งสถานะแจ้งเตือนข้อผิดพลาดกลับมายัง Print Agent
2. Print Agent ส่งรายงานสถานะกลับมายัง Backend: `POST /api/v1/jobs/:id/error` พร้อมรายละเอียด (`OUT_OF_PAPER_TRAY_1`)
3. Backend:
   - ปรับสถานะถาด Tray 1 ใน Database เป็น `DISABLED` หรือ `OUT_OF_PAPER`
   - กระจาย WebSocket ไปยัง Admin Dashboard ให้ส่งเสียงเตือนผู้ดูแล
   - ส่ง WebSocket ไปยังหน้าจอผู้ใช้: "ขออภัย กระดาษในถาดหมด เจ้าหน้าที่กำลังเดินทางมาเติมกระดาษ คิวงานของคุณถูกบันทึกไว้แล้ว"

### กรณี 3.2: คำสั่งซื้อหมดอายุ (Order Timeout / Expired)
1. หากผู้ใช้เปิดหน้า QR Code ค้างไว้เกิน 15 นาทีโดยไม่ชำระเงิน
2. Backend Background Scheduler (หรือ Node Cron) ทำการกวาด Job ที่ค้างอยู่
3. ปรับสถานะ Job เป็น `EXPIRED`
4. ปลดล็อกเศษสตางค์ (เช่น `.43`) กลับเข้า Pool กลาง เพื่อให้ออร์เดอร์ถัดไปสามารถนำไปสุ่มใช้ได้
5. ส่ง WebSocket แจ้งหน้าเว็บให้แจ้งเตือนผู้ใช้ว่า "คำสั่งซื้อหมดอายุ กรุณากดทำรายการใหม่"
6. สั่งลบไฟล์ PDF ชั่วคราวที่อัปโหลดไว้ทันทีเพื่อประหยัดพื้นที่และรักษาความเป็นส่วนตัว
