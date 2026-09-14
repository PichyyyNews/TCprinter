# คู่มือระบบการออกแบบ Kumo UI สำหรับ TCprinter (Cloudflare Design System Guide)

เอกสารนี้ระบุข้อกำหนดและแนวทางการพัฒนาส่วนติดต่อผู้ใช้ (Frontend Web Application) สำหรับระบบตู้พิมพ์อัตโนมัติ **TCprinter** โดยใช้ **Kumo UI Design System ของ Cloudflare** (`@cloudflare/kumo`, Base UI primitives, และ Phosphor Icons พร้อม `weight="thin"`) ครอบคลุมทั้งหน้า **Kiosk User Portal** และ **Admin Dashboard**

---

## 1. ข้อกำหนดหลัก (Core Principles)

### 1.1 ไอคอนและการแสดงผล (Iconography: Phosphor Icons with `weight="thin"`)
* **นำเข้าเฉพาะจาก `@phosphor-icons/react`:** ห้ามใช้ Lucide, FontAwesome, Heroicons หรือ SVG อื่นใด
* **บังคับ `weight="thin"` ทั้งหมด:** กำหนดค่าเริ่มต้นระดับ Root Application:
  ```tsx
  // frontend/src/app/layout.tsx
  import { IconContext } from "@phosphor-icons/react";

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="th">
        <body>
          <IconContext.Provider value={{ weight: "thin" }}>
            {children}
          </IconContext.Provider>
        </body>
      </html>
    );
  }
  ```
* **ห้ามใช้อีโมจิใน UI โดยเด็ดขาด (Zero Emojis):**
  - หลีกเลี่ยง: `🖨️ เครื่องพิมพ์`, `💰 ชำระเงิน`, `📄 เอกสาร`
  - ใช้แทนด้วย: `<Printer weight="thin" size={16} /> เครื่องพิมพ์`, `<CreditCard weight="thin" size={16} /> ชำระเงิน`, `<FilePdf weight="thin" size={16} /> เอกสาร`

---

## 2. กฎเหล็ก 15 ข้อของ Cloudflare Design Rules (พร้อมตัวอย่าง Good vs Avoid)

ทุก Component ใน TCprinter ต้องผ่านการตรวจสอบตามกฎ 15 ข้ออย่างเคร่งครัด:

### 1. `content-text-size` — เนื้อหาทั่วไปต้องมีขนาด 14px
ตัวหนังสือเนื้อหาทั้งหมด (Body, Button, Data, Inputs) ต้องมีขนาด 14px (`text-sm` หรือ Kumo `<Text>`) ขนาด 16px ขึ้นไปจำกัดไว้เฉพาะ Headings
* **Good:** `<Text>ยอดที่ต้องชำระ</Text>` หรือ `<span className="text-sm">...</span>`
* **Avoid:** `<Text size="lg">ยอดที่ต้องชำระ</Text>`

### 2. `heading-case` — หัวข้อต้องใช้ Sentence case
ห้ามใช้ Uppercase และห้ามขึ้นต้นตัวพิมพ์ใหญ่ทุกคำ
* **Good:** `<Text as="h2">Recent print jobs</Text>`
* **Avoid:** `<Text as="h2">Recent Print Jobs</Text>` หรือ `<Text as="h2" className="uppercase">Recent print jobs</Text>`

### 3. `font-tracking` — ห้ามปรับระยะห่างตัวอักษร (No `tracking-*`)
ห้ามใช้คลาส `tracking-tight`, `tracking-wide`
* **Good:** `<span className="text-lg">Print queue status</span>`
* **Avoid:** `<span className="text-lg tracking-tight">Print queue status</span>`

### 4. `font-weight` — ห้ามใช้ `font-bold` (700+)
ใช้ `font-semibold` สำหรับ Heading และ `font-medium` สำหรับตัวหนาในเนื้อหา
* **Good:** `<Text as="h3" variant="heading">Paper tray 1</Text>` หรือ `<span className="font-semibold">...</span>`
* **Avoid:** `<Text as="h3" className="font-bold">Paper tray 1</Text>`

### 5. `related-text-spacing` — ข้อความที่เกี่ยวข้องกันต้องอยู่ใกล้กัน
ช่องว่างระหว่าง Label และ Description ต้องแคบกว่าระยะห่างของ Element ถัดไป
* **Good:**
  ```tsx
  <div className="grid gap-6">
    <div className="grid gap-1.5">
      <Text as="h3" variant="heading">Double-sided printing</Text>
      <Text>Flip along long edge to save paper.</Text>
    </div>
    <Switch />
  </div>
  ```
* **Avoid:**
  ```tsx
  <div className="grid gap-4">
    <Text as="h3" variant="heading">Double-sided printing</Text>
    <Text>Flip along long edge to save paper.</Text>
    <Switch />
  </div>
  ```

### 6. `text-spacing` — ปรับช่องว่างรอบข้อความตาม Line-height
ระยะขอบแนวตั้ง (Vertical padding) ต้องแคบกว่าแนวนอน (Horizontal padding) เล็กน้อย
* **Good:** `<LayerCard className="px-5 py-4">...</LayerCard>`
* **Avoid:** `<LayerCard className="p-5">...</LayerCard>`

### 7. `hover-color-transitions` — ห้ามใส่ Transition กับสีเวลา Hover
การเปลี่ยนสีเมื่อนำเมาส์ไปชี้ต้องเกิดขึ้นทันที 0ms เพื่อความรู้สึกกระฉับกระเฉง
* **Good:** `<button className="hover:bg-kumo-tint">...</button>`
* **Avoid:** `<button className="transition-colors duration-300 hover:bg-kumo-tint">...</button>`

### 8. `shadow-borders` — ห้ามใช้ Border ร่วมกับ Drop Shadow
ให้ใช้ `ring ring-kumo-line` เพื่อรักษาเส้นขอบที่คมชัด
* **Good:** `<LayerCard className="shadow-md ring ring-kumo-line">...</LayerCard>`
* **Avoid:** `<LayerCard className="border border-kumo-line shadow-md">...</LayerCard>`

### 9. `concentric-border-radius` — รัศมีขอบมนซ้อนกันต้องสอดคล้องตามคณิตศาสตร์
เมื่อกรอบอยู่ห่างกัน 8px หรือน้อยกว่า: Outer Radius = Inner Radius + Padding
* **Good:** `<div className="rounded-xl p-1"><div className="rounded-lg">...</div></div>`
* **Avoid:** `<div className="rounded-xl p-1"><div className="rounded-xl">...</div></div>`

### 10. `icon-alignment` — จัดไอคอนให้อยู่กึ่งกลางสายตากับบรรทัดแรกเสมอ
ใช้ `h-lh flex items-center` เมื่อไอคอนอยู่หน้าข้อความหลายบรรทัด
* **Good:**
  ```tsx
  <div className="flex items-start gap-2">
    <span className="h-lh flex items-center">
      <Warning weight="thin" size={14} />
    </span>
    <Text>Tray 2 paper is low, please refill soon.</Text>
  </div>
  ```
* **Avoid:** `<div className="flex items-center gap-2"><Warning /><Text>...</Text></div>`

### 11. `inline-monospace-size` — ตัวหนังสือ Monospace ในประโยคต้องลดขนาดลง
ใช้ขนาดประมาณ 0.9em (`text-[0.9em]`) เมื่อเขียนรหัสคำสั่งหรือเลขอ้างอิงในประโยค
* **Good:** `<Text>Your order code is <span className="font-mono text-[0.9em]">TCP-260914-042</span></Text>`
* **Avoid:** `<Text>Your order code is <span className="font-mono">TCP-260914-042</span></Text>`

### 12. `sticky-borders` — แถบที่ Sticky ต้องมีเส้นขอบกั้นชัดเจน
* **Good:** `<div className="sticky top-0 border-b border-kumo-line">...</div>`
* **Avoid:** `<div className="sticky top-0">...</div>`

### 13. `collapse-content-size` — เมนูย่อขยายต้องล็อกความกว้างเนื้อหาไว้
* **Good:** `<motion.div animate={{ width: open ? 256 : 0 }}><div className="w-64">...</div></motion.div>`
* **Avoid:** `<motion.div animate={{ width: open ? 256 : 0 }}><div className="w-full min-w-0">...</div></motion.div>`

### 14. `layer-card-nesting` — ห้ามวาง LayerCard ซ้อนกัน
ห้ามวาง `<LayerCard>` ไว้ข้างใน `<LayerCard>` อีกใบ ให้ใช้ Divider หรือ Table แทน
* **Good:** `<div><Text as="h3">Tray settings</Text><LayerCard>...</LayerCard></div>`
* **Avoid:** `<LayerCard><Text as="h3">Tray settings</Text><LayerCard>...</LayerCard></LayerCard>`

### 15. `dialog-rendering` — ห้ามทำ Conditional Rendering กับ Dialog
ห้ามใช้ `{open && <Dialog.Root>}` ให้ใช้ Prop `open={open}` เพื่อให้อนิเมชันเปิด-ปิดเล่นได้อย่างราบรื่น
* **Good:** `<Dialog.Root open={open} onOpenChange={setOpen}>...</Dialog.Root>`
* **Avoid:** `{open && <Dialog.Root open>...</Dialog.Root>}`

---

## 3. การใช้งาน Canonical 41 Components ใน TCprinter

| ส่วนงาน | หน้าจอ | Kumo Component | หน้าที่และการใช้งาน |
|---|---|---|---|
| **กล่องอัปโหลด PDF** | Kiosk Portal | `<LayerCard>`, `<Text>`, `<Button>` | พื้นผิวการ์ดลากไฟล์มาวาง พร้อมไอคอน `<UploadSimple weight="thin" size={24} />` |
| **แสดงจำนวนหน้า** | Kiosk Portal | `<Badge variant="neutral">` | ป้ายระบุจำนวนหน้าเอกสารที่นับได้จากระบบ |
| **เลือกการพิมพ์** | Kiosk Portal | `<Radio.Group>`, `<Select>`, `<Switch>` | เลือกขนาดกระดาษ, โหมดสี, หน้า-หลัง |
| **ป้ายราคาสรุป** | Kiosk Portal | `<LayerCard>`, `<Text>` | แสดงราคารวมพร้อมเศษสตางค์ (Dynamic Pricing) |
| **ป๊อปอัป PromptPay** | Kiosk Portal | `<Dialog.Root>`, `<ClipboardText>` | แสดง QR Code พร้อมปุ่มก็อปปี้เลขพร้อมเพย์ |
| **หลอดแสดงสถานะ** | Kiosk Portal | `<Flow>`, `<Loader>`, `<Badge>` | แสดงขั้นตอนเรียลไทม์ (รอจ่าย $\rightarrow$ กำลังพิมพ์ $\rightarrow$ เสร็จสิ้น) |
| **ป๊อปอัปสลิปสำรอง** | Kiosk Portal | `<Dialog.Root>`, `<Input>`, `<Button>` | ป๊อปอัปสำหรับอัปโหลดภาพสลิป |
| **แถบข้างแอดมิน** | Admin | `<Sidebar>` | เมนูนำทาง: ถาดกระดาษ, คิวงาน, การเงิน |
| **ควบคุมถาดกระดาษ** | Admin | `<LayerCard>`, `<Switch>`, `<Meter>` | เปิด/ปิดถาดกระดาษทันที และเกจแสดงปริมาณกระดาษคงเหลือ |
| **ตารางคิวงาน** | Admin | `<Table>`, `<Toolbar>`, `<Badge>` | ตารางแสดงรายการพิมพ์สด มีช่องค้นหาและตัวกรอง |

---

## 4. โทนสีและ Semantic Tokens (`tailwind.config.js`)

ระบบจะผูก Semantic Tokens เข้ากับ Tailwind CSS เพื่อป้องกันการใช้สีดิบ:

```javascript
// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        kumo: {
          canvas: 'var(--kumo-canvas, #0a0a0a)',
          base: 'var(--kumo-base, #141414)',
          elevated: 'var(--kumo-elevated, #1c1c1c)',
          recessed: 'var(--kumo-recessed, #0f0f0f)',
          control: 'var(--kumo-control, #242424)',
          tint: 'var(--kumo-tint, rgba(255, 255, 255, 0.06))',
          default: 'var(--kumo-default, #f3f3f3)',
          subtle: 'var(--kumo-subtle, #888888)',
          strong: 'var(--kumo-strong, #ffffff)',
          line: 'var(--kumo-line, #2a2a2a)',
          hairline: 'var(--kumo-hairline, #1f1f1f)',
          brand: 'var(--kumo-brand, #F6821F)', // Cloudflare Orange
          success: 'var(--kumo-success, #10b981)',
          warning: 'var(--kumo-warning, #f59e0b)',
          critical: 'var(--kumo-critical, #ef4444)',
        },
      },
    },
  },
  plugins: [],
};
```
