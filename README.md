# 🖨️ TCprinter - Automated Print Kiosk System
> ระบบตู้พิมพ์เอกสารอัตโนมัติแบบครบวงจร (Self-service Print Kiosk) พร้อมระบบชำระเงินแบบ Hybrid ไร้ค่าธรรมเนียม และตัวสั่งพิมพ์ฮาร์ดแวร์แบบ Real-time

---

## 📌 ภาพรวมโครงการ (Project Overview)

**TCprinter** เป็นโซลูชันระบบตู้พิมพ์เอกสารแบบบริการตนเอง (Self-service Kiosk) ตลอด 24 ชั่วโมง โดยผู้ใช้งานสามารถอัปโหลดไฟล์ PDF ผ่านมือถือหรือหน้าจอทัชสกรีน เลือกปรับแต่งการพิมพ์ (ขนาดกระดาษ, โหมดสี, พิมพ์หน้าเดียว/หน้า-หลัง, จำนวนชุด) ระบบจะคำนวณราคาแบบ Dynamic พร้อมสุ่มเศษสตางค์ และสร้าง PromptPay QR Code ให้ผู้ใช้สแกนจ่าย เมื่อตรวจพบยอดเงินโอนเข้า ระบบจะส่งคำสั่งพิมพ์ไปยังเครื่องพิมพ์จริงผ่าน Print Agent โดยอัตโนมัติทันที

---

## 🏛️ สถาปัตยกรรมระบบ 4 โมดูลหลัก (Core Modules)

```text
TCprinter/
├── docs/                       # 📚 เอกสารสถาปัตยกรรมและพิมพ์เขียวระบบฉบับสมบูรณ์
│   ├── ARCHITECTURE.md         # สถาปัตยกรรมระบบโดยรวม, State Machine, และ Tech Stack
│   ├── SYSTEM_DATA_FLOW.md     # Sequence Diagrams แสดงขั้นตอนการไหลของข้อมูลตั้งแต่ต้นจนจบ
│   ├── PAYMENT_ENGINE.md       # ระบบคิดเงิน, การสุ่มเศษสตางค์, Android Webhook และ Slip OCR
│   ├── PRINT_AGENT_SPEC.md     # ข้อกำหนดของ Print Agent สั่งพิมพ์ Windows/Linux และคุมถาด
│   ├── DATABASE_SCHEMA.md      # ER-Diagram, Schema Definition (Prisma/PostgreSQL)
│   └── API_CONTRACT.md         # ข้อตกลง REST API & Socket.io Events ระหว่างโมดูล
├── frontend/                   # 💻 ส่วนติดต่อผู้ใช้และแอดมิน (Next.js + Tailwind CSS)
├── backend/                    # ⚙️ ระบบประมวลผลกลาง (Node.js + Express + Prisma + Socket.io)
├── print-agent/                # 🤖 สคริปต์ควบคุมเครื่องพิมพ์จริง (Windows SumatraPDF / Spooler)
├── mobile-listener/            # 📲 คู่มือการตั้งค่าเครื่อง Android ดักจับการแจ้งเตือนเงินเข้า
└── .gitignore                  # กรองไฟล์ที่ไม่จำเป็นและไฟล์เอกสารชั่วคราว
```

---

## 📑 สารบัญเอกสารเชิงเทคนิค (Technical Documentation)

| เอกสาร | หัวข้อหลัก | ลิงก์ |
|---|---|---|
| **Architecture Overview** | โครงสร้างระบบ 4 เลเยอร์, เทคโนโลยีที่เลือกใช้, State Machine วงจรชีวิตงานพิมพ์, และความปลอดภัยตามมาตรฐาน PDPA | [ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| **System Data Flow** | แผนผัง Sequence Diagram แสดงลำดับการทำงานตั้งแต่ User โยนไฟล์ $\rightarrow$ คิดเงิน $\rightarrow$ จ่ายเงิน $\rightarrow$ สั่งพิมพ์ $\rightarrow$ ลบไฟล์ | [SYSTEM_DATA_FLOW.md](docs/SYSTEM_DATA_FLOW.md) |
| **Payment Engine** | อัลกอริทึมสุ่มเศษสตางค์ป้องกันยอดชนกัน, การสร้าง EMVCo PromptPay Dynamic QR, การดักจับ Notification จากแอปธนาคาร, และระบบตรวจสลิปสำรองด้วย AI OCR | [PAYMENT_ENGINE.md](docs/PAYMENT_ENGINE.md) |
| **Print Agent Spec** | วิธีการสั่งพิมพ์แบบ Silent Print บน Windows (SumatraPDF / Win32 Spooler) และ CUPS บน Linux, การเลือกถาดกระดาษ (Tray Selection), และการจัดการ Error Code | [PRINT_AGENT_SPEC.md](docs/PRINT_AGENT_SPEC.md) |
| **Database Schema** | นิยาม Prisma Schema, ER-Diagram, ดัชนีความเร็วสูงสำหรับการจับคู่ยอดเงิน และมาตรการป้องกันการใช้สลิปซ้ำ (Anti-replay) | [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) |
| **API Contract** | ข้อตกลง RESTful API Endpoint (`/api/v1`) และ Event Contract บน Socket.io สำหรับสื่อสารแบบเรียลไทม์ | [API_CONTRACT.md](docs/API_CONTRACT.md) |

---

## 💡 จุดเด่นของระบบ (Key Highlights)

1. **Zero Gateway Fee (ไม่มีค่าธรรมเนียมชำระเงินรายเดือน):**
   - **ทางเลือกหลัก:** แจ้งเตือนเงินเข้าอัตโนมัติผ่านการ Forward Notification จากแอปธนาคารบนมือถือ Android จับคู่ด้วยเศษสตางค์เฉพาะออร์เดอร์
   - **ทางเลือกสำรอง:** ผู้ใช้อัปโหลดสลิปธนาคารเข้าระบบ OCR (Tesseract.js) กรณีระบบหลักดีเลย์
2. **Dynamic Tray Awareness (ระบบรู้สถานะถาดกระดาษจริง):**
   - ผู้ดูแลสามารถระบุได้ว่าถาดใดใส่กระดาษอะไร (เช่น Tray 1: A4 ขาวดำ, Tray 2: A4 สี, Tray 3: A3)
   - หากกระดาษในถาดใดหมด ระบบจะปิดตัวเลือกนั้นที่หน้าบ้านทันที ป้องกันผู้ใช้สั่งพิมพ์ผิดพลาด
3. **Data Privacy & Ephemeral Storage (ความเป็นส่วนตัวสูง):**
   - เอกสารของผู้ใช้จะถูกเก็บในโฟลเดอร์ชั่วคราวและลบทิ้งทันที (`fs.unlink`) เมื่อการพิมพ์เสร็จสิ้น หรือหมดอายุใน 15 นาที
4. **Real-time Experience (ทำงานแบบสดทุกวินาที):**
   - เชื่อมต่อหน้าจอผู้ใช้กับ Backend และ Print Agent ผ่าน Socket.io แสดงผลสถานะการชำระเงินและคิวพิมพ์ทันทีโดยไม่ต้องกดรีเฟรชหน้าจอ

---

## 🗺️ แผนผังการพัฒนา (Development Roadmap)

- [x] **Phase 1: Architecture Blueprint & Specifications (สถานะปัจจุบัน)**
  - จัดโครงสร้าง Repository
  - ออกแบบเอกสารสถาปัตยกรรมระบบทั้ง 6 ฉบับ
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
  - พัฒนาหน้า User Portal (Drag & Drop PDF, Print Settings, Live Price, QR Code, Status Tracker)
  - พัฒนาหน้า Admin Dashboard (จัดการถาดกระดาษ, ราคา, ประวัติคิวงาน)
- [ ] **Phase 5: Print Agent (Hardware Integration)**
  - พัฒนา Print Agent รันบน Windows
  - เชื่อมต่อ SumatraPDF CLI / Windows Spooler ควบคุมถาดและ Duplex
  - เชื่อมต่อ Socket.io รับงานและส่งสถานะเสร็จสิ้น
- [ ] **Phase 6: End-to-End Testing & Deployment**
  - ทดสอบทดลองพิมพ์จริงร่วมกับฮาร์ดแวร์
  - จัดทำ Packaging และ Script รันตู้แบบ Auto-start เมื่อเปิดเครื่อง
