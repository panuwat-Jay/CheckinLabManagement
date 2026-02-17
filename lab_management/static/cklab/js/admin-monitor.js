/* admin-monitor.js (Django Version) - Main application logic */

let checkInModal, manageActiveModal;
let currentTab = 'internal';
let verifiedUserData = null;
let currentFilter = 'all'; 
let searchQuery = '';      

document.addEventListener('DOMContentLoaded', async () => {
    // Init Modals
    const modalEl = document.getElementById('checkInModal');
    if (modalEl) checkInModal = new bootstrap.Modal(modalEl);
    
    const manageEl = document.getElementById('manageActiveModal');
    if (manageEl) manageActiveModal = new bootstrap.Modal(manageEl);

    // Set active menu item
    const monitorLink = document.querySelector('.admin-sidebar a[href*="monitor"]');
    if (monitorLink) monitorLink.classList.add('active');

    // Date picker
    const dateInput = document.getElementById('monitorDate');
    if (dateInput) {
        dateInput.valueAsDate = new Date();
        dateInput.addEventListener('change', renderMonitor);
    }

    // Initial render
    await renderMonitor();
    updateClock();
    
    // Auto refresh
    setInterval(async () => {
        const modalOpen = (modalEl && modalEl.classList.contains('show')) || (manageEl && manageEl.classList.contains('show'));
        if (!modalOpen) await renderMonitor();
    }, 3000);
    
    setInterval(updateClock, 1000);
});

function updateClock() {
    const clockEl = document.getElementById('clockDisplay');
    if(clockEl) clockEl.innerText = new Date().toLocaleTimeString('th-TH');
}

async function filterPC(status) {
    currentFilter = status;
    updateFilterButtons(status);
    await renderMonitor();
}

async function searchPC() {
    const input = document.getElementById('searchPC');
    searchQuery = input ? input.value.trim().toLowerCase() : '';
    await renderMonitor();
}

async function updateMonitorStats(allPcs) {
    const counts = { available: 0, in_use: 0, reserved: 0, maintenance: 0 };
    allPcs.forEach(pc => {
        counts[pc.status] = (counts[pc.status] || 0) + 1;
    });

    Object.keys(counts).forEach(status => {
        const el = document.getElementById(`count-${status}`);
        if(el) el.innerText = counts[status];
    });
}

async function renderMonitor() {
    const grid = document.getElementById('monitorGrid');
    if(!grid) return;

    let allPcs = await DB.getPCs();
    const dateInput = document.getElementById('monitorDate');
    const selectedDateStr = dateInput ? dateInput.value : new Date().toISOString().split('T')[0];
    
    let bookings = await DB.getBookings(selectedDateStr);
    let logs = await DB.getLogs(selectedDateStr);
    
    await updateMonitorStats(allPcs);
    
    const now = new Date();
    const curTimeVal = now.getHours() * 60 + now.getMinutes();

    let displayPcs = allPcs;

    if (currentFilter !== 'all') {
        displayPcs = displayPcs.filter(pc => pc.status === currentFilter);
    }

    if (searchQuery) {
        displayPcs = displayPcs.filter(pc => 
            pc.name.toLowerCase().includes(searchQuery) || 
            (pc.current_user && pc.current_user.toLowerCase().includes(searchQuery))
        );
    }

    grid.innerHTML = '';

    if (displayPcs.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center text-muted py-5">ไม่พบข้อมูล</div>`;
        return;
    }

    displayPcs.forEach(pc => {
        let statusClass = '', iconClass = '', label = '', cardBorder = '';
        switch(pc.status) {
            case 'available': statusClass = 'text-success'; cardBorder = 'border-success'; iconClass = 'bi-check-circle'; label = 'ว่าง'; break;
            case 'in_use': statusClass = 'text-danger'; cardBorder = 'border-danger'; iconClass = 'bi-person-workspace'; label = 'ใช้งานอยู่'; break;
            case 'reserved': statusClass = 'text-warning'; cardBorder = 'border-warning'; iconClass = 'bi-bookmark-fill'; label = 'จองแล้ว'; break;
            default: statusClass = 'text-secondary'; cardBorder = 'border-secondary'; iconClass = 'bi-wrench-adjustable'; label = 'แจ้งซ่อม';
        }

        const userDisplay = pc.current_user ? 
            `<div class="mt-1 fw-bold text-dark"><i class="bi bi-person-fill"></i> ${pc.current_user}</div>` : 
            `<div class="mt-1 text-muted">-</div>`;

        let softwareHtml = '';
        if (Array.isArray(pc.installed_software) && pc.installed_software.length > 0) {
            softwareHtml = '<div class="mt-2 d-flex flex-wrap justify-content-center gap-1">';
            pc.installed_software.slice(0, 2).forEach(sw => {
                const shortName = sw.split('(')[0].trim();
                softwareHtml += `<span class="badge bg-light text-secondary border" style="font-size: 0.65rem;">${shortName}</span>`;
            });
            if (pc.installed_software.length > 2) {
                softwareHtml += `<span class="badge bg-light text-secondary border" style="font-size: 0.65rem;">+${pc.installed_software.length - 2}</span>`;
            }
            softwareHtml += '</div>';
        } else {
            softwareHtml = '<div class="mt-2" style="height: 22px;"></div>';
        }

        let usageTimeBadge = '';
        if (pc.status === 'in_use' && pc.session_start) {
            const start = new Date(pc.session_start);
            const diffMs = now - start;
            const diffMins = Math.floor(diffMs / 60000);
            let durationText = diffMins < 60 ? `${diffMins} น.` : `${Math.floor(diffMins/60)} ชม.`;
            usageTimeBadge = `<div class="badge bg-info text-dark mb-1"><i class="bi bi-stopwatch"></i> ${durationText}</div>`;
        } else {
            usageTimeBadge = '<div class="mb-1" style="height: 21px;"></div>';
        }

        const codeNameHtml = pc.code_name ? ` <small style="font-size: 0.8rem;">| ${pc.code_name}</small>` : '';

        grid.innerHTML += `
            <div class="col-6 col-md-4 col-lg-3">
                <div class="card h-100 shadow-sm ${cardBorder} pc-card-hover" 
                     style="cursor: pointer;" onclick="handlePcClick('${pc.id}')">
                    <div class="card-body text-center p-3 d-flex flex-column">
                        <i class="bi ${iconClass} display-6 ${statusClass} mb-2"></i>
                        <h5 class="fw-bold mb-0">${pc.name}${codeNameHtml}</h5>
                        <div class="badge bg-light text-dark border mb-1" style="width: fit-content; margin: 0.5rem auto 0;">${label}</div>
                        ${usageTimeBadge}
                        ${userDisplay}
                        ${softwareHtml}
                    </div>
                </div>
            </div>`;
    });
}

async function handlePcClick(pcId) {
    let allPcs = await DB.getPCs();
    const pc = allPcs.find(p => String(p.id) === String(pcId));
    if (!pc) return;

    if (pc.status === 'available') {
        openCheckInModal(pc);
    } else if (pc.status === 'in_use') {
        openManageActiveModal(pc);
    }
}

async function openManageActiveModal(pc) {
    document.getElementById('managePcId').value = pc.id;
    const codeNameStr = pc.code_name ? ` | ${pc.code_name}` : '';
    document.getElementById('managePcName').innerText = `${pc.name}${codeNameStr}`;
    document.getElementById('manageUserName').innerText = pc.current_user || 'Unknown';
    if(manageActiveModal) manageActiveModal.show();
}

async function confirmForceLogout() {
    const pcId = document.getElementById('managePcId').value;
    if (!pcId) { alert("ไม่พบ ID ของเครื่อง"); return; }

    if(!confirm('ยืนยันสั่ง Check-out?')) return;

    let pcs = await DB.getPCs();
    const pc = pcs.find(p => String(p.id) === String(pcId));
    
    const startTime = pc && pc.session_start ? new Date(pc.session_start) : new Date();
    const endTime = new Date();

    await DB.saveLog({
        action: 'END_SESSION',   
        user_id: 'Admin',          
        user_name: pc.current_user,   
        user_role: 'Admin',      
        user_faculty: '-', 
        user_level: 'Admin',     
        user_year: '-',       
        pc_id: pcId,
        start_time: startTime.toISOString(),
        duration_minutes: Math.floor((endTime - startTime) / 60000),
        details: 'Admin Forced Logout'
    });

    await DB.updatePCStatus(pcId, 'available', null);
    if(manageActiveModal) manageActiveModal.hide();
    await renderMonitor();
}

function openCheckInModal(pc) {
    document.getElementById('checkInPcId').value = pc.id;
    const codeNameStr = pc.code_name ? ` | ${pc.code_name}` : '';
    document.getElementById('modalPcName').innerText = `Station: ${pc.name}${codeNameStr}`;

    const swContainer = document.getElementById('modalSoftwareTags');
    swContainer.innerHTML = '';
    if (pc.installed_software && pc.installed_software.length > 0) {
        pc.installed_software.forEach(sw => 
            swContainer.innerHTML += `<span class="badge bg-info text-dark me-1">${sw}</span>`
        );
    } else { 
        swContainer.innerHTML = '<span class="text-muted small">ไม่มีข้อมูล</span>'; 
    }
    
    switchTab('internal'); 
    verifiedUserData = null;
    if(checkInModal) checkInModal.show();
}

function switchTab(tabName) {
    currentTab = tabName;
    const btnInt = document.getElementById('tab-internal'); 
    const btnExt = document.getElementById('tab-external');
    const formInt = document.getElementById('formInternal'); 
    const formExt = document.getElementById('formExternal');
    
    if (tabName === 'internal') {
        btnInt.classList.add('active'); 
        btnExt.classList.remove('active');
        formInt.classList.remove('d-none'); 
        formExt.classList.add('d-none');
    } else {
        btnExt.classList.add('active'); 
        btnInt.classList.remove('active');
        formExt.classList.remove('d-none'); 
        formInt.classList.add('d-none');
    }
}

function verifyUBUUser() {
    const userId = document.getElementById('ubuUser').value.trim();
    if (!userId) { alert('กรุณากรอกรหัส'); return; }
    
    verifiedUserData = { 
        id: userId, name: 'Test User', faculty: 'Faculty', 
        role: 'Student', level: '1', year: '1'    
    };
    document.getElementById('internalVerifyCard').classList.remove('d-none');
    document.getElementById('showName').innerText = verifiedUserData.name;
    document.getElementById('showFaculty').innerText = verifiedUserData.faculty;
    document.getElementById('btnConfirm').disabled = false;
}

async function confirmCheckIn() {
    const pcId = document.getElementById('checkInPcId').value;
    let finalName = "", userType = "", finalId = "", faculty = "";
    let finalLevel = "-", finalYear = "-"; 

    if (currentTab === 'internal') {
        if (!verifiedUserData) return;
        ({ id: finalId, name: finalName, role: userType, faculty, level: finalLevel, year: finalYear } = verifiedUserData);
    } else {
        finalName = document.getElementById('extName').value.trim();
        if (!finalName) { alert('กรุณากรอกชื่อ'); return; }
        userType = 'Guest'; finalId = 'External'; faculty = 'บุคคลภายนอก';
    }

    await DB.updatePCStatus(pcId, 'in_use', finalName);
    await DB.saveLog({ 
        action: 'START_SESSION', user_id: finalId, user_name: finalName, 
        user_role: userType, user_faculty: faculty, user_level: finalLevel, 
        user_year: finalYear, pc_id: pcId, start_time: new Date().toISOString(), 
        details: 'Admin Check-in', slot_id: 'Unlimited' 
    });

    if(checkInModal) checkInModal.hide();
    await renderMonitor();
}

function updateFilterButtons(activeStatus) {
    ['all', 'available', 'in_use', 'reserved'].forEach(status => {
        const btn = document.getElementById(`btn-${status}`);
        if(btn) btn.style.backgroundColor = status === activeStatus ? '#0d6efd' : 'transparent';
    });
}
