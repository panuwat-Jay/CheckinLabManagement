# 🖥️ CKLab Management System

ระบบบริหารจัดการห้องปฏิบัติการคอมพิวเตอร์ พัฒนาด้วย **Django Framework** โดยเน้นประสิทธิภาพและความปลอดภัย รองรับการใช้งานทั้งฝั่งผู้ใช้ (Kiosk) และผู้ดูแลระบบ (Admin Portal) — ใช้ **Class-Based Views (CBV)** เป็นหลัก

---

## 🛠️ Tech Stack & Frameworks

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Language** | ![Python](https://img.shields.io/badge/Python-3.10+-blue) | Backend Logic |
| **Framework** | ![Django](https://img.shields.io/badge/Django-5.0-green) | MVT Web Framework |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791) | Relational Database (via Docker) |
| **Frontend** | ![Bootstrap](https://img.shields.io/badge/Bootstrap-5-purple) | Responsive UI |
| **Package Manager** | ![uv](https://img.shields.io/badge/uv-Astral-pink) | Fast Python package installer |

---

## 👥 ตารางแบ่งหน้าที่ (Route Responsibility)

> **ข้อกำหนด:** สมาชิกทุกคนในทีมดูแล Code และ Logic อย่างน้อย **2 Routes**

| ผู้รับผิดชอบ (Member) | หน้าที่หลัก (Role) | Routes ที่ดูแล | View Class (CBV) | Model ที่ดูแล |
| :--- | :--- | :--- | :--- | :--- |
| **1. ปภังกร** | **User / Kiosk System** | `path('', ...)`<br>`path('confirm/', ...)`<br>`path('timer/', ...)`<br>`path('feedback/', ...)` | `IndexView`<br>`ConfirmView`<br>`TimerView`<br>`FeedbackView` | — |
| **2. สถาพร** | **Admin Auth** | `path('admin-portal/login/', ...)`<br>`path('admin-portal/logout/', ...)` | Django built-in `LoginView` / `LogoutView` | — |
| **3. ธนสิทธิ์** | **Admin Monitor** | `path('admin-portal/monitor/', ...)`<br>`path('api/monitor-data/', ...)` (API) | `AdminMonitorView`<br>`ApiMonitorDataView` | `Computer` |
| **4. อัษฎาวุธ** | **Booking** | `path('admin-portal/booking/', ...)` | `AdminBookingView`<br>`AdminImportBookingView` | `Booking` |
| **5. ณัฐกรณ์** | **PC Manage** | `path('admin-portal/manage-pc/', ...)` | `AdminManagePcView` | `Status` |
| **6. ลลิดา** | **Software** | `path('admin-portal/software/', ...)` | `AdminSoftwareView` | `Software` |
| **7. เขมมิกา** | **Report** | `path('admin-portal/report/', ...)`<br>`path('admin-portal/report/export/', ...)` (Export CSV) | `AdminReportView`<br>`AdminReportExportView` | `UsageLog` |
| **8. ภานุวัฒน์** | **Config** | `path('admin-portal/config/', ...)` | `AdminConfigView` (GET + POST) | `SiteConfig` |

---

## ⚙️ คู่มือการติดตั้งและพัฒนา (Development Setup)

โปรเจกต์นี้ใช้ **uv** เป็น Package Manager เพื่อความรวดเร็ว

### 1. Prerequisites (สิ่งที่ต้องมี)
* Python 3.10 ขึ้นไป
* Docker Desktop (สำหรับรัน Database)
* uv (`winget install astral-sh.uv`)

### 2. ติดตั้ง Environment และ Libraries
```powershell
# สร้าง Virtual Environment
uv venv

# เปิดใช้งาน Environment
.\.venv\Scripts\activate

# ติดตั้ง Django และ Library ที่จำเป็น
uv pip install django psycopg2-binary python-dotenv
```

### 3. เริ่มต้นระบบ (Run Project)
```powershell
# 1. รัน Database
docker compose up -d

# 2. สร้างตารางใน Database
python manage.py makemigrations
python manage.py migrate

# 3. สร้าง Superuser (สำหรับเข้า Django Admin)
python manage.py createsuperuser

# 4. รัน Server
python manage.py runserver
