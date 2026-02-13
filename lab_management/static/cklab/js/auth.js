/* auth.js - Kiosk Logic for Django */

// 1. ดึงค่า PC ID จาก URL หรือจาก Global Variable ที่เราจะตั้งไว้ใน HTML
function getSystemPCId() {
    const params = new URLSearchParams(window.location.search);
    let pcId = params.get('pc');
    if (!pcId && window.pcIdFromDjango) {
        pcId = window.pcIdFromDjango;
    }
    return pcId;
}

const FIXED_PC_ID = getSystemPCId();
let verifiedUserData = null;

document.addEventListener('DOMContentLoaded', () => {
    console.log("CKLab Auth System Ready for PC:", FIXED_PC_ID);

    // ตรวจสอบการกรอกข้อมูลใน Tab บุคคลทั่วไป
    const extInputs = document.querySelectorAll('#formExternal input');
    if (extInputs.length > 0) {
        extInputs.forEach(input => {
            input.addEventListener('input', validateForm);
        });
    }

    // Smart Enter Logic สำหรับช่องรหัสนักศึกษา
    const ubuInput = document.getElementById('ubuUser');
    if (ubuInput) {
        ubuInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // กันฟอร์มส่งก่อนตรวจสอบ
                if (!verifiedUserData) {
                    verifyUBUUser();
                } else {
                    document.getElementById('checkinForm').submit();
                }
            }
        });
    }
});

// ฟังก์ชันจำลองการตรวจสอบผู้ใช้ (ในอนาคตควรใช้ Fetch API เรียก Django View)
function verifyUBUUser() {
    const input = document.getElementById('ubuUser');
    const id = input.value.trim();
    const verifyCard = document.getElementById('internalVerifyCard');
    const btnConfirm = document.getElementById('btnConfirm');
    const hiddenName = document.getElementById('hiddenUserName');

    if (id.length >= 8) { // สมมติว่ารหัสนักศึกษาต้องมี 8 หลักขึ้นไป
        // ในระบบจริงตรงนี้ต้องใช้ fetch('/api/verify-user/' + id)
        verifiedUserData = {
            id: id,
            name: "นักศึกษาตัวอย่าง (" + id + ")"
        };

        // แสดง UI ว่าผ่าน
        document.getElementById('showName').innerText = verifiedUserData.name;
        document.getElementById('showFaculty').innerText = "คณะวิทยาศาสตร์";
        if (document.getElementById('showRole')) document.getElementById('showRole').innerText = "STUDENT";
        
        verifyCard.classList.remove('d-none');
        hiddenName.value = verifiedUserData.name; // ใส่ค่าลง Hidden Input เพื่อส่งไป Django
        
        validateForm();
    } else {
        alert("กรุณากรอกรหัสนักศึกษาให้ครบถ้วน");
        verifyCard.classList.add('d-none');
        verifiedUserData = null;
    }
}

// ตรวจสอบความพร้อมของฟอร์มก่อนให้กดปุ่ม
function validateForm() {
    const btn = document.getElementById('btnConfirm');
    const activeTab = document.querySelector('.nav-link.active').id;
    let isValid = false;

    if (activeTab === 'tab-internal') {
        isValid = (verifiedUserData !== null);
    } else {
        const extId = document.getElementById('extIdCard').value.trim();
        const extName = document.getElementById('extName').value.trim();
        isValid = (extId !== '' && extName !== '');
        
        // ถ้าเป็นบุคคลทั่วไป ให้เอาค่าไปใส่ใน input หลักด้วย
        if (isValid) {
            document.getElementById('ubuUser').value = extId;
            document.getElementById('hiddenUserName').value = extName;
        }
    }

    if (isValid) {
        btn.disabled = false;
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
    } else {
        btn.disabled = true;
        btn.classList.add('btn-secondary');
        btn.classList.remove('btn-primary');
    }
}

// ฟังก์ชันสำหรับสลับ Tab (เรียกใช้จาก HTML)
window.switchTab = function(type) {
    // Logic สลับ Tab จะถูกจัดการโดย Bootstrap Data-BS-Target อยู่แล้ว 
    // แต่เราเพิ่มการเคลียร์ค่าได้ที่นี่
    verifiedUserData = null;
    document.getElementById('internalVerifyCard').classList.add('d-none');
    validateForm();
};