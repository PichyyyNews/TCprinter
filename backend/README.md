# TCprinter - Backend API Service

ระบบประมวลผลกลางและเซิร์ฟเวอร์ควบคุมคิวการพิมพ์ (Central API & Queue Orchestration) พัฒนาด้วย Node.js, Express, TypeScript, Prisma ORM, และ Socket.io

## ความรับผิดชอบหลัก (Core Responsibilities)
1. **File Engine:** รับไฟล์ PDF จากผู้ใช้, ตรวจสอบขนาดและนับจำนวนหน้าด้วย `pdf-parse`, จัดการพื้นที่เก็บชั่วคราว และลบไฟล์ทิ้งทันทีเมื่อพิมพ์เสร็จ
2. **Pricing & Satang Engine:** คำนวณราคาแบบ Real-time และสุ่มเศษสตางค์ (`.01` - `.99`) ที่ไม่ซ้ำกับคิวที่ค้างอยู่ใน 15 นาที เพื่อใช้แยกแยะยอดโอน
3. **Queue & Tray Logic:** บริหารคิวงานพิมพ์ในฐานข้อมูล (PostgreSQL / SQLite) และตรวจสอบความพร้อมของถาดกระดาษก่อนอนุญาตให้พิมพ์
4. **Hybrid Payment Processing:**
   - รับ Webhook แจ้งเตือนเงินเข้าจากเครื่อง Android
   - บริการตรวจสอบสลิปสำรองด้วย OCR (Tesseract.js)
5. **Real-time Event Broadcasting:** สื่อสารสถานะสดไปยัง Frontend และ Print Agent ผ่าน Socket.io

## โครงสร้างโฟลเดอร์ที่วางแผนไว้ (Planned Structure)
```text
backend/
├── src/
│   ├── controllers/      # Route controllers (jobs, payments, admin, agent)
│   ├── middlewares/      # Auth, file upload, error handling
│   ├── services/         # Business logic (pricing, satang, pdf, ocr, queue)
│   ├── sockets/          # Socket.io gateway & rooms handler
│   ├── lib/              # Prisma client, logger, utility functions
│   └── app.ts            # Express server initialization
├── prisma/
│   └── schema.prisma     # Database schema definition
├── uploads/              # Temporary uploads (auto cleaned)
├── tsconfig.json
└── package.json
```
