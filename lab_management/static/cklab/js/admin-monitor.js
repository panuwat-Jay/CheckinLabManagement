/* ==========================================
   admin-monitor.js (Django Integration Version)
   เชื่อมต่อกับ Backend ผ่าน API /api/monitor-data/
   ========================================== */

let checkInModal, manageActiveModal;
let currentFilter = 'all'; 
let searchQuery = '';       
let pcDataList = []; // ตัวแปรเก็บข้อมูลล่าสุดจาก Server

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Modals
    const checkInEl = document.getElementById('checkInModal');
    if (checkInEl) checkInModal = new bootstrap.Modal(checkInEl);
    
    const manageEl = document.getElementById('manageActiveModal');
    if (manageEl) manageActiveModal = new bootstrap.Modal(manageEl);

    // 2. Initialize Date Picker (ตั้งค่าเป็นวันนี้)
    const dateInput = document.getElementById('monitorDate');
    if (dateInput && !dateInput.value) {
        dateInput.valueAsDate = new Date();
    }

    // 3. เริ่มดึงข้อมูล (Polling)
    fetchMonitorData(); 
    setInterval(() => {
        // หยุดดึงข้อมูลชั่วคราวถ้าเปิด Modal อยู่ (เพื่อไม่ให้ UI กระตุก)
        const isModalOpen = (checkInEl && checkInEl.classList.contains('show')) || 
                            (manageEl && manageEl.classList.contains('show'));
        if (!isModalOpen) fetchMonitorData();
    }, 3000); // อัปเดตทุก 3 วินาที
    
    // 4. นาฬิกา Realtime
    updateClock();
    setInterval(updateClock, 1000);
});

function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('clockDisplay');
    if(clockEl) clockEl.innerText = now.toLocaleTimeString('th-TH');
}

// ==========================================
// 📡 API Data Fetching
// ==========================================

function fetchMonitorData() {
    fetch('/api/monitor-data/')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                pcDataList = data.data; // เก็บข้อมูลลงตัวแปร Global
                renderMonitor();        // วาดหน้าจอใหม่
                updateMonitorStats(pcDataList); // อัปเดตตัวเลขสรุป
            }
        })
        .catch(error => console.error('Error fetching monitor data:', error));
}

// ==========================================
// 🖥️ Render Logic (UI Generation)
// ==========================================

function filterPC(status) {
    currentFilter = status;
    updateFilterButtons(status);
    renderMonitor();
}

function searchPC() {
    const input = document.getElementById('searchPC');
    if (input) {
        searchQuery = input.value.trim().toLowerCase();
        renderMonitor();
    }
}

function updateMonitorStats(allPcs) {
    const counts = { available: 0, in_use: 0, reserved: 0, maintenance: 0 };
    
    allPcs.forEach(pc => {
        // เช็คว่า status ตรงกับ key ไหนแล้วบวกเพิ่ม
        if (counts.hasOwnProperty(pc.status)) {
            counts[pc.status]++;
        } else {
            counts.maintenance++; // ถ้าสถานะแปลกๆ ให้ปัดเป็นซ่อม
        }
    });

    // ฟังก์ชันย่อยสำหรับอัปเดตตัวเลขใน HTML
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if(el) el.innerText = val;
    };
    
    setVal('count-available', counts.available);
    setVal('count-in_use', counts.in_use);
    // setVal('count-reserved', counts.reserved); // *รอระบบจองสมบูรณ์ค่อยเปิดใช้
    setVal('count-maintenance', counts.maintenance);
    setVal('count-total', allPcs.length);
}

function renderMonitor() {
    const grid = document.getElementById('monitorGrid');
    if(!grid) return;

    // 1. กรองข้อมูล (Filter & Search)
    let displayPcs = pcDataList;

    if (currentFilter !== 'all') {
        displayPcs = displayPcs.filter(pc => pc.status === currentFilter);
    }

    if (searchQuery) {
        displayPcs = displayPcs.filter(pc => 
            pc.name.toLowerCase().includes(searchQuery) || 
            (pc.current_user && pc.current_user.toLowerCase().includes(searchQuery))
        );
    }

    // 2. สร้าง HTML
    grid.innerHTML = '';

    if (displayPcs.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center text-muted py-5"><i class="bi bi-search fs-1"></i><br>ไม่พบข้อมูล</div>`;
        return;
    }

    displayPcs.forEach(pc => {
        let statusClass = '', iconClass = '', label = '', cardBorder = '', bgClass = '';
        
        switch(pc.status) {
            case 'available': 
                statusClass = 'text-success'; cardBorder = 'border-success'; bgClass = 'bg-success-subtle';
                iconClass = 'bi-display'; label = 'ว่าง'; 
                break;
            case 'in_use': 
                statusClass = 'text-danger'; cardBorder = 'border-danger'; bgClass = 'bg-danger-subtle';
                iconClass = 'bi-person-fill'; label = 'ใช้งานอยู่'; 
                break;
            case 'maintenance': 
                statusClass = 'text-secondary'; cardBorder = 'border-secondary'; bgClass = 'bg-secondary-subtle';
                iconClass = 'bi-tools'; label = 'แจ้งซ่อม';
                break;
            default: // อื่นๆ
                statusClass = 'text-secondary'; cardBorder = 'border-secondary'; bgClass = 'bg-light';
                iconClass = 'bi-question-circle'; label = 'Unknown';
        }

        // ชื่อผู้ใช้งาน (ถ้ามี)
        const userDisplay = pc.current_user ? 
            `<div class="mt-1 fw-bold text-dark text-truncate" title="${pc.current_user}">
                <i class="bi bi-person-fill"></i> ${pc.current_user}
             </div>` : 
            `<div class="mt-1 text-muted">-</div>`;

        // เวลาใช้งาน (Elapsed Time)
        let timeDisplay = '';
        if (pc.status === 'in_use' && pc.elapsed_seconds) {
            const totalSec = pc.elapsed_seconds;
            const hrs = Math.floor(totalSec / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            
            let timeText = (hrs > 0) ? `${hrs} ชม. ${mins} น.` : `${mins} นาที`;
            timeDisplay = `<div class="badge bg-info text-dark mb-1 shadow-sm"><i class="bi bi-stopwatch"></i> ${timeText}</div>`;
        } else {
            timeDisplay = `<div class="mb-1" style="height: 21px;"></div>`;
        }

        // สร้าง HTML Card 
        grid.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3 col-xl-2">
                <div class="card h-100 shadow-sm ${cardBorder} ${bgClass} position-relative pc-card" 
                     style="transition: transform 0.2s; cursor: pointer;"
                     onclick="handlePcClick('${pc.pc_id}', '${pc.name}', '${pc.status}', '${pc.current_user || ''}')">
                    
                    <div class="card-body text-center p-3 d-flex flex-column">
                        <i class="bi ${iconClass} display-6 ${statusClass} mb-2"></i>
                        <h5 class="fw-bold mb-0 text-dark">${pc.name}</h5>
                        <div class="badge bg-light text-dark border mb-1 align-self-center mt-1">${label}</div>
                        
                        ${timeDisplay}
                        ${userDisplay}
                        
                        <i class="bi ${iconClass} position-absolute end-0 bottom-0 p-2" style="font-size: 4rem; opacity: 0.1;"></i>
                    </div>
                </div>
            </div>`;
    });
}

// ==========================================
// 🖱️ Interaction Handlers
// ==========================================

function handlePcClick(pcId, pcName, status, currentUser) {
    if (status === 'available') {
        openCheckInModal(pcId, pcName);
    } else if (status === 'in_use') {
        openManageActiveModal(pcId, pcName, currentUser);
    } else if (status === 'maintenance') {
        alert(`เครื่อง ${pcName} อยู่ในสถานะแจ้งซ่อม`);
    }
}

// --- 1. Check-in Modal Logic ---
function openCheckInModal(pcId, pcName) {
    // เซ็ตค่าลงใน Form HTML
    document.getElementById('checkInPcId').value = pcId;
    document.getElementById('modalPcName').innerText = `Station: ${pcName}`;
    
    // Reset Form
    document.getElementById('ubuUser').value = '';
    document.getElementById('internalVerifyCard').classList.add('d-none');
    document.getElementById('btnConfirm').disabled = true;
    
    if(checkInModal) checkInModal.show();
}

function verifyUBUUser() {
    const userIdInput = document.getElementById('ubuUser');
    const userId = userIdInput.value.trim();
    
    if (!userId) { 
        alert('กรุณากรอกรหัสนักศึกษา'); 
        return; 
    }
    
    // ยิง API ไปที่ Django View
    fetch(`/api/verify-user/?user_id=${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const user = data.data;
                
                // แสดงผลลัพธ์
                document.getElementById('internalVerifyCard').classList.remove('d-none');
                document.getElementById('showName').innerText = user.name;
                document.getElementById('showFaculty').innerText = user.faculty;
                
                // ใส่ค่าชื่อผู้ใช้ลงใน Hidden Input เพื่อส่งไปพร้อม Form
                const hiddenInput = document.getElementById('hiddenUserName');
                if(hiddenInput) hiddenInput.value = user.name;
                
                // ปลดล็อคปุ่มยืนยัน
                document.getElementById('btnConfirm').disabled = false;
            } else {
                alert('❌ ไม่พบข้อมูลในระบบ หรือเกิดข้อผิดพลาด');
                document.getElementById('internalVerifyCard').classList.add('d-none');
                document.getElementById('btnConfirm').disabled = true;
            }
        })
        .catch(err => {
            console.error(err);
            alert('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        });
}

// --- 2. Manage Modal Logic (Force Logout) ---
function openManageActiveModal(pcId, pcName, currentUser) {
    document.getElementById('managePcId').value = pcId;
    document.getElementById('managePcName').innerText = pcName;
    document.getElementById('manageUserName').innerText = currentUser || 'Unknown';
    
    if(manageActiveModal) manageActiveModal.show();
}

// --- 3. UI Helper: ปุ่มกรองข้อมูล ---
function updateFilterButtons(activeStatus) {
    const buttons = ['all', 'available', 'in_use', 'reserved', 'maintenance'];
    buttons.forEach(status => {
        const btn = document.getElementById(`btn-${status}`);
        if(btn) {
            // Reset Style
            btn.classList.remove('active');
            btn.style.backgroundColor = 'transparent';
            btn.style.color = '';
            
            // Set Active Style
            if (status === activeStatus) {
                btn.classList.add('active');
                if (status === 'all') { btn.style.backgroundColor = '#e9ecef'; btn.style.color = '#495057'; }
                else if (status === 'available') { btn.style.backgroundColor = '#198754'; btn.style.color = 'white'; }
                else if (status === 'in_use') { btn.style.backgroundColor = '#dc3545'; btn.style.color = 'white'; }
                else if (status === 'maintenance') { btn.style.backgroundColor = '#6c757d'; btn.style.color = 'white'; }
            } else {
                // Inactive Style
                if (status === 'available') btn.style.color = '#198754';
                else if (status === 'in_use') btn.style.color = '#dc3545';
                else if (status === 'maintenance') btn.style.color = '#6c757d';
            }
        }
    });
}