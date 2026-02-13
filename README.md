import os

# รายการไฟล์และเนื้อหาที่จะบันทึก
files = {
    # ==========================
    # 0. System & Database Config
    # ==========================
    "docker-compose.yml": r"""
version: '3.8'
services:
  db:
    image: postgres:15
    container_name: cklab_postgres
    restart: always
    environment:
      POSTGRES_DB: cklab_db
      POSTGRES_USER: cklab_admin
      POSTGRES_PASSWORD: secretpassword
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
""",

    "cklab_project/settings.py": r"""
from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'django-insecure-setup-key'
DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'lab_management',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'cklab_project.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'lab_management/templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'cklab_project.wsgi.application'

# Database Connection
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'cklab_db',
        'USER': 'cklab_admin',
        'PASSWORD': 'secretpassword',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
]

LANGUAGE_CODE = 'th-th'
TIME_ZONE = 'Asia/Bangkok'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATICFILES_DIRS = [BASE_DIR / "lab_management/static"]
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

LOGIN_URL = '/admin-portal/login/'
LOGIN_REDIRECT_URL = '/admin-portal/monitor/'
LOGOUT_REDIRECT_URL = '/admin-portal/login/'
""",

    # ==========================
    # 1. Documentation (README.md) - Updated Routes & Install Guide
    # ==========================
    "README.md": r"""
# 🖥️ CKLab Management System

ระบบบริหารจัดการห้องปฏิบัติการคอมพิวเตอร์ พัฒนาด้วย **Django Framework** โดยเน้นประสิทธิภาพและความปลอดภัย รองรับการใช้งานทั้งฝั่งผู้ใช้ (Kiosk) และผู้ดูแลระบบ (Admin Portal)

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

| ผู้รับผิดชอบ (Member) | หน้าที่หลัก (Role) | Routes ที่ดูแล |
| :--- | :--- | :--- |
| **1. ปภังกร** | **User / Kiosk System** | `path('', views.index)`<br>`path('confirm/', ...)`<br>`path('timer/', ...)`<br>`path('feedback/', ...)` |
| **2. สถาพร** | **Admin Auth** | `path('admin-portal/login/', ...)`<br>`path('admin-portal/logout/', ...)` |
| **3. ธนสิทธิ์** | **Admin Monitor** | `path('admin-portal/monitor/', ...)`<br>`path('api/monitor-data/', ...)` (API) |
| **4. อัษฎาวุธ** | **Booking** | `path('admin-portal/booking/', ...)`<br>`path('admin-portal/booking/history/', ...)` (ประวัติการจอง) |
| **5. ณัฐกรณ์** | **PC Manage** | `path('admin-portal/manage-pc/', ...)`<br>`path('admin-portal/manage-pc/actions/', ...)` (จัดการสถานะ) |
| **6. ลลิดา** | **Software** | `path('admin-portal/software/', ...)`<br>`path('admin-portal/software/ai-tools/', ...)` (จัดการ AI) |
| **7. เขมมิกา** | **Report** | `path('admin-portal/report/', ...)`<br>`path('admin-portal/report/export/', ...)` (Export CSV) |
| **8. ภานุวัฒน์** | **Config** | `path('admin-portal/config/', ...)`<br>`path('admin-portal/config/logs/', ...)` (ดู Log ระบบ) |

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