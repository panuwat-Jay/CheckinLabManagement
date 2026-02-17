/* admin-report.js (Django Adapted Version: Real Data Ready + Charts + Filters) */

// --- Global Variables ---
let distributionBarInstance = null;
let dailyTrendLineInstance = null;
let topSoftwareChartInstance = null;
let pieChartInstance = null;

let allLogs = [];
let lastLogCount = 0;

// Pagination Variables
let currentPage = 1;
let rowsPerPage = 10;
let filteredLogsGlobal = []; 

// --- Master Lists ---
const FACULTY_LIST = [
    "คณะวิทยาศาสตร์", "คณะเกษตรศาสตร์", "คณะวิศวกรรมศาสตร์", "คณะศิลปศาสตร์", 
    "คณะเภสัชศาสตร์", "คณะบริหารศาสตร์", "คณะพยาบาลศาสตร์", "วิทยาลัยแพทยศาสตร์และการสาธารณสุข", 
    "คณะศิลปประยุกต์และสถาปัตยกรรมศาสตร์", "คณะนิติศาสตร์", "คณะรัฐศาสตร์", "คณะศึกษาศาสตร์"
];

const ORG_LIST = [
    "สำนักคอมพิวเตอร์และเครือข่าย", "สำนักบริหารทรัพย์สินและสิทธิประโยชน์", "สำนักวิทยบริการ", 
    "กองกลาง", "กองแผนงาน", "กองคลัง", "กองบริการการศึกษา", "กองการเจ้าหน้าที่", 
    "สำนักงานส่งเสริมและบริหารงานวิจัย ฯ", "สำนักงานพัฒนานักศึกษา", "สำนักงานบริหารกายภาพและสิ่งแวดล้อม", 
    "สำนักงานวิเทศสัมพันธ์", "สำนักงานนิติการ / สำนักงานกฎหมาย", "สำนักงานตรวจสอบภายใน", 
    "สำนักงานรักษาความปลอดภัย", "สภาอาจารย์", "สหกรณ์ออมทรัพย์มหาวิทยาลัยอุบลราชธานี", 
    "อุทยานวิทยาศาสตร์มหาวิทยาลัยอุบลราชธานี", "ศูนย์การจัดการความรู้ (KM)", 
    "ศูนย์การเรียนรู้และพัฒนา \"งา\" เชิงเกษตรอุตสาหกรรมครัวเรือนแบบยั่งยืน", 
    "สถานปฏิบัติการโรงแรมฯ (U-Place)", "ศูนย์วิจัยสังคมอนุภาคลุ่มน้ำโขง ฯ", 
    "ศูนย์เครื่องมือวิทยาศาสตร์", "โรงพิมพ์มหาวิทยาลัยอุบลราชธานี"
];

// ==========================================
// 0. DATA FETCHING (Django Integration)
// ==========================================
// ฟังก์ชันนี้ช่วยให้ใช้ข้อมูลจริงจาก Django ได้ หากมีการส่งค่ามาทาง window.djangoReportData
function fetchLogsData() {
    if (window.djangoReportData && Array.isArray(window.djangoReportData)) {
        return window.djangoReportData; // ใช้ข้อมูลจริงจากฐานข้อมูล
    } else if (typeof DB !== 'undefined' && typeof DB.getLogs === 'function') {
        return DB.getLogs(); // ใช้ข้อมูลจำลองจาก mock-db.js
    }
    return [];
}

// ==========================================
// 1. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    allLogs = fetchLogsData();
    lastLogCount = allLogs.length; 

    initFilters();      
    initDateInputs();   
    
    if (typeof renderLifetimeStats === 'function') renderLifetimeStats();
    
    applyFilters(); 
    setInterval(checkForUpdates, 5000); 
});

function checkForUpdates() {
    const currentLogs = fetchLogsData();
    if (currentLogs.length !== lastLogCount) {
        allLogs = currentLogs;
        lastLogCount = currentLogs.length;
        applyFilters(); 
        if (typeof renderLifetimeStats === 'function') renderLifetimeStats();
    }
}

function initFilters() {
    const facContainer = document.getElementById('studentFacultyList');
    if (facContainer) {
        facContainer.innerHTML = FACULTY_LIST.map((fac, index) => `
            <div class="form-check">
                <input class="form-check-input fac-check" type="checkbox" value="${fac}" id="fac_${index}" checked>
                <label class="form-check-label small" for="fac_${index}">${fac}</label>
            </div>
        `).join('');
    }

    const orgContainer = document.getElementById('staffOrgList');
    if (orgContainer) {
        orgContainer.innerHTML = ORG_LIST.map((org, index) => `
            <div class="form-check">
                <input class="form-check-input org-check" type="checkbox" value="${org}" id="org_${index}" checked>
                <label class="form-check-label small" for="org_${index}">${org}</label>
            </div>
        `).join('');
    }

    const yearStart = document.getElementById('yearStart');
    const yearEnd = document.getElementById('yearEnd');
    if (yearStart && yearEnd) {
        const currentYear = new Date().getFullYear() + 543;
        for (let y = currentYear; y >= currentYear - 5; y--) {
            yearStart.innerHTML += `<option value="${y - 543}">${y}</option>`;
            yearEnd.innerHTML += `<option value="${y - 543}">${y}</option>`;
        }
        yearStart.value = currentYear - 543;
        yearEnd.value = currentYear - 543;
    }
}

function initDateInputs() {
    const today = new Date();
    const dStart = document.getElementById('dateStart');
    const dEnd = document.getElementById('dateEnd');
    if (dEnd) dEnd.valueAsDate = today;
    if (dStart) {
        const lastMonth = new Date();
        lastMonth.setDate(lastMonth.getDate() - 30);
        dStart.valueAsDate = lastMonth;
    }
    const mStr = today.toISOString().slice(0, 7);
    const mStart = document.getElementById('monthStart');
    const mEnd = document.getElementById('monthEnd');
    if (mStart) mStart.value = mStr;
    if (mEnd) mEnd.value = mStr;
}

// ==========================================
// 2. UI INTERACTION
// ==========================================
function toggleFilterMode() {
    const modeEl = document.querySelector('input[name="userTypeOption"]:checked');
    if (!modeEl) return;
    const mode = modeEl.value;
    
    ['student', 'staff', 'external', 'all'].forEach(m => {
        const el = document.getElementById(`filter-${m}-section`);
        if(el) el.classList.add('d-none');
    });

    const targetEl = document.getElementById(`filter-${mode}-section`);
    if(targetEl) targetEl.classList.remove('d-none');
}

function toggleTimeInputs() {
    const typeEl = document.getElementById('timeFilterType');
    if (!typeEl) return;
    const type = typeEl.value;
    
    ['daily', 'monthly', 'yearly'].forEach(t => {
        document.getElementById(`input-${t}`).classList.add('d-none');
    });
    document.getElementById(`input-${type}`).classList.remove('d-none');
}

function toggleCheckAll(containerId) {
    const checkboxes = document.querySelectorAll(`#${containerId} input[type="checkbox"]`);
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
}

function getCheckedValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return [];
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
}

function toggleStudentYearInputs() {
    const levelSelect = document.getElementById('filterEduLevel');
    const yearContainer = document.getElementById('filterYearContainer');
    
    if (levelSelect && yearContainer) {
        if (levelSelect.value === 'ปริญญาตรี') {
            yearContainer.classList.remove('d-none'); 
        } else {
            yearContainer.classList.add('d-none'); 
            document.getElementById('filterStudentYear').value = 'all'; 
        }
    }
}

function generateReport() {
    currentPage = 1;
    applyFilters(); 
}

// ==========================================
// 3. CORE LOGIC (FILTER)
// ==========================================
function applyFilters() { 
    // ใช้แค่ Log ที่เป็น END_SESSION (สิ้นสุดแล้ว)
    const allStatsLogs = allLogs.filter(l => l.action === 'END_SESSION' || l.action === undefined);

    const userModeEl = document.querySelector('input[name="userTypeOption"]:checked');
    const userMode = userModeEl ? userModeEl.value : 'all';
    const timeMode = document.getElementById('timeFilterType').value;
    const selectedFaculties = getCheckedValues('studentFacultyList');
    const selectedOrgs = getCheckedValues('staffOrgList');

    let isSingleYear = false;
    if (timeMode === 'yearly') {
        const yStart = document.getElementById('yearStart').value;
        const yEnd = document.getElementById('yearEnd').value;
        if (yStart === yEnd) isSingleYear = true;
    }

    let filteredLogs = allStatsLogs.filter(log => {
        const logDate = new Date(log.startTime || log.timestamp);
        const logFaculty = (log.userFaculty || "").trim();

        // Time Filtering
        if (timeMode === 'daily') {
            const start = new Date(document.getElementById('dateStart').value);
            const end = new Date(document.getElementById('dateEnd').value);
            if (!isNaN(start) && !isNaN(end)) {
                start.setHours(0,0,0,0); end.setHours(23,59,59,999);
                if (logDate < start || logDate > end) return false;
            }
        } else if (timeMode === 'monthly') {
            const mStart = new Date(document.getElementById('monthStart').value + "-01");
            const mEndInput = document.getElementById('monthEnd').value;
            const mEndParts = mEndInput.split('-');
            const mEnd = new Date(mEndParts[0], mEndParts[1], 0, 23, 59, 59);
            if (logDate < mStart || logDate > mEnd) return false;
        } else if (timeMode === 'yearly') {
            const yStart = parseInt(document.getElementById('yearStart').value);
            const yEnd = parseInt(document.getElementById('yearEnd').value);
            const logYear = logDate.getFullYear(); 
            if (logYear < yStart || logYear > yEnd) return false;
        }

        // Role & Group Filtering
        const role = (log.userRole || '').toLowerCase();
        if (userMode === 'student') {
            if (role !== 'student') return false;
            const isFacultyMatch = selectedFaculties.some(fac => fac.trim() === logFaculty);
            if (!isFacultyMatch) return false;

            const filterLevel = document.getElementById('filterEduLevel').value;
            const filterYear = document.getElementById('filterStudentYear').value;
            const userLevel = (log.userLevel || "").toString().trim();
            const userYear = (log.userYear || "").toString().trim();

            if (filterLevel !== 'all') {
                if (userLevel !== filterLevel) return false;
                if (filterLevel === 'ปริญญาตรี' && filterYear !== 'all') {
                    if (userYear !== filterYear) return false;
                }
            }
        } 
        else if (userMode === 'staff') {
            if (role !== 'staff' && role !== 'admin') return false;
            const currentLogFaculty = (log.userFaculty || "").replace(/["\\]/g, "").trim();
            return selectedOrgs.some(org => {
                const selectedOrgClean = org.replace(/["\\]/g, "").trim();
                return currentLogFaculty.includes(selectedOrgClean) || selectedOrgClean.includes(currentLogFaculty);
            });
        }
        else if (userMode === 'external') {
            if (role !== 'external') return false;
        }
        
        return true;
    });

    // กราฟข้อมูล
    let distributionData = {};
    const timeChartData = {};

    filteredLogs.forEach(l => {
        let distLabel = l.userFaculty || 'ไม่ระบุ';
        if (userMode === 'all') {
            if (l.userRole === 'student') distLabel = "นักศึกษา";
            else if (l.userRole === 'staff' || l.userRole === 'admin') distLabel = "บุคลากร";
            else distLabel = "บุคคลภายนอก";
        }
        distributionData[distLabel] = (distributionData[distLabel] || 0) + 1;

        const dateObj = new Date(l.startTime || l.timestamp);
        let timeLabel;

        if (timeMode === 'daily' || timeMode === 'monthly') {
            timeLabel = dateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        } else if (timeMode === 'yearly') {
            if (isSingleYear) timeLabel = dateObj.toLocaleDateString('th-TH', { month: 'long' });
            else timeLabel = (dateObj.getFullYear() + 543).toString();
        }
        timeChartData[timeLabel] = (timeChartData[timeLabel] || 0) + 1;
    });

    updateSummaryCards(filteredLogs);
    drawDistributionBarChart(distributionData);
    drawDailyTrendLineChart(timeChartData, timeMode, isSingleYear);

    const globalChartData = processLogsForCharts(filteredLogs, timeMode);
    
    if (topSoftwareChartInstance) topSoftwareChartInstance.destroy();
    topSoftwareChartInstance = drawTopSoftwareChart(globalChartData.softwareStats);
    
    if (pieChartInstance) pieChartInstance.destroy();
    pieChartInstance = drawAIUsagePieChart(globalChartData.aiUsageData);
    
    drawSatisfactionChart(globalChartData.satisfactionData);
    renderFeedbackComments(filteredLogs);
    renderLogHistory(filteredLogs);
}

// ==========================================
// 4. CHART & RENDER FUNCTIONS
// ==========================================

function updateSummaryCards(data) {
    const uniqueUsers = new Set(data.map(log => log.userId)).size;
    const sessionCount = data.length;
    let totalMinutes = 0;
    data.forEach(log => { totalMinutes += (log.durationMinutes || 0); });
    const totalHours = (totalMinutes / 60).toFixed(1);

    animateValue("resultUserCount", 0, uniqueUsers, 500); 
    animateValue("resultSessionCount", 0, sessionCount, 500);
    animateValue("resultTotalHours", 0, parseFloat(totalHours), 500);
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    if(!obj) return;
    obj.innerHTML = end.toLocaleString(); 
}

function drawDistributionBarChart(data) {
    const ctx = document.getElementById('distributionBarChart');
    if (!ctx) return;
    if (distributionBarInstance) distributionBarInstance.destroy();

    const customOrder = { "นักศึกษา": 1, "บุคลากร": 2, "บุคคลภายนอก": 3 };
    
    const sortedData = Object.entries(data).sort((a, b) => {
        const orderA = customOrder[a[0]] || 99;
        const orderB = customOrder[b[0]] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return b[1] - a[1];
    });

    distributionBarInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedData.map(x => x[0]),
            datasets: [{
                label: 'จำนวนครั้ง',
                data: sortedData.map(x => Math.floor(x[1])),
                backgroundColor: '#0d6efd',
                borderRadius: 4,
                categoryPercentage: 0.3, 
                barPercentage: 0.5,
                maxBarThickness: 35
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 }, grid: { drawBorder: true } },
                x: { grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function drawDailyTrendLineChart(dailyData, timeMode, isSingleYear = false) {
    const ctx = document.getElementById('dailyTrendLineChart');
    if (!ctx) return;
    if (dailyTrendLineInstance) dailyTrendLineInstance.destroy();

    let labels = [];
    let dataPoints = [];

    if (timeMode === 'yearly') {
        if (isSingleYear) {
            labels = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
            dataPoints = labels.map(month => dailyData[month] || 0);
        } else {
            const yStart = parseInt(document.getElementById('yearStart').value);
            const yEnd = parseInt(document.getElementById('yearEnd').value);
            for (let y = yStart; y <= yEnd; y++) {
                const bYear = y + 543;
                labels.push(bYear.toString());
                dataPoints.push(dailyData[bYear.toString()] || 0);
            }
        }
    } 
    else if (timeMode === 'daily' || timeMode === 'monthly') {
        let startD, endD;
        if (timeMode === 'daily') {
            startD = new Date(document.getElementById('dateStart').value);
            endD = new Date(document.getElementById('dateEnd').value);
        } else {
            const mStartVal = document.getElementById('monthStart').value;
            const mEndVal = document.getElementById('monthEnd').value;
            startD = new Date(mStartVal + "-01");
            endD = new Date(mEndVal.split('-')[0], mEndVal.split('-')[1], 0);
        }

        if (startD && endD && !isNaN(startD) && !isNaN(endD)) {
            let curr = new Date(startD);
            while (curr <= endD) {
                const dateStr = curr.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
                labels.push(dateStr);
                dataPoints.push(dailyData[dateStr] || 0);
                curr.setDate(curr.getDate() + 1);
            }
        }
    } 
    else {
        labels = Object.keys(dailyData);
        dataPoints = labels.map(d => dailyData[d]);
    }

    dailyTrendLineInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'จำนวนครั้งการใช้งาน',
                data: dataPoints,
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0, 
                pointBackgroundColor: '#198754',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
            plugins: { legend: { display: false } }
        }
    });
}

function processLogsForCharts(logs, mode) {
    const result = {
        aiUsageData: { ai: 0, nonAI: 0 },
        satisfactionData: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: 0 },
        softwareStats: {}
    };
    
    logs.forEach(log => {
        if (log.isAIUsed) result.aiUsageData.ai++; else result.aiUsageData.nonAI++;

        if (Array.isArray(log.usedSoftware)) {
            log.usedSoftware.forEach(sw => {
                const name = sw.split('(')[0].trim();
                result.softwareStats[name] = (result.softwareStats[name] || 0) + 1;
            });
        }

        if (log.satisfactionScore) {
            const score = parseInt(log.satisfactionScore);
            if (score >= 1 && score <= 5) {
                result.satisfactionData[score]++;
                result.satisfactionData.total++;
            }
        }
    });
    return result;
}

function drawTopSoftwareChart(data) {
    const ctx = document.getElementById('topSoftwareChart');
    if(!ctx) return;
    const sorted = Object.entries(data).sort((a,b) => b[1] - a[1]).slice(0, 10);
    const grandTotal = Object.values(data).reduce((acc, val) => acc + val, 0);

    const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 400, 0);
    gradient.addColorStop(0, '#0dcaf0'); gradient.addColorStop(1, '#0d6efd');

    return new Chart(ctx, {
        type: 'bar',
        data: { 
            labels: sorted.map(x=>x[0]), 
            datasets: [{ 
                label: 'จำนวนการใช้งาน', data: sorted.map(x=>x[1]), 
                backgroundColor: gradient, borderRadius: 5, barPercentage: 0.6 
            }] 
        },
        options: { 
            indexAxis: 'y', responsive: true, maintainAspectRatio: false, 
            plugins: { legend: {display:false} } 
        }
    });
}

function drawAIUsagePieChart(d) { 
    return new Chart(document.getElementById('aiUsagePieChart'), { 
        type: 'doughnut', 
        data: { 
            labels: ['AI Tools', 'General Use'], 
            datasets: [{ 
                data: [d.ai, d.nonAI], backgroundColor: ['#ffc107', '#6c757d'], hoverOffset: 4
            }] 
        }, 
        options: { responsive: true, maintainAspectRatio: false, cutout: '65%' } 
    }); 
}

function drawSatisfactionChart(data) {
    const total = data.total || 0;
    let avgScore = 0.0;
    if (total > 0) {
        avgScore = ((data[5]*5) + (data[4]*4) + (data[3]*3) + (data[2]*2) + (data[1]*1)) / total; 
    }
    const scoreEl = document.getElementById('satisfactionAvgScore');
    const starsEl = document.getElementById('satisfactionStars');
    const countEl = document.getElementById('satisfactionTotalCount');
    
    if(scoreEl) {
        scoreEl.innerText = avgScore.toFixed(1);
        scoreEl.className = `fw-bold mb-0 me-3 ${avgScore >= 4 ? 'text-success' : 'text-warning'}`;
    }
    
    if(countEl) countEl.innerText = `จากผู้ใช้งานทั้งหมด ${total.toLocaleString()} คน`;

    const container = document.getElementById('satisfactionProgressBars');
    if(!container) return;
    container.innerHTML = '';
    
    const colors = { 5: '#3498db', 4: '#2ecc71', 3: '#f1c40f', 2: '#e67e22', 1: '#e74c3c' };
    for(let i=5; i>=1; i--) {
        const count = data[i] || 0;
        const percent = total > 0 ? ((count / total) * 100).toFixed(0) : 0;
        container.innerHTML += `
            <div class="d-flex align-items-center mb-2" style="height: 24px;">
                <div class="me-2 text-end" style="width: 35px;"><span class="small fw-bold">${i}</span>⭐</div>
                <div class="flex-grow-1 progress" style="height: 8px;">
                    <div class="progress-bar" style="width: ${percent}%; background-color: ${colors[i]};"></div>
                </div>
                <div class="ms-2" style="width: 50px;"><span class="small fw-bold">${percent}%</span></div>
            </div>`;
    }
}

// ==========================================
// 5. TABLE & EXPORT
// ==========================================
function renderLogHistory(logs) {
    filteredLogsGlobal = logs || [];
    const totalItems = filteredLogsGlobal.length;
    const tbody = document.getElementById('logHistoryTableBody');
    if (!tbody) return;

    if (totalItems === 0) {
        tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted py-5">ไม่พบข้อมูลประวัติการใช้งาน</td></tr>`;
        updatePaginationControls(0, 0, 0);
        return;
    }

    const totalPages = Math.ceil(totalItems / rowsPerPage);
    if (currentPage > totalPages) currentPage = 1;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = Math.min(startIndex + rowsPerPage, totalItems);
    
    const currentLogs = filteredLogsGlobal
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(startIndex, endIndex);

    tbody.innerHTML = currentLogs.map((log, i) => {
        const dateObj = new Date(log.timestamp);
        const dateStr = dateObj.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const timeStr = dateObj.toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'});
        const score = log.satisfactionScore ? `<span class="text-warning fw-bold">⭐ ${log.satisfactionScore}</span>` : '-';
        
        return `
            <tr>
                <td class="text-muted small">${startIndex + i + 1}</td>
                <td class="fw-bold text-primary">${log.userId || '-'}</td>
                <td>${log.userName || 'Unknown'}</td>
                <td>${log.usedSoftware ? log.usedSoftware.join(', ') : '-'}</td>
                <td>${dateStr}</td>
                <td>${timeStr}</td>
                <td>${log.userFaculty || '-'}</td>
                <td>${log.userYear ? `ปี ${log.userYear}` : '-'}</td>
                <td><span class="badge bg-secondary">${log.userRole || 'Guest'}</span></td>
                <td><span class="badge bg-dark">PC-${log.pcId}</span></td>
                <td>${score}</td>
            </tr>
        `;
    }).join('');

    updatePaginationControls(totalItems, startIndex + 1, endIndex);
}

function updatePaginationControls(totalItems, startItem, endItem) {
    const infoEl = document.getElementById('paginationInfo');
    const navEl = document.getElementById('paginationControls');
    
    if (infoEl) infoEl.innerText = `แสดง ${startItem} - ${endItem} จากทั้งหมด ${totalItems} รายการ`;
    if (!navEl) return;
    
    const totalPages = Math.ceil(totalItems / rowsPerPage);
    let html = `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="goToPage(${currentPage - 1}); return false;">&laquo;</a></li>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<li class="page-item ${i === currentPage ? 'active' : ''}"><a class="page-link" href="#" onclick="goToPage(${i}); return false;">${i}</a></li>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    html += `<li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}"><a class="page-link" href="#" onclick="goToPage(${currentPage + 1}); return false;">&raquo;</a></li>`;
    navEl.innerHTML = html;
}

function goToPage(page) {
    if (page < 1) return;
    currentPage = page;
    renderLogHistory(filteredLogsGlobal); 
}

function renderFeedbackComments(logs) {
    const container = document.getElementById('feedbackCommentList');
    if (!container) return;
    const comments = logs.filter(log => log.comment && log.comment.trim() !== "");
    document.getElementById('commentCount').innerText = comments.length;

    if (comments.length === 0) {
        container.innerHTML = `<div class="text-center text-muted mt-5">ยังไม่มีข้อเสนอแนะในขณะนี้</div>`;
        return;
    }

    container.innerHTML = comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(log => {
        return `
            <div class="card border-0 shadow-sm mb-2 border-start border-4 border-primary">
                <div class="card-body p-2">
                    <div class="fw-bold">${log.userName || 'Unknown'} <small class="text-warning">⭐ ${log.satisfactionScore || 5}</small></div>
                    <p class="mb-1 text-secondary small">"${log.comment}"</p>
                    <small class="text-muted" style="font-size: 0.7rem;">PC-${log.pcId} | ${new Date(log.timestamp).toLocaleString('th-TH')}</small>
                </div>
            </div>`;
    }).join('');
}

function renderLifetimeStats() {
    const logs = fetchLogsData();
    const total = logs.length;
    const internal = logs.filter(l => l.userRole === 'student' || l.userRole === 'staff').length;
    const external = total - internal; 

    if(document.getElementById('lifetimeTotalCount')) document.getElementById('lifetimeTotalCount').innerText = total.toLocaleString();
    if(document.getElementById('lifetimeInternal')) document.getElementById('lifetimeInternal').innerText = internal.toLocaleString();
    if(document.getElementById('lifetimeExternal')) document.getElementById('lifetimeExternal').innerText = external.toLocaleString();
    if (total > 0) {
        if(document.getElementById('progInternal')) document.getElementById('progInternal').style.width = `${(internal / total) * 100}%`;
        if(document.getElementById('progExternal')) document.getElementById('progExternal').style.width = `${(external / total) * 100}%`;
    }
}

// ==========================================
// 6. CSV EXPORT & IMPORT
// ==========================================
function downloadLogTemplate() {
    const headers = ["ลำดับ", "รหัสผู้ใช้งาน", "ชื่อ-สกุล", "AI/Software ที่ใช้", "วันที่ใช้บริการ", "ช่วงเวลาใช้บริการ", "รหัสคณะ/สำนัก", "สถานะ", "PC ที่ใช้", "ระยะเวลา (นาที)", "ความพึงพอใจ (Score)"];
    const sampleRows = [
        ["1", "66123456", "นายสมชาย ตัวอย่าง", "VS Code; ChatGPT", "17/01/2026", "09:00 - 10:30", "คณะวิทยาศาสตร์", "นักศึกษา", "PC-01", "90", "5"]
    ];
    let csvContent = "\uFEFF" + headers.join(",") + "\n" + sampleRows.map(row => row.join(",")).join("\n");
    triggerDownload(csvContent, "CKLab_Log_Template.csv");
}

function exportReport(mode) {
    alert('สำหรับเวอร์ชั่นที่เชื่อมต่อกับ Django แนะนำให้ใช้ปุ่ม Export All จาก Backend ของระบบครับ (หรือสามารถแก้ให้เรียกข้อมูลหน้าบ้านออกไปแทนได้)');
}

function exportAllLogs() {
    // ใช้ข้อมูลที่ผ่านการกรองแล้ว (Filtered Data)
    const dataToExport = (filteredLogsGlobal && filteredLogsGlobal.length > 0) ? filteredLogsGlobal : [];
    if (dataToExport.length === 0) {
        alert("ไม่พบข้อมูลตามเงื่อนไขที่กำหนด (0 รายการ)");
        return;
    }
    
    if (!confirm(`ยืนยันการ Export ข้อมูล (${dataToExport.length} รายการ)?`)) return;
    
    const headers = ["ลำดับ", "รหัสผู้ใช้งาน", "ชื่อ-สกุล", "AI/Software", "วันที่", "สถานะ", "PC ที่ใช้", "ความพึงพอใจ"];
    const csvRows = dataToExport.map((log, index) => {
        const dateStr = new Date(log.timestamp).toLocaleDateString('th-TH');
        return [`"${index + 1}"`, `"${log.userId || '-'}"`, `"${log.userName || '-'}"`, `"${log.usedSoftware ? log.usedSoftware.join(';') : '-'}"`, `"${dateStr}"`, `"${log.userRole}"`, `"PC-${log.pcId}"`, `"${log.satisfactionScore || '-'}"`].join(',');
    });
    
    const csvContent = "\uFEFF" + [headers.join(','), ...csvRows].join('\n');
    triggerDownload(csvContent, "CKLab_Filtered_Report.csv");
}

function triggerDownload(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleLogImport(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) { processLogCSV(e.target.result); };
    reader.readAsText(file);
    input.value = '';
}

// วางทับฟังก์ชัน processLogCSV เดิมที่อยู่ล่างสุดใน admin-report.js

function processLogCSV(csvText) {
    const lines = csvText.split('\n').map(l => l.trim()).filter(l => l);
    const dataLines = lines.slice(1);
    
    if (dataLines.length === 0) {
        alert("❌ ไม่พบข้อมูลในไฟล์ CSV");
        return;
    }

    let successCount = 0;
    let failCount = 0;
    let importedLogs = [];

    dataLines.forEach((line, index) => {
        const cleanLine = line.replace(/"/g, '');
        const cols = cleanLine.split(',');

        if (cols.length < 5) { failCount++; return; }

        try {
            const userId = cols[1];
            const name = cols[2];
            const softwareStr = cols[3];
            const dateStr = cols[4]; 
            const timeRange = cols[5]; 
            const faculty = cols[6];
            let roleRaw = cols[7];
            const pcName = cols[8];
            const duration = parseFloat(cols[9]) || 0;
            const score = cols[10] === '-' ? null : parseInt(cols[10]);

            let role = 'guest';
            if (roleRaw.includes('นักศึกษา')) role = 'student';
            else if (roleRaw.includes('บุคลากร')) role = 'staff';
            else if (roleRaw.includes('ภายนอก')) role = 'external';

            // Parsing วันที่และเวลา
            const [dd, mm, yyyy] = dateStr.split('/');
            const yearAD = parseInt(yyyy) - 543;
            
            const timeParts = timeRange.split('-');
            const startTimeStr = timeParts[0].trim(); 
            const endTimeStr = timeParts.length > 1 ? timeParts[1].trim() : startTimeStr; 

            const [startHr, startMin] = startTimeStr.split(':');
            const [endHr, endMin] = endTimeStr.split(':');

            const timestampStart = new Date(yearAD, parseInt(mm)-1, parseInt(dd), parseInt(startHr), parseInt(startMin));
            const timestampEnd = new Date(yearAD, parseInt(mm)-1, parseInt(dd), parseInt(endHr), parseInt(endMin));
            
            const usedSoftware = (softwareStr && softwareStr !== '-') ? softwareStr.split(';').map(s => s.trim()) : [];
            const isAI = usedSoftware.some(s => s.toLowerCase().includes('gpt') || s.toLowerCase().includes('claude') || s.toLowerCase().includes('ai'));

            const newLog = {
                timestamp: timestampEnd.toISOString(),
                startTime: timestampStart.toISOString(),
                action: 'END_SESSION', 
                userId: userId,
                userName: name,
                userRole: role,
                userFaculty: faculty,
                pcId: pcName.replace('PC-', ''),
                durationMinutes: duration,
                usedSoftware: usedSoftware,
                isAIUsed: isAI,
                satisfactionScore: score,
                imported: true 
            };

            importedLogs.push(newLog);
            successCount++;

        } catch (err) {
            console.error("Parse Error row " + (index+2), err);
            failCount++;
        }
    });

    if (successCount > 0) {
        // นำข้อมูลใหม่ที่เพิ่ง Import ไปต่อท้ายข้อมูลเดิมที่มีอยู่
        allLogs = [...allLogs, ...importedLogs]; 
        lastLogCount = allLogs.length;
        
        applyFilters(); // รีเฟรชกราฟและตาราง
        if (typeof renderLifetimeStats === 'function') renderLifetimeStats();
        
        alert(`✅ Import สำเร็จ: ${successCount} รายการ\n❌ ล้มเหลว: ${failCount} รายการ\n(หมายเหตุ: ข้อมูลนี้แสดงผลชั่วคราว ยังไม่ได้ถูกบันทึกลง Database)`);
    } else {
        alert("❌ ไม่สามารถนำเข้าข้อมูลได้ (รูปแบบไฟล์ไม่ถูกต้อง)");
    }
}