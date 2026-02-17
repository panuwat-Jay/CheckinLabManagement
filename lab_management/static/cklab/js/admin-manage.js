/* ==========================================
   admin-manage.js (Django Adapted Version)
   ใช้สำหรับจัดการ UI ของหน้า Manage PC (โดยเฉพาะส่วน Modal)
   ========================================== */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Bootstrap Toasts
    const toastElList = [].slice.call(document.querySelectorAll('.toast'));
    const toastList = toastElList.map(function (toastEl) {
        return new bootstrap.Toast(toastEl, { delay: 5000 }); 
    });
    toastList.forEach(toast => toast.show());

    // 2. จัดการช่องค้นหาบนตาราง
    const searchInput = document.getElementById('searchPC');
    if (searchInput) {
        searchInput.addEventListener('keyup', searchPcTable);
    }
});

// ==========================================
// 🔍 ฟังก์ชันค้นหาและกรองตาราง (Client-side)
// ==========================================

function filterPC(status) {
    // อัปเดตสีปุ่ม
    const buttons = ['all', 'available', 'in_use', 'maintenance'];
    buttons.forEach(btnStatus => {
        const btn = document.getElementById(`btn-${btnStatus}`);
        if(btn) {
            btn.classList.remove('active');
            btn.style.backgroundColor = 'transparent';
        }
    });

    const activeBtn = document.getElementById(`btn-${status}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        if (status === 'all') activeBtn.style.backgroundColor = '#e9ecef';
        else activeBtn.style.backgroundColor = activeBtn.style.borderColor; 
    }

    // ซ่อนแสดงแถวในตาราง
    const rows = document.querySelectorAll('#pcTableBody tr');
    rows.forEach(row => {
        // ดึงสถานะที่ซ่อนอยู่ในคลาสหรือข้อความของการ์ดแต่ละแถว
        const rowStatusHtml = row.innerHTML.toLowerCase();
        let isMatch = false;

        if (status === 'all') {
            isMatch = true;
        } else if (status === 'available' && rowStatusHtml.includes('ว่าง')) {
            isMatch = true;
        } else if (status === 'in_use' && rowStatusHtml.includes('ใช้งานอยู่')) {
            isMatch = true;
        } else if (status === 'maintenance' && rowStatusHtml.includes('แจ้งซ่อม')) {
            isMatch = true;
        }

        row.style.display = isMatch ? '' : 'none';
    });
}

function searchPcTable() {
    const query = document.getElementById('searchPC').value.toLowerCase().trim();
    const rows = document.querySelectorAll('#pcTableBody tr');

    rows.forEach(row => {
        const textContent = row.textContent.toLowerCase();
        if (textContent.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// ==========================================
// 📝 ฟังก์ชันเปิด Modal และจำลอง Software Cards
// ==========================================

// ตัวแปรจำลองรายชื่อ Software (คุณสามารถดึงจาก Django API ได้ถ้ามี)
const mockSoftwareLib = [
    { id: '1', name: 'Microsoft Office', version: '2021', type: 'General' },
    { id: '2', name: 'Adobe Creative Cloud', version: '2023', type: 'General' },
    { id: '3', name: 'SPSS', version: 'v28', type: 'General' },
    { id: '4', name: 'ChatGPT Plus', version: 'Web', type: 'AI' },
    { id: '5', name: 'Midjourney', version: 'v6', type: 'AI' },
    { id: '6', name: 'Claude Pro', version: 'Opus', type: 'AI' }
];

function openPcModal() {
    const form = document.getElementById('pcForm');
    if(form) form.reset();
    
    document.getElementById('editPcId').value = '';
    document.getElementById('formAction').value = 'save_pc';
    document.getElementById('pcModalTitle').innerHTML = '<i class="bi bi-plus-lg me-2"></i>เพิ่มเครื่องใหม่';

    // วาด Card ให้เลือก Software
    renderSoftwareCheckboxes([]);
    refreshCheckboxState();
    
    new bootstrap.Modal(document.getElementById('pcModal')).show();
}

function editPc(id, name, status, pcType, installedSoftwareNames) {
    document.getElementById('editPcId').value = id;
    document.getElementById('editPcName').value = name;
    document.getElementById('editPcStatus').value = status;
    document.getElementById('editPcType').value = pcType;
    document.getElementById('formAction').value = 'save_pc';
    document.getElementById('pcModalTitle').innerHTML = '<i class="bi bi-pencil-square me-2"></i>แก้ไขข้อมูลเครื่อง';

    // สมมติว่ารับค่าชื่อ Software เป็น string คั่นด้วยจุลภาค (ถ้าคุณส่งมาจาก HTML)
    const installedList = installedSoftwareNames ? installedSoftwareNames.split(',') : [];
    
    renderSoftwareCheckboxes(installedList);
    refreshCheckboxState();

    new bootstrap.Modal(document.getElementById('pcModal')).show();
}

// ==========================================
// 💻 ฟังก์ชันจัดการ UI ของ Software Selection
// ==========================================

function renderSoftwareCheckboxes(installedList) {
    const container = document.getElementById('softwareCheckboxList');
    if (!container) return;

    container.innerHTML = '';
    if (mockSoftwareLib.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-muted py-3">ไม่พบรายการ Software</div>';
        return;
    }

    mockSoftwareLib.forEach(sw => {
        const fullName = `${sw.name} (${sw.version})`;
        
        // เช็คว่าเคยถูกเลือกไว้ไหม (ค้นหาจากชื่อแบบหลวมๆ)
        const isChecked = installedList.some(i => i.trim().includes(sw.name));
        
        const activeClass = isChecked ? 'active' : '';
        const iconClass = isChecked ? 'bi-check-circle-fill text-primary' : 'bi-circle text-muted opacity-25';
        
        const typeIcon = sw.type === 'AI' 
            ? '<i class="bi bi-robot text-primary fs-4"></i>' 
            : '<i class="bi bi-hdd-network text-secondary fs-4"></i>';

        container.innerHTML += `
            <div class="col-md-6" onclick="toggleSoftwareCard('${sw.id}')">
                <div class="card h-100 shadow-sm soft-card ${activeClass}" id="card_${sw.id}">
                    <div class="card-body p-2 d-flex align-items-center">
                        <div class="me-3 bg-white rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" style="width: 45px; height: 45px;">
                            ${typeIcon}
                        </div>
                        <div class="flex-grow-1 lh-1">
                            <h6 class="mb-1 small fw-bold text-dark">${sw.name}</h6>
                            <span class="text-muted" style="font-size: 0.75rem;">Package: ${sw.version}</span>
                        </div>
                        <div class="ms-2">
                            <i class="bi ${iconClass} fs-5" id="icon_${sw.id}"></i>
                        </div>
                        <input class="hidden-checkbox" type="checkbox" name="pcSoftware" 
                               value="${fullName}" id="sw_${sw.id}" 
                               data-sw-type="${sw.type}" ${isChecked ? 'checked' : ''}>
                    </div>
                </div>
            </div>
        `;
    });
}

function toggleSoftwareCard(id) {
    const checkbox = document.getElementById(`sw_${id}`);
    if (!checkbox || checkbox.disabled) return;
    checkbox.checked = !checkbox.checked;
    refreshCheckboxState();
}

function refreshCheckboxState() {
    const type = document.getElementById('editPcType').value;
    const checkboxes = document.querySelectorAll('input[name="pcSoftware"]');
    const currentlyHasSelection = Array.from(checkboxes).some(c => c.checked);

    checkboxes.forEach(cb => {
        const swType = cb.getAttribute('data-sw-type');
        const swId = cb.id.replace('sw_', '');
        const card = document.getElementById(`card_${swId}`);
        const icon = document.getElementById(`icon_${swId}`);
        
        // 1. General ห้ามเลือก AI
        const isDisabledByType = (type === 'General' && swType === 'AI');
        if (isDisabledByType && cb.checked) cb.checked = false;

        // 2. Lock Single Selection (ถ้าเลือกแล้ว ตัวอื่นห้ามเลือก)
        const isDisabledByLock = currentlyHasSelection && !cb.checked;
        const finalDisabled = isDisabledByType || isDisabledByLock;
        cb.disabled = finalDisabled;

        if (card) {
            if (finalDisabled) {
                card.classList.remove('active');
                card.classList.add('locked');
                if(icon) icon.className = isDisabledByType ? 'bi bi-lock-fill text-secondary fs-5' : 'bi bi-circle text-muted fs-5 opacity-25';
            } else {
                card.classList.remove('locked');
                card.style.opacity = '1';
                card.style.pointerEvents = 'auto';
                if (cb.checked) {
                    card.classList.add('active');
                    if(icon) icon.className = 'bi bi-check-circle-fill text-primary fs-5';
                } else {
                    card.classList.remove('active');
                    if(icon) icon.className = 'bi bi-circle text-muted fs-5 opacity-25';
                }
            }
        }
    });
}

// ==========================================
// 🗑️ ฟังก์ชันลบและตรวจสอบก่อนบันทึก
// ==========================================

function deletePc(id) {
    if(confirm(`⚠️ ยืนยันการลบเครื่องคอมพิวเตอร์รหัส ${id} ใช่หรือไม่?\nข้อมูลการจองและบันทึกการใช้งานที่เกี่ยวข้องอาจได้รับผลกระทบ`)) {
        // ค้นหา Form ที่ซ่อนอยู่ในตารางโดยใช้ ID ของแต่ละแถว
        const form = document.getElementById(`deleteForm_${id}`);
        if (form) {
            form.submit();
        } else {
            alert('เกิดข้อผิดพลาด: ไม่พบฟอร์มสำหรับลบข้อมูล');
        }
    }
}

// ผูก Event เช็คฟอร์มตอนกดบันทึก
document.addEventListener('DOMContentLoaded', () => {
    const pcForm = document.getElementById('pcForm');
    if (pcForm) {
        pcForm.addEventListener('submit', function(e) {
            const type = document.getElementById('editPcType').value;
            const checkboxes = document.querySelectorAll('input[name="pcSoftware"]:checked');
            
            // เช็คเงื่อนไข: ถ้าเป็นเครื่อง AI จะต้องเลือก Software เสมอ
            if (type === 'AI' && checkboxes.length === 0) {
                e.preventDefault(); // เบรกการส่งฟอร์มเข้าเซิร์ฟเวอร์
                alert("⚠️ สำหรับเครื่องประเภท AI Workstation\nกรุณาเลือก Software/AI ที่ติดตั้ง 1 รายการ");
            }
        });
    }
});