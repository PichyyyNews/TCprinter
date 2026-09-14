# ลำดับการไหลของข้อมูลในระบบ (System Data Flow & Sequence Diagrams)

เอกสารนี้แสดงลำดับขั้นตอนการทำงานอย่างละเอียด (End-to-End Sequence) ตั้งแต่ผู้ใช้ก้าวเข้ามาใช้งานตู้พิมพ์ อัปโหลดไฟล์ ชำระเงิน ตรวจสอบสถานะ การสั่งพิมพ์ฮาร์ดแวร์ ไปจนถึงการล้างไฟล์ออกจากระบบ

---

## 1. ลำดับการทำงานหลัก (Primary Flow - Standard Auto Notification)

โฟลว์มาตรฐานเมื่อระบบรับชำระเงินทำงานผ่าน Android Notification Listener แบบอัตโนมัติ:

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
    User->>Web: 1. ลาก/เลือกไฟล์ PDF ขึ้นระบบ
    Web->>API: 2. POST /api/v1/jobs/quote (Upload PDF)
    API->>API: 3. ตรวจสอบไฟล์ & แกะจำนวนหน้า (pdf-parse)
    API->>DB: 4. ดึงสถานะถาดกระดาษ (Trays) & อัตราค่าบริการ
    DB-->>API: 5. ข้อมูลถาดที่พร้อมใช้งาน + Pricing Rules
    API-->>Web: 6. ส่งผลลัพธ์ (จำนวนหน้า, ขนาด, ถาดที่ใช้ได้, ราคาเริ่มต้น)
    
    %% Step 2: Configuration & QR Generation
    User->>Web: 7. เลือกการตั้งค่า (สี, หน้า-หลัง, จำนวนชุด)
    Web->>API: 8. POST /api/v1/jobs/create (ยืนยันคำสั่งพิมพ์)
    API->>API: 9. คำนวณราคา + สุ่มเศษสตางค์ที่ไม่ซ้ำ (เช่น 25.43 บาท)
    API->>API: 10. สร้าง PromptPay Payload (EMVCo QR)
    API->>DB: 11. บันทึก PrintJob (สถานะ: PENDING_PAYMENT, TTL 15 นาที)
    API-->>Web: 12. ส่ง jobId + QR Code + ยอดรวม 25.43 บาท
    Web->>WS: 13. เข้าร่วมห้อง Socket (join: job_12345)
    Web-->>User: 14. แสดง QR Code พร้อมเลขนับถอยหลัง 15:00 นาที

    %% Step 3: Payment & Match
    User->>Bank: 15. สแกนจ่ายด้วย Mobile Banking (ยอด 25.43 บาท)
    Bank-->>Android: 16. แจ้งเตือนเงินเข้าบัญชี (Push Notification)
    Android->>API: 17. POST /api/v1/payments/webhook (Bank, Amount: 25.43, Time)
    API->>DB: 18. ค้นหา Job ที่สถานะ PENDING_PAYMENT และยอดเงินตรงกัน (25.43 บาท)
    DB-->>API: 19. พบ Job #12345 (ยังไม่หมดอายุ)
    API->>DB: 20. อัปเดต Job เป็น PAID
    API->>WS: 21. ส่ง Event 'payment:confirmed' ไปยังห้อง job_12345
    WS-->>Web: 22. หน้าเว็บเปลี่ยนสถานะเป็น "ชำระเงินสำเร็จ กำลังส่งข้อมูลไปยังเครื่องพิมพ์..."

    %% Step 4: Dispatch to Print Agent
    API->>WS: 23. ส่ง Event 'agent:new_job' (jobId, tray, duplex, color, copies, token)
    WS->>Agent: 24. Print Agent ได้รับคำสั่งงาน
    Agent->>API: 25. GET /api/v1/jobs/12345/download?token=xxx
    API-->>Agent: 26. ส่งไฟล์ PDF ชั่วคราว
    Agent->>WS: 27. ส่ง Event 'job:status' (status: PRINTING)
    WS-->>Web: 28. หน้าเว็บแสดง "กำลังพิมพ์เอกสารของคุณ..."

    %% Step 5: Hardware Execution & Cleanup
    Agent->>Printer: 29. ส่งคำสั่ง Silent Print ผ่าน OS Spooler (Tray, Duplex, Color)
    Printer-->>Agent: 30. เครื่องพิมพ์ทำงานเสร็จสิ้น (Print Completed)
    Agent->>API: 31. POST /api/v1/jobs/12345/complete
    API->>DB: 32. อัปเดตสถานะเป็น COMPLETED
    API->>API: 33. ลบไฟล์ PDF ออกจาก Server (fs.unlink)
    Agent->>Agent: 34. ลบไฟล์ PDF ออกจากแคชเครื่อง Agent
    API->>WS: 35. ส่ง Event 'job:completed' ไปยังห้อง job_12345
    WS-->>Web: 36. หน้าเว็บแสดง "พิมพ์เสร็จแล้ว! กรุณารับเอกสารที่ช่องรับกระดาษ"
```

---

## 2. ลำดับการทำงานสำรอง (Fallback Flow - OCR Slip Upload)

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

    User->>Web: 1. กดปุ่ม "อัปโหลดสลิปยืนยันการโอน"
    User->>Web: 2. เลือกภาพสลิปที่แคปเจอร์จากแอปธนาคาร
    Web->>API: 3. POST /api/v1/payments/verify-slip (jobId, imageFile)
    API->>API: 4. คำนวณ SHA-256 Hash ของสลิปเพื่อกันการใช้ซ้ำ
    API->>DB: 5. เช็คว่า Hash สลิปนี้เคยถูกใช้ไปแล้วหรือไม่
    alt สลิปนี้เคยใช้แล้ว (Replay Attack)
        DB-->>API: สลิปนี้มีในระบบแล้ว
        API-->>Web: แจ้งข้อผิดพลาด "สลิปนี้ถูกใช้งานไปแล้ว"
    else สลิปยังไม่เคยถูกใช้
        API->>OCR: 6. ประมวลผลภาพ (Grayscale, Thresholding) + อ่านข้อความ
        OCR-->>API: 7. สกัดข้อมูล (ยอดเงิน, วันที่, เวลา, รหัสอ้างอิง)
        API->>API: 8. ตรวจสอบ: ยอดเงินตรงกับ Job (25.43) และเวลาห่างไม่เกิน 15 นาที
        alt ข้อมูลถูกต้องสมบูรณ์
            API->>DB: 9. บันทึก Slip Log + เปลี่ยนสถานะ Job เป็น PAID
            API->>WS: 10. ยิง Event 'payment:confirmed' ไปยังห้อง job_12345
            WS-->>Web: 11. หน้าเว็บปรับเป็น "ชำระเงินสำเร็จ" ทันที
            API->>Agent: 12. ส่งต่องานพิมพ์ไปยัง Print Agent ตามขั้นตอนปกติ
        else ข้อมูลไม่ตรงหรือไม่ชัดเจน
            API-->>Web: 13. แจ้งเตือน "ไม่สามารถตรวจสอบสลิปได้ กรุณาลองใหม่อีกครั้ง หรือติดต่อเจ้าหน้าที่"
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
5. ส่ง WebSocket แจ้งหน้าเว็บให้รีเฟรชหรือแจ้งว่า "คำสั่งซื้อหมดอายุ กรุณากดทำรายการใหม่"
6. สั่งลบไฟล์ PDF ชั่วคราวที่อัปโหลดไว้ทันทีเพื่อประหยัดพื้นที่และรักษาความเป็นส่วนตัว
