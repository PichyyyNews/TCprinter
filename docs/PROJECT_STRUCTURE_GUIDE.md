# คู่มือการจัดระเบียบโครงสร้างโค้ดแบบแยกส่วน (Modular Clean Architecture Guide)

เอกสารนี้กำหนดมาตรฐานการจัดวางไฟล์และโฟลเดอร์สำหรับโปรเจกต์ **TCprinter** โดยยึดหลักการ **"แยกความรับผิดชอบอย่างชัดเจน ห้ามรวมโค้ดเป็นไฟล์ใหญ่ก้อนเดียว (Strict Modular Separation & No Monolithic Files)"** เพื่อให้โค้ดอ่านง่าย ตรวจสอบง่าย ดูแลง่าย และขยายระบบได้อย่างมีประสิทธิภาพ

---

## 1. กฎเหล็กในการเขียนโค้ด (Core Engineering Principles)

1. **ห้ามสร้างไฟล์รวมมิตร (No Monolithic Fat Files):**
   - ไฟล์หนึ่งไฟล์ต้องทำหน้าที่เพียงเรื่องเดียว (Single Responsibility Principle)
   - ความยาวของไฟล์ไม่ควรเกิน **150 - 200 บรรทัด** หากไฟล์เริ่มยาวเกินไป ให้พิจารณาแยก Sub-component หรือ Helper Module ออกมาทันที
2. **ห้ามปน Business Logic ไว้ใน Controller หรือ Route:**
   - `routes/` ทำหน้าที่ประกาศ URL Endpoint และแนบ Middleware เท่านั้น
   - `controllers/` ทำหน้าที่รับ Input, เรียก Service, และส่ง HTTP Status Code กลับเท่านั้น (ห้ามเขียนคำนวณราคาหรือรัน SQL ใน Controller)
   - `services/` ทำหน้าที่คำนวณ Business Logic ล้วนๆ ไม่ยึดติดกับ Express `req` หรือ `res`
3. **แยก Component หน้าบ้านให้เป็นอิสระ (Atomic & Composable UI):**
   - หน้า Kiosk แต่ละขั้นตอน (การอัปโหลด, พรีวิว, ฟอร์มเลือกถาด, ป๊อปอัป QR, หลอดสถานะ) ต้องแยกเป็น Component เดี่ยวในโฟลเดอร์ของตนเอง

---

## 2. โครงสร้างโฟลเดอร์ฝั่ง Backend (`backend/src/`)

```text
backend/src/
├── config/                         # การตั้งค่าระบบ
│   ├── env.config.ts               # โหลดและ Validate .env ด้วย Zod
│   ├── redis.config.ts             # เชื่อมต่อ Redis Client
│   └── constants.ts                # ค่าคงที่ (TTL 900s, ขนาดไฟล์สูงสุด 50MB)
│
├── routes/                         # ประกาศ URL Endpoints แยกตามโมดูล
│   ├── index.ts                    # รวบรวม Sub-routers ทั้งหมดเข้าสู่ /api/v1
│   ├── job.routes.ts               # เส้นทาง /jobs (quote, create, :id/status)
│   ├── payment.routes.ts           # เส้นทาง /payments (webhook, verify-slip)
│   ├── admin.routes.ts             # เส้นทาง /admin (trays, pricing, history)
│   └── agent.routes.ts             # เส้นทาง /agent (:id/download, complete, error)
│
├── controllers/                    # ควบคุม Request / Response แยกตามโมดูล
│   ├── job.controller.ts           # จัดการ HTTP สำหรับงานพิมพ์
│   ├── payment.controller.ts       # จัดการ HTTP สำหรับ Webhook และสลิป
│   ├── admin.controller.ts         # จัดการ HTTP สำหรับหน้าแอดมิน
│   └── agent.controller.ts         # จัดการ HTTP สำหรับ Print Agent
│
├── services/                       # Business Logic (ฟังก์ชันบริสุทธิ์ ทดสอบง่าย)
│   ├── pdf.service.ts              # วิเคราะห์และนับจำนวนหน้า PDF (pdf-parse)
│   ├── pricing.service.ts          # คำนวณราคาตามตาราง Pricing Rule
│   ├── satang.service.ts           # อัลกอริทึมจัดสรรเศษสตางค์ .01 - .99 (Redis)
│   ├── promptpay.service.ts        # คำนวณและสร้าง EMVCo QR Code Payload
│   ├── webhook.service.ts          # ตรวจสอบและ Match ยอดเงินจาก Android Notification
│   ├── ocr.service.ts              # ประมวลผลภาพและแกะข้อความสลิป (Tesseract.js)
│   ├── anti-replay.service.ts      # คำนวณ SHA-256 ป้องกันการใช้สลิปซ้ำ
│   └── queue.service.ts            # ตรวจสอบสถานะและบริหารคิวงานพิมพ์
│
├── sockets/                        # จัดการ Real-time WebSocket (Socket.io)
│   ├── index.ts                    # ตั้งค่า Socket.io Server และ Auth Middleware
│   ├── user.handler.ts             # จัดการ Events ของผู้ใช้ทั่วไป (job rooms)
│   ├── admin.handler.ts            # จัดการ Events ของแอดมิน (live stats)
│   └── agent.handler.ts            # จัดการ Events ของ Print Agent (job dispatch)
│
├── jobs/                           # Background Tasks & Cron Jobs
│   ├── cleanup.cron.ts             # กวาดลบไฟล์ PDF ชั่วคราวที่หมดอายุ
│   └── timeout.cron.ts             # ปลดล็อกคิวและคืนเศษสตางค์เมื่อเกิน 15 นาที
│
├── middlewares/                    # ฟิลเตอร์คัดกรองคำขอ
│   ├── upload.middleware.ts        # Multer จัดการอัปโหลดไฟล์ PDF ปลอดภัย
│   ├── auth.middleware.ts          # ตรวจสอบ API Key / Admin Session
│   ├── webhook-auth.middleware.ts  # ตรวจสอบ Secret Token ของ Android Webhook
│   └── error.middleware.ts         # ดักจับ Error รวมและส่ง Format JSON มาตรฐาน
│
├── schemas/                        # Zod Validation Schemas (ตรวจ Input ป้องกัน Injection)
│   ├── job.schema.ts               # ตรวจสอบข้อมูลสร้างคำสั่งพิมพ์
│   ├── payment.schema.ts           # ตรวจสอบข้อมูล Webhook และสลิป
│   └── admin.schema.ts             # ตรวจสอบข้อมูลการแก้ไขถาดและราคา
│
├── types/                          # นิยาม Interface & Enum
│   ├── job.types.ts
│   ├── payment.types.ts
│   ├── tray.types.ts
│   └── socket.types.ts
│
├── lib/                            # ตัวเชื่อมต่อ Singleton ภายนอก
│   ├── prisma.ts                   # Instance ของ Prisma Client
│   └── logger.ts                   # ระบบบันทึก Log (Winston / Pino)
│
└── app.ts                          # รวม Express และ Socket.io (< 60 บรรทัด)
```

---

## 3. โครงสร้างโฟลเดอร์ฝั่ง Frontend (`frontend/src/`)

```text
frontend/src/
├── app/                            # Next.js App Router (หน้าเว็บ)
│   ├── layout.tsx                  # Root Layout (ธีม, ฟอนต์, Global Providers)
│   ├── page.tsx                    # หน้า Kiosk หลักสำหรับผู้ใช้งาน
│   ├── admin/                      # เส้นทางแดชบอร์ดผู้ดูแลระบบ
│   │   ├── page.tsx                # ภาพรวมสถิติและยอดเงิน
│   │   ├── trays/page.tsx          # จัดการถาดกระดาษ (Tray Mapping)
│   │   └── jobs/page.tsx           # ดูคิวงานสดและประวัติย้อนหลัง
│   └── globals.css                 # สไตล์ชีตและ Tailwind CSS
│
├── components/                     # ชิ้นส่วน UI แยกย่อยอย่างเป็นระเบียบ
│   ├── ui/                         # UI Primitives พื้นฐาน (ปุ่ม, โมดอล, การ์ด)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── modal.tsx
│   │   ├── badge.tsx
│   │   ├── spinner.tsx
│   │   └── progress-bar.tsx
│   │
│   ├── kiosk/                      # Components เฉพาะของหน้าตู้พิมพ์ (แยก 1 ขั้นตอนต่อ 1 ไฟล์)
│   │   ├── FileUploadZone.tsx      # กล่องลากไฟล์ PDF มาวาง (Drag & Drop)
│   │   ├── PdfPreviewCard.tsx      # การ์ดแสดงภาพพรีวิวหน้าแรก + จำนวนหน้า
│   │   ├── PrintConfigForm.tsx     # ฟอร์มเลือกขนาดกระดาษ, สี, หน้า-หลัง, จำนวนชุด
│   │   ├── PriceSummaryCard.tsx    # การ์ดแสดงราคาสรุปแบบ Dynamic
│   │   ├── PromptPayModal.tsx      # ป๊อปอัป QR พร้อมเพย์ + ตัวนับถอยหลัง 15 นาที
│   │   ├── StatusTracker.tsx       # ไทม์ไลน์สถานะ Real-time (รอจ่าย -> กำลังพิมพ์ -> สำเร็จ)
│   │   └── SlipUploadModal.tsx     # ป๊อปอัปอัปโหลดสลิปสำรอง
│   │
│   └── admin/                      # Components เฉพาะของหน้าแอดมิน
│       ├── TrayControlCard.tsx     # การ์ดตั้งค่าถาดกระดาษแต่ละช่อง
│       ├── PricingEditModal.tsx    # ป๊อปอัปแก้ไขราคาต่อหน้า
│       └── LiveQueueTable.tsx      # ตารางคิวงานสดพร้อมปุ่มยกเลิก/พิมพ์ซ้ำ
│
├── hooks/                          # Custom React Hooks
│   ├── useSocket.ts                # จัดการการเชื่อมต่อและรับ Event จาก Socket.io
│   ├── useKioskJob.ts              # ควบคุม State Flow ของงานพิมพ์ตั้งแต่ต้นจนจบ
│   └── usePriceCalculator.ts       # คำนวณราคาแบบเรียลไทม์ฝั่งเบราว์เซอร์
│
├── stores/                         # State Management (Zustand)
│   ├── kioskStore.ts               # เก็บ State งานพิมพ์ปัจจุบันของหน้าตู้
│   └── adminStore.ts               # เก็บ State ข้อมูลถาดและคิวงานของแอดมิน
│
├── services/                       # ฟังก์ชันยิง API เชื่อมต่อ Backend
│   ├── apiClient.ts                # Axios Client Instance พร้อม Error Interceptor
│   ├── jobService.ts               # ฟังก์ชัน uploadPdf, createJob, getJobStatus
│   ├── paymentService.ts           # ฟังก์ชัน verifySlip
│   └── adminService.ts             # ฟังก์ชัน getTrays, updateTray, getJobs
│
├── types/                          # นิยาม Interface ฝั่ง Frontend
│   ├── kiosk.ts
│   └── admin.ts
│
└── lib/                            # ฟังก์ชันช่วยเหลือทั่วไป
    ├── formatters.ts               # ฟอร์แมตเงินบาท (เช่น "25.43 ฿"), ฟอร์แมตเวลา
    └── cn.ts                       # ฟังก์ชันรวมคลาส Tailwind (clsx + tailwind-merge)
```

---

## 4. โครงสร้างโฟลเดอร์ฝั่ง Print Agent (`print-agent/src/`)

```text
print-agent/src/
├── config/
│   └── agent.config.ts             # ค่าคงที่ (Printer Name, Server URL, Agent Secret)
│
├── drivers/                        # Adapter ควบคุมคำสั่งพิมพ์แยกตามแพลตฟอร์ม
│   ├── base.driver.ts              # Abstract Interface ที่ทุก Driver ต้องปฏิบัติตาม
│   ├── sumatra.driver.ts           # Driver สำหรับ Windows สั่งผ่าน SumatraPDF.exe
│   ├── win32.driver.ts             # Driver สำหรับ Windows สั่งผ่าน Win32 Spooler API
│   └── cups.driver.ts              # Driver สำหรับ Linux สั่งผ่านคำสั่ง lp / CUPS
│
├── services/
│   ├── monitor.service.ts          # ตรวจเช็คสถานะฮาร์ดแวร์เครื่องพิมพ์ (Offline, Paper Jam)
│   ├── downloader.service.ts       # ดาวน์โหลด PDF มายังโฟลเดอร์แคชชั่วคราว
│   └── executor.service.ts         # บริหารคิวสั่งพิมพ์และจับเวลาการทำงาน
│
├── client/
│   └── socket.client.ts            # Client เชื่อมต่อ WebSocket กับเซิร์ฟเวอร์กลาง
│
├── types/
│   └── driver.types.ts             # กำหนด Type พารามิเตอร์การพิมพ์
│
└── index.ts                        # Entry Point ขนาดสั้นสำหรับเริ่มต้นบริการ (< 50 บรรทัด)
```

---

## 5. สรุปประโยชน์ของโครงสร้างแบบนี้

1. **ค้นหาและแก้ไขโค้ดได้รวดเร็ว:** เมื่อต้องการแก้เรื่องราคา ให้ไปที่ `services/pricing.service.ts` เมื่อต้องการแก้ UI สลิป ให้ไปที่ `components/kiosk/SlipUploadModal.tsx`
2. **ไม่มีโค้ดตีกัน (Merge Conflict ต่ำ):** การแยกไฟล์ย่อยทำให้เมื่อทีมงานหรือ Agent ทำงานพร้อมกัน จะไม่เกิดการแก้ไขไฟล์เดียวกันซ้ำซ้อน
3. **ทดสอบ Unit Test ได้ง่าย 100%:** เพราะ Service แต่ละตัวเป็น Pure Function ที่ไม่มี Dependency ผูกติดกับ Express หรือ Next.js
