# 🖨️ TCprinter - Automated Print Kiosk System
> ระบบตู้พิมพ์เอกสารอัตโนมัติแบบครบวงจร (Self-service Print Kiosk) พร้อมระบบชำระเงินแบบ Hybrid ไร้ค่าธรรมเนียม และตัวสั่งพิมพ์ฮาร์ดแวร์แบบ Real-time

---

## 📌 ภาพรวมสถาปัตยกรรมระบบ 4 ส่วนหลัก (Core Modules)

ระบบถูกแบ่งออกเป็น 4 ส่วนหลักที่ทำงานร่วมกันแบบ Real-time ตั้งแต่ผู้ใช้อัปโหลดไฟล์ไปจนถึงกระดาษพิมพ์ออกมา:

### 1. ส่วนติดต่อผู้ใช้งานและผู้ดูแลระบบ (Frontend Web - Next.js)
* **User Interface (หน้าบ้าน):**
  - อัปโหลดไฟล์ PDF (ระบบตรวจสอบและนับหน้าอัตโนมัติ)
  - เลือกการตั้งค่าการพิมพ์ (ดึงข้อมูลถาดกระดาษที่พร้อมใช้งานจริงจาก Admin)
  - แสดงราคาแบบ Dynamic Pricing ทันทีที่เปลี่ยนการตั้งค่า
  - แสดง PromptPay QR Code (แบบระบุยอดเงินมีเศษสตางค์)
  - แสดงสถานะคิวแบบ Real-time ผ่าน WebSocket (รอจ่าย $\rightarrow$ กำลังพิมพ์ $\rightarrow$ เสร็จสิ้น)
  - มีปุ่ม "อัปโหลดสลิป" (สำหรับ Payment แนวทางที่ 1 เป็นแผนสำรอง)
* **Admin Dashboard (หลังบ้าน):**
  - ตั้งค่าและจัดการถาดกระดาษ (Tray Mapping) ว่าช่องไหนใส่กระดาษอะไร (A4, A3, ขาวดำ, สี) เพื่อเปิด/ปิดตัวเลือกหน้าบ้าน
  - ดูประวัติการพิมพ์และสถานะคิวทั้งหมด

### 2. ระบบประมวลผลกลาง (Backend API - Node.js / Express)
* **File Engine:** รับไฟล์ที่อัปโหลด แกะจำนวนหน้า (`pdf-parse`) และจัดการลบไฟล์ทิ้งเมื่อพิมพ์เสร็จเพื่อความปลอดภัย
* **Pricing Engine:** คำนวณราคาตามสูตร (โหมดสี + หน้าหลัง + ขนาดกระดาษ) และสุ่มเศษสตางค์ (เช่น `.01` - `.99`) เพื่อใช้แยกแยะยอดโอน
* **Queue & Logic Manager:** สร้างคิวลงฐานข้อมูล (PostgreSQL) และตรวจสอบว่าการตั้งค่ากระดาษที่ User เลือก ตรงกับสถานะถาดที่ Admin ตั้งไว้หรือไม่
* **WebSocket Server (Socket.io):** กระจายสถานะการพิมพ์และสถานะการชำระเงินกลับไปที่หน้าจอผู้ใช้ทันที

### 3. ระบบชำระเงินแบบ Hybrid (Payment Gateway)
ทำงานประสานกัน 2 ช่องทางเพื่อความเสถียรและใช้งานฟรี:
* **ช่องทางหลัก (Auto Notification):**
  - โทรศัพท์ Android (เครื่องสำรอง) เปิดแอปธนาคารรับแจ้งเตือน
  - แอปดักจับ Notification ทำงานเบื้องหลัง เมื่อมีเงินเข้าจะยิง Webhook (ยอดเงิน + เวลา) มาที่ Backend
  - Backend นำยอดเงินที่มีเศษสตางค์ไปจับคู่กับคิวที่รออยู่ และกด "จ่ายสำเร็จ" อัตโนมัติ
* **ช่องทางสำรอง (OCR Slip Fallback):**
  - หากระบบหลักดีเลย์ ผู้ใช้กดอัปโหลดสลิปที่หน้าเว็บ
  - Backend ส่งรูปสลิปเข้า Tesseract.js (OCR) ดึงยอดเงินและเวลาออกมา
  - ตรวจสอบความถูกต้องและวันเวลา หากตรงเงื่อนไข $\rightarrow$ กด "จ่ายสำเร็จ" อัตโนมัติ

### 4. ตัวกลางสั่งพิมพ์และฮาร์ดแวร์ (Print Agent & Printer)
* **Print Agent (Python/Node.js):** สคริปต์ขนาดเล็กที่รันอยู่บนเซิร์ฟเวอร์เดียวกับที่ต่อสาย USB/LAN เข้าเครื่องพิมพ์
* **การทำงาน:**
  - รอรับคำสั่ง (Job Payload) จาก Backend ว่ามีคิวที่จ่ายเงินสำเร็จแล้ว
  - ดาวน์โหลดไฟล์ชั่วคราว
  - สั่งรันคำสั่ง OS-level (เช่น CUPS บน Linux หรือ Print Spooler บน Windows) โดยแนบ Parameter การพิมพ์ไปครบถ้วน (หน้า-หลัง, สี, เลือกถาดกระดาษ)
  - ส่งสถานะ "พิมพ์สำเร็จ" กลับไปที่ Backend เพื่ออัปเดตหน้าจอ User ให้เสร็จสมบูรณ์

---

## 🔄 แผนผังการไหลของข้อมูล (User Journey Data Flow)

```text
  [1] PDF Upload          [2] Parse & Pricing        [3] Satang QR Code       [4] Scan & Pay
User ─────────► Frontend ──────────────────► Backend ─────────────────► PromptPay ────────► User Bank
                     ▲                          │                           ▲                      │
                     │                          ▼                           │             ┌────────┴────────┐
                     │                  [8] Delete Temp File                │             │                 │
                     │                          │                           │          Flow A            Flow B
                     │                          ▼                           │         (Webhook)       (Slip OCR)
                     │                 [5] Socket Status                    │             │                 │
                     └────────────────── "กำลังพิมพ์" ◄────────────────────┼─────────────┴─────────────────┘
                                                │                           │
                                                ▼                           │
                                       [6] Dispatch Job                     │
                                                │                           │
                                                ▼                           │
                                          Print Agent                       │
                                                │                           │
                                                ▼                           │
                                     [7] SumatraPDF / Spooler               │
                                                │                           │
                                                ▼                           │
                                        Physical Printer                    │
                                                │                           │
                                                ▼                           │
                     [8] "สำเร็จ! รับเอกสาร" ◄──┴───────────────────────────┘
```

1. `User` โยนไฟล์ PDF $\rightarrow$ `Frontend`
2. `Backend` นับหน้า / เช็คถาดกระดาษจาก `Database` $\rightarrow$ ส่งกลับมาโชว์ราคาที่ `Frontend`
3. `User` กดยืนยัน $\rightarrow$ `Backend` สุ่มยอดเศษสตางค์ $\rightarrow$ แสดง QR Code สร้างจาก PromptPay เบอร์ร้าน
4. `User` สแกนจ่ายผ่านแอปธนาคาร
   * *Flow A:* ธนาคารแจ้งเตือนเข้ามือถือ Android $\rightarrow$ ส่ง Webhook บอก `Backend`
   * *Flow B (ถ้า A ไม่ทำงาน):* `User` อัปโหลดสลิป $\rightarrow$ `Backend` ทำ OCR อ่านสลิป
5. `Backend` เจอว่ายอดตรงกัน $\rightarrow$ อัปเดต Database $\rightarrow$ ยิง Socket.io บอกหน้าเว็บว่า "กำลังพิมพ์"
6. `Backend` ส่งไฟล์และตั้งค่าไปให้ `Print Agent`
7. `Print Agent` สั่งเครื่องพิมพ์ทำงาน $\rightarrow$ แจ้ง `Backend` เมื่อเสร็จ
8. `Frontend` ขึ้นสถานะ "สำเร็จ! รับเอกสารได้เลย" $\rightarrow$ `Backend` ลบไฟล์ทิ้ง

---

## 📑 สารบัญเอกสารเชิงเทคนิคใน `docs/`

| เอกสาร | หัวข้อหลัก | ลิงก์ |
|---|---|---|
| **Architecture Overview** | โครงสร้างระบบ 4 เลเยอร์, เทคโนโลยีที่เลือกใช้, State Machine วงจรชีวิตงานพิมพ์, และความปลอดภัยตามมาตรฐาน PDPA | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **System Data Flow** | ลำดับการไหลของข้อมูล 8 ขั้นตอน พร้อม Sequence Diagram ละเอียดทั้ง Flow A และ Flow B | [SYSTEM_DATA_FLOW.md](docs/SYSTEM_DATA_FLOW.md) |
| **Payment Engine** | อัลกอริทึมสุ่มเศษสตางค์ป้องกันยอดชนกัน, การสร้าง EMVCo PromptPay Dynamic QR, Android Notification Webhook, และระบบตรวจสลิปสำรองด้วย AI OCR | [PAYMENT_ENGINE.md](docs/PAYMENT_ENGINE.md) |
| **Print Agent Spec** | วิธีการสั่งพิมพ์แบบ Silent Print บน Windows (SumatraPDF / Win32 Spooler) และ CUPS บน Linux, การเลือกถาดกระดาษ, และ Error Codes | [PRINT_AGENT_SPEC.md](docs/PRINT_AGENT_SPEC.md) |
| **Database Schema** | นิยาม Prisma Schema, ER-Diagram, ดัชนีความเร็วสูงสำหรับการจับคู่ยอดเงิน และมาตรการป้องกันการใช้สลิปซ้ำ | [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) |
| **API Contract** | ข้อตกลง RESTful API Endpoint (`/api/v1`) และ Event Contract บน Socket.io สำหรับสื่อสารแบบเรียลไทม์ | [API_CONTRACT.md](docs/API_CONTRACT.md) |

---

## 🗺️ แผนผังการพัฒนา (Development Roadmap)

- [x] **Phase 1: Architecture Blueprint & Specifications (สมบูรณ์)**
  - จัดโครงสร้าง Repository
  - ออกแบบเอกสารสถาปัตยกรรมระบบทั้ง 6 ฉบับ
  - จัดทำผังข้อมูล 8 ขั้นตอน User Journey Data Flow
- [ ] **Phase 2: Backend Core Engine & Database**
  - ติดตั้ง Node.js, Express, TypeScript, Prisma ORM
  - พัฒนา File Engine ตรวจนับหน้า PDF (`pdf-parse`) และระบบลบไฟล์อัตโนมัติ
  - พัฒนา Pricing Engine และระบบสุ่มเศษสตางค์ (Satang Allocation)
  - พัฒนา WebSocket Gateway (Socket.io)
- [ ] **Phase 3: Hybrid Payment Engine**
  - พัฒนา Webhook Endpoint รองรับการแจ้งเตือนจาก Android Listener
  - พัฒนาโมดูลสร้าง EMVCo PromptPay Dynamic QR Code
  - พัฒนา OCR Slip Fallback ด้วย Tesseract.js พร้อมระบบป้องกันสลิปซ้ำ (SHA-256 Hash)
- [ ] **Phase 4: Frontend Web Portal & Admin (Next.js)**
  - พัฒนาหน้า User Portal (Drag & Drop PDF, Print Settings, Live Price, QR Code, Status Tracker, ปุ่มอัปโหลดสลิป)
  - พัฒนาหน้า Admin Dashboard (Tray Mapping เปิด/ปิดถาด, ตรวจสอบคิวงานและประวัติ)
- [ ] **Phase 5: Print Agent (Hardware Integration)**
  - พัฒนา Print Agent รันบน Windows
  - เชื่อมต่อ SumatraPDF CLI / Windows Spooler ควบคุมถาดและ Duplex
  - เชื่อมต่อ Socket.io รับงานและส่งสถานะเสร็จสิ้น
- [ ] **Phase 6: End-to-End Testing & Deployment**
  - ทดสอบทดลองพิมพ์จริงร่วมกับฮาร์ดแวร์
  - จัดทำ Packaging และ Script รันตู้แบบ Auto-start เมื่อเปิดเครื่อง
