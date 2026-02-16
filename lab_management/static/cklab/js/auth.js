// ==========================================
// Global Variables
// ==========================================
let currentUser = { id: '', name: '', type: 'internal' };
let activeTab = 'internal';
let idleTime = 0;

// ==========================================
// Tab Switching Logic
// ==========================================
function switchTab(tab) {
    activeTab = tab;
    currentUser.type = tab;
    
    // สลับ Class ปุ่ม
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active', 'bg-primary', 'text-white'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    
    // สลับการแสดงผล Form
    document.getElementById('formInternal').classList.add('d-none');
    document.getElementById('formExternal').classList.add('d-none');
    
    if (tab === 'internal') {
        document.getElementById('formInternal').classList.remove('d-none');
    } else {
        document.getElementById('formExternal').classList.remove('d-none');
        // บุคคลทั่วไป เปิดปุ่มให้กดได้ถ้าต้องการ
        enableConfirmButton();
    }
}

// ==========================================
// API Verification Logic
// ==========================================
function verifyUBUUser() {
    const userIdInput = document.getElementById('ubuUser');
    const userId = userIdInput.value.trim();
    
    if (!userId) {
        alert('กรุณากรอกรหัสนักศึกษา/บุคลากร');
        return;
    }

    // UI Loading State
    const verifyBtn = document.querySelector('button[onclick="verifyUBUUser()"]');
    const originalText = verifyBtn.innerHTML;
    verifyBtn.disabled = true;
    verifyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> กำลังตรวจสอบ...';

    // Reset Display
    document.getElementById('loginError').classList.add('d-none');
    document.getElementById('internalVerifyCard').classList.add('d-none');
    disableConfirmButton();

    // Fetch API (ใช้ URL จากตัวแปร global APP_CONFIG ที่ประกาศไว้ใน index.html)
    fetch(`${APP_CONFIG.apiUrl}?user_id=${userId}`)
        .then(response => {
            if (response.status === 404) {
                throw new Error('User not found');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // พบข้อมูลผู้ใช้
                const userInfo = data.data;

                document.getElementById('internalVerifyCard').classList.remove('d-none');
                document.getElementById('showName').innerText = userInfo.name;
                document.getElementById('showFaculty').innerText = userInfo.faculty;

                currentUser.id = userInfo.user_id;
                currentUser.name = userInfo.name;

                enableConfirmButton();
            } else {
                throw new Error(data.message || 'Unknown error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('loginError').classList.remove('d-none');
        })
        .finally(() => {
            // Restore Button State
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = originalText;
        });
}

// ==========================================
// Form Submission Logic
// ==========================================
function confirmCheckIn() {
    if (activeTab === 'external') {
        const extId = document.getElementById('extIdCard').value;
        const extName = document.getElementById('extName').value;
        const extOrg = document.getElementById('extOrg').value;

        if(!extId || !extName) {
            alert('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }
        currentUser.id = extId;
        currentUser.name = `${extName} (${extOrg})`;
    }

    document.getElementById('hidden_user_id').value = currentUser.id;
    document.getElementById('hidden_user_name').value = currentUser.name;
    document.getElementById('hidden_user_type').value = currentUser.type;

    document.getElementById('django-submit-form').submit();
}

// Helper Functions for UI
function enableConfirmButton() {
    const btn = document.getElementById('btnConfirm');
    btn.disabled = false;
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
}

function disableConfirmButton() {
    const btn = document.getElementById('btnConfirm');
    btn.disabled = true;
    btn.classList.add('btn-secondary');
    btn.classList.remove('btn-primary');
}

// ==========================================
// Idle Timer Logic
// ==========================================
function resetTimer() { idleTime = 0; }

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Setup Idle Timer
    document.onmousemove = resetTimer;
    document.onkeypress = resetTimer;
    document.ontouchstart = resetTimer;
    
    setInterval(function() {
        idleTime++;
        if (idleTime >= 60) { window.location.reload(); }
    }, 1000);
});