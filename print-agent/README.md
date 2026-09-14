# TCprinter - Print Agent Service

บริการควบคุมเครื่องพิมพ์ประจำตู้ (Hardware Print Service) ทำงานเบื้องหลังบนเครื่องคอมพิวเตอร์ที่เชื่อมต่อสายสัญญาณกับเครื่องพิมพ์จริง (USB / Local LAN)

## การทำงานของ Agent
1. รันเบื้องหลังและเชื่อมต่อ WebSocket กับ Backend ตลอดเวลา
2. รับคำสั่งงานพิมพ์ที่มีสถานะ `PAID` พร้อมพารามิเตอร์การตั้งค่า (ถาดกระดาษ, โหมดสี, พิมพ์สองหน้า)
3. สั่งพิมพ์แบบ Silent Print ผ่าน Command-line โดยใช้ **SumatraPDF** (บน Windows) หรือ **CUPS `lp`** (บน Linux)
4. รายงานสถานะความคืบหน้ากลับไปยัง Backend (`PRINTING` $\rightarrow$ `COMPLETED` หรือ `FAILED`)
5. ลบไฟล์เอกสารชั่วคราวทิ้งทันทีที่พิมพ์เสร็จ

## แผนการพัฒนา (Planned Tech Stack)
* **ภาษาหลัก:** Node.js หรือ Python 3.10+
* **Windows Driver Engine:** `SumatraPDF.exe` (CLI Headless) หรือ `win32print`
* **Network Client:** Socket.io Client + Axios
