/* ==========================================
   admin-config.js (Django Integrated Version)
   ควบคุม UI และ Event Handlers สำหรับหน้า Config
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Bind Events: ปุ่มสวิตช์สถานะห้อง (Lab Status)
    const switchEl = document.getElementById('labStatusSwitch');
    if (switchEl) {
        // เรียกทำงานทันทีเพื่อเช็คสถานะเริ่มต้น
        toggleLabStatusUI();
        // ผูก Event เมื่อมีการกดเปลี่ยน
        switchEl.addEventListener('change', toggleLabStatusUI);
    }

    // 2. Initialize Bootstrap Toasts (แจ้งเตือน Message จาก Django)
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    const toastList = toastElList.map(function (toastEl) {
        return new bootstrap.Toast(toastEl, { delay: 5000 }); 
    });
    toastList.forEach(toast => toast.show());
});

/* ==========================================
   CORE FUNCTIONS
   ========================================== */

/**
 * จัดการ UI ของสวิตช์เปิด-ปิดห้อง
 * (เปลี่ยนข้อความและสี โดยไม่ต้องรีเฟรชหน้า)
 */
function toggleLabStatusUI() {
    const switchEl = document.getElementById('labStatusSwitch');
    const labelEl = document.getElementById('labStatusLabel');
    const msgInput = document.getElementById('adminMessage'); // ถ้ามี input ข้อความปิดห้อง
    
    if (switchEl && labelEl) {
        if (switchEl.checked) {
            labelEl.innerText = 'เปิดให้บริการ (Open)';
            labelEl.className = 'form-check-label fw-bold text-success';
            // if(msgInput) msgInput.disabled = true; // (Optional: ปิดช่องกรอกข้อความถ้าเปิดห้อง)
        } else {
            labelEl.innerText = 'ปิดให้บริการ (Closed)';
            labelEl.className = 'form-check-label fw-bold text-danger';
            // if(msgInput) msgInput.disabled = false;
        }
    }
}

/**
 * รีเซ็ตฟอร์มสำหรับ "เพิ่มผู้ดูแลใหม่"
 * เรียกเมื่อกดปุ่ม "+ เพิ่มผู้ดูแล"
 */
function resetAdminForm() {
    const form = document.getElementById('adminForm');
    if (form) form.reset();

    // ล้างค่า ID และเปลี่ยนโหมดเป็น 'create'
    document.getElementById('adminId').value = '';
    document.getElementById('formAction').value = 'create';
    
    // เปลี่ยนหัวข้อ Modal
    const modalTitle = document.querySelector('#adminModal .modal-title');
    if(modalTitle) modalTitle.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>เพิ่มผู้ดูแลระบบ';

    // Username: เปิดให้แก้ได้
    const userInput = document.getElementById('adminUser');
    if(userInput) {
        userInput.readOnly = false;
        userInput.value = '';
    }

    // Password: ต้องกรอก
    const passInput = document.getElementById('adminPass');
    if(passInput) {
        passInput.value = '';
        passInput.required = true;
        passInput.type = 'password'; // รีเซ็ตกลับเป็นจุดๆ
    }
    
    // รีเซ็ตไอคอนลูกตาใน Modal
    const icon = document.getElementById('togglePasswordIcon');
    if(icon) {
        icon.classList.remove('bi-eye');
        icon.classList.add('bi-eye-slash');
    }
}

/**
 * เติมข้อมูลลงฟอร์มสำหรับ "แก้ไขผู้ดูแล"
 * @param {string} id - User ID
 * @param {string} fullName - ชื่อจริง
 * @param {string} username - ชื่อผู้ใช้
 * @param {string} role - (Super Admin / Staff)
 */
function editAdmin(id, fullName, username, role) {
    // ใส่ค่าลงใน Input
    document.getElementById('adminId').value = id;
    document.getElementById('adminName').value = fullName;
    document.getElementById('adminUser').value = username;
    
    const roleSelect = document.getElementById('adminRole');
    if(roleSelect) roleSelect.value = role;

    // เปลี่ยนโหมดเป็น 'update'
    document.getElementById('formAction').value = 'update';
    document.getElementById('adminModalLabel').innerHTML = '<i class="bi bi-pencil-square me-2"></i>แก้ไขข้อมูลผู้ดูแล';

    // Username ห้ามแก้
    const userInput = document.getElementById('adminUser');
    if(userInput) userInput.readOnly = true;

    // Password ไม่บังคับกรอก (เว้นว่าง = ไม่เปลี่ยน)
    const passInput = document.getElementById('adminPass');
    if(passInput) {
        passInput.value = ''; 
        passInput.required = false;
        passInput.type = 'password';
    }

    // เปิด Modal
    const modalEl = document.getElementById('adminModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

/**
 * ยืนยันการลบผู้ดูแล
 * (ส่งค่า ID ไปยัง Hidden Form แล้ว Submit ให้ Django ลบ)
 */
function deleteAdmin(id) {
    if (confirm('⚠️ คำเตือน: คุณแน่ใจหรือไม่ที่จะลบผู้ดูแลระบบคนนี้?\nการกระทำนี้ไม่สามารถย้อนกลับได้')) {
        document.getElementById('deleteUserId').value = id;
        document.getElementById('deleteAdminForm').submit();
    }
}

/* ==========================================
   PASSWORD TOGGLE FUNCTIONS
   ========================================== */

/**
 * 1. เปิด/ปิดตา ใน Modal (ฟอร์มเพิ่ม/แก้ไข)
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('adminPass');
    const icon = document.getElementById('togglePasswordIcon');
    
    if (passwordInput && icon) {
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        }
    }
}

/**
 * 2. เปิด/ปิดตา ในตารางรายชื่อ (Table)
 * @param {string} adminId - ID ของ user เพื่อระบุแถวที่ถูกต้อง
 */
function toggleTablePassword(adminId) {
    // อ้างอิง ID ที่เราตั้งไว้ใน HTML: tablePass-1, tableIcon-1
    const input = document.getElementById(`tablePass-${adminId}`);
    const icon = document.getElementById(`tableIcon-${adminId}`);

    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('bi-eye-slash');
            icon.classList.add('bi-eye');
        } else {
            input.type = 'password';
            icon.classList.remove('bi-eye');
            icon.classList.add('bi-eye-slash');
        }
    }
}