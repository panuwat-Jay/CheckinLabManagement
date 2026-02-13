/* admin-login.js - Django Version */

document.addEventListener('DOMContentLoaded', () => {
    
    const loginForm = document.getElementById('loginForm');
    
    // 1. จัดการการส่งฟอร์ม (Form Submission)
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            // ดึงค่ามาตรวจสอบเบื้องต้น
            const usernameInput = document.querySelector('input[name="username"]');
            const passwordInput = document.querySelector('input[name="password"]');
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value.trim();

            // Validation: ห้ามว่าง
            if (!username || !password) {
                e.preventDefault(); // หยุดการส่งฟอร์ม
                alert('กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน');
                
                if (!username) usernameInput.focus();
                else passwordInput.focus();
                return;
            }

            // ถ้าข้อมูลครบ -> เปลี่ยนปุ่มเป็นสถานะ Loading
            const btn = this.querySelector('button[type="submit"]');
            if (btn) {
                // บันทึกข้อความเดิมไว้เผื่อต้องกู้คืน (กรณี Django ตอบกลับเร็วมากหรือใช้ AJAX ในอนาคต)
                btn.dataset.originalText = btn.innerHTML;
                
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>กำลังตรวจสอบ...';
            }
            
            // ปล่อยให้ Form Submit ไปหา Django View ตามปกติ (method="POST")
        });
    }

    // 2. UX: ถ้ามี Error กลับมาจาก Django (เช่น รหัสผิด) ให้โฟกัสที่ช่อง Password
    const errorAlert = document.querySelector('.alert-danger');
    if (errorAlert) {
        // เพิ่ม Animation สั่นเล็กน้อยให้รู้ว่าผิด
        errorAlert.classList.add('animate-fade');
        
        const passwordInput = document.querySelector('input[name="password"]');
        if (passwordInput) {
            passwordInput.value = ''; // ล้างรหัสเดิม
            passwordInput.focus();
        }
    }
});