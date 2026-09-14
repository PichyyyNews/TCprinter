# TCprinter - Frontend Web Application

เว็บแอปพลิเคชันส่วนติดต่อผู้ใช้ (Customer Portal) และแดชบอร์ดผู้ดูแลระบบ (Admin Dashboard) พัฒนาด้วย Next.js (App Router), Tailwind CSS, Lucide Icons, และ Socket.io Client

## ฟังก์ชันการทำงาน (Features)

### 1. Customer Portal (หน้าสำหรับลูกค้า)
* **Drag & Drop PDF Upload:** อัปโหลดไฟล์เอกสารและดูตัวอย่างหน้าแรก
* **Auto Page Counter:** แสดงจำนวนหน้าทั้งหมดของเอกสารโดยอัตโนมัติ
* **Live Print Configurator:** 
  - เลือกขนาดกระดาษ (A4, A3) โดยดึงเฉพาะถาดที่พร้อมใช้งานจริงจากระบบ
  - เลือกโหมดสี (ขาวดำ / สี)
  - เลือกรูปแบบหน้า-หลัง (หน้าเดียว / สองหน้าพลิกด้านยาว / สองหน้าพลิกด้านสั้น)
  - ระบุจำนวนชุด (Copies) และช่วงหน้า (Page Range)
* **Dynamic Price Calculator:** คำนวณยอดเงินรวมเศษสตางค์สดทันทีเมื่อเปลี่ยนตัวเลือก
* **PromptPay Dynamic QR:** แสดง QR Code พร้อมเพย์ที่ระบุยอดเงินตรงกับออร์เดอร์ พร้อมเวลานับถอยหลัง 15 นาที
* **Real-time Status Tracking:** แจ้งเตือนสถานะสดผ่าน WebSocket (รอชำระเงิน $\rightarrow$ ชำระเงินสำเร็จ $\rightarrow$ กำลังพิมพ์ $\rightarrow$ เสร็จสิ้น)
* **Slip Upload Fallback:** หน้าต่างอัปโหลดสลิปธนาคารกรณีระบบแจ้งเตือนอัตโนมัติล่าช้า

### 2. Admin Dashboard (หน้าสำหรับผู้ดูแลระบบ)
* **Tray Mapping & Status:** ตั้งค่าช่องถาดกระดาษ (Tray 1-3) กำหนดขนาดกระดาษ โหมดสี และสวิตช์เปิด/ปิดถาด
* **Queue Monitor:** ดูรายการคิวงานที่กำลังรอพิมพ์ และประวัติการพิมพ์ย้อนหลัง
* **Revenue & Paper Counter:** รายงานยอดเงินสะสมและปริมาณการใช้กระดาษ
