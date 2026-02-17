/* admin-login.js for Django */

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. อ้างอิง Element
    const loginForm = document.getElementById('loginForm');
    const userEl = document.getElementById('admUser');
    const passEl = document.getElementById('admPass');
    const loginBtn = document.getElementById('loginBtn');
    const alertBox = document.getElementById('alertBox');
    const alertMsg = document.getElementById('alertMsg');

    // 2. ฟังก์ชันแสดง Error (Client Side)
    function showError(message) {
        if (alertBox && alertMsg) {
            alertMsg.innerText = message;
            alertBox.classList.remove('d-none');
            // สั่น Form นิดนึงเพื่อให้รู้ว่าผิด
            loginForm.classList.add('shake-animation');
            setTimeout(() => loginForm.classList.remove('shake-animation'), 500);
        } else {
            alert(message);
        }
    }

    // 3. จัดการเมื่อกดปุ่ม Submit
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            
            // 3.1 ดึงค่า
            const u = userEl.value.trim();
            const p = passEl.value.trim();

            // 3.2 ตรวจสอบค่าว่าง (Validation)
            if (!u) {
                e.preventDefault(); // ห้ามส่งไป Server
                showError('กรุณากรอกชื่อผู้ใช้');
                userEl.focus();
                return;
            }

            if (!p) {
                e.preventDefault(); // ห้ามส่งไป Server
                showError('กรุณากรอกรหัสผ่าน');
                passEl.focus();
                return;
            }

            // 3.3 ถ้าผ่านหมด -> ปล่อยให้ Form ส่งข้อมูลไป Django (POST)
            // แต่เปลี่ยนสถานะปุ่มให้ User รู้ว่ากำลังทำงาน
            if (loginBtn) {
                // เปลี่ยนข้อความและใส่ Spinner
                const originalText = loginBtn.innerHTML;
                loginBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>กำลังตรวจสอบ...';
                loginBtn.classList.add('btn-loading');
                
                // ป้องกันการกดซ้ำ (Disable ปุ่ม)
                // หมายเหตุ: บางทีการ disable ปุ่มทันทีอาจทำให้ form ไม่ submit ในบาง browser
                // จึงใช้ css pointer-events: none แทน หรือ disable หลังจาก delay สั้นๆ
                setTimeout(() => { loginBtn.disabled = true; }, 100);
            }
        });
    }

    // 4. (Optional) Auto Focus ถ้ายังไม่ได้กรอกอะไร
    if (userEl && !userEl.value) {
        userEl.focus();
    }
});