/* ==========================================
   admin-config.js (Django Adapted Version)
   ใช้สำหรับควบคุม UI ของหน้า Config (ไม่ยุ่งกับ Database)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. จัดการ Lab Status Toggle UI (เปลี่ยนข้อความ/สี เมื่อกดสวิตช์)
    const labSwitch = document.getElementById('labStatusSwitch');
    const labLabel = document.getElementById('labStatusLabel');

    if (labSwitch && labLabel) {
        labSwitch.addEventListener('change', function() {
            if (this.checked) {
                labLabel.textContent = "เปิดให้บริการ (Open)";
                labLabel.classList.remove('text-danger');
                labLabel.classList.add('text-success');
            } else {
                labLabel.textContent = "ปิดให้บริการ (Closed)";
                labLabel.classList.remove('text-success');
                labLabel.classList.add('text-danger');
            }
        });
    }

    // 2. Initialize Bootstrap Toasts (แจ้งเตือน Message จาก Django)
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    const toastList = toastElList.map(function (toastEl) {
        // แสดง Toast 5 วินาทีแล้วให้หายไปเอง
        return new bootstrap.Toast(toastEl, { delay: 5000 }); 
    });
    toastList.forEach(toast => toast.show());

});

/* ==========================================
   Global Functions (เรียกใช้ผ่าน onclick ใน HTML)
   ========================================== */

/**
 * รีเซ็ตฟอร์มสำหรับ "เพิ่มผู้ดูแลใหม่"
 * เรียกเมื่อกดปุ่ม "+ เพิ่มผู้ดูแล"
 */
function resetAdminForm() {
    const form = document.getElementById('adminForm');
    if (form) form.reset();

    // ล้างค่า ID และเปลี่ยนโหมดเป็น 'create' (สร้างใหม่)
    document.getElementById('adminId').value = '';
    document.getElementById('formAction').value = 'create';
    
    // เปลี่ยนหัวข้อ Modal
    const modalTitle = document.querySelector('#adminModal .modal-title');
    if(modalTitle) modalTitle.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>เพิ่มผู้ดูแลระบบ';

    // Username: เปิดให้แก้ได้ และต้องกรอก
    const userInput = document.getElementById('adminUser');
    if(userInput) {
        userInput.readOnly = false;
        userInput.value = '';
    }

    // Password: ต้องกรอกรหัสผ่านใหม่
    const passInput = document.getElementById('adminPass');
    if(passInput) passInput.required = true;

    const passHint = document.getElementById('passHint');
    if(passHint) passHint.innerText = '';
}

/**
 * เติมข้อมูลลงฟอร์มสำหรับ "แก้ไขผู้ดูแล"
 * เรียกเมื่อกดปุ่ม "ดินสอ (Edit)" ในตาราง
 */
function editAdmin(id, fullName, username, role) {
    // ใส่ค่าลงใน Input ภายใน Modal
    document.getElementById('adminId').value = id;
    document.getElementById('adminName').value = fullName;
    document.getElementById('adminUser').value = username;
    
    // เลือก Role (สิทธิ์) ให้ตรงกับของเดิม
    const roleSelect = document.getElementById('adminRole');
    if(roleSelect) roleSelect.value = role;

    // เปลี่ยนโหมดเป็น 'update' (แก้ไข)
    document.getElementById('formAction').value = 'update';

    // เปลี่ยนหัวข้อ Modal
    const modalTitle = document.querySelector('#adminModal .modal-title');
    if(modalTitle) modalTitle.innerHTML = '<i class="bi bi-pencil-square me-2"></i>แก้ไขข้อมูลผู้ดูแล';

    // Username: ห้ามแก้ไข (Read-only) เพื่อป้องกันปัญหา Data Integrity
    const userInput = document.getElementById('adminUser');
    if(userInput) userInput.readOnly = true;

    // Password: ไม่บังคับกรอก (ถ้าไม่เปลี่ยนก็เว้นว่างไว้)
    const passInput = document.getElementById('adminPass');
    if(passInput) passInput.required = false;

    const passHint = document.getElementById('passHint');
    if(passHint) passHint.innerText = '(เว้นว่างถ้าไม่เปลี่ยน)';

    // สั่งเปิด Modal ด้วยคำสั่งของ Bootstrap
    const modalEl = document.getElementById('adminModal');
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

/**
 * ยืนยันการลบผู้ดูแล
 * เรียกเมื่อกดปุ่ม "ถังขยะ (Delete)" ในตาราง
 */
function deleteAdmin(id) {
    if (confirm('⚠️ คำเตือน: คุณแน่ใจหรือไม่ที่จะลบผู้ดูแลระบบคนนี้?\nการกระทำนี้ไม่สามารถย้อนกลับได้')) {
        // ใส่ ID ลงในฟอร์มซ่อน (Hidden Form) แล้วสั่ง Submit ไปยัง Django
        document.getElementById('deleteUserId').value = id;
        document.getElementById('deleteAdminForm').submit();
    }
}


/**
 * ฟังก์ชัน เปิด/ปิด การมองเห็นรหัสผ่านใน Modal
 * @param {string} inputId - ID ของช่อง Input ที่ต้องการโชว์/ซ่อน
 */
function togglePasswordVisibility(inputId) {
    const passInput = document.getElementById(inputId);
    const toggleIcon = document.querySelector(`[onclick="togglePasswordVisibility('${inputId}')"] i`);
    
    if (passInput.type === "password") {
        passInput.type = "text";
        toggleIcon.classList.remove('bi-eye-slash');
        toggleIcon.classList.add('bi-eye');
    } else {
        passInput.type = "password";
        toggleIcon.classList.remove('bi-eye');
        toggleIcon.classList.add('bi-eye-slash');
    }
}
