/* timer.js - Fixed Version (Stable Timer & Functional Logout) */

let timerInterval = null;
let syncInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // ดึงข้อมูลจาก Global Variable ที่ส่งมาจาก Django HTML
    const session = window.djangoData;

    if (!session || !session.startTime) {
        console.error("ไม่พบข้อมูล Session");
        return;
    }

    // แสดงชื่อผู้ใช้
    const userNameEl = document.getElementById('userNameDisplay');
    if(userNameEl) {
        userNameEl.innerText = session.userName || "ผู้ใช้งานทั่วไป";
    }
    
    // แสดงชื่อเครื่องและสถานะ
    const pcNameEl = document.getElementById('pcNameDisplay');
    if (pcNameEl) {
        const pcIdDisplay = session.pcId ? session.pcId.toString().padStart(2, '0') : '??';
        pcNameEl.innerText = `Station: PC-${pcIdDisplay}`;
    }

    // เริ่มการทำงานของ Timer
    initTimer(session);

    // เริ่มระบบตรวจสอบสถานะจาก Admin (Sync)
    startSyncWithAdmin(session.monitorUrl);
});

function initTimer(session) {
    // เคลียร์ Interval เดิมถ้ามี (ป้องกันเวลาเดินเร็วเกินไปจากความซ้ำซ้อน)
    if (timerInterval) clearInterval(timerInterval);

    if (session.forceEndTime) {
        setupCountdownMode(session);
    } else {
        setupUnlimitedMode(session);
    }
}

function setupCountdownMode(session) {
    const label = document.getElementById('timerLabel');
    if(label) label.innerText = "เวลาที่เหลือ (Remaining Time)";

    const [targetH, targetM] = session.forceEndTime.split(':').map(Number);
    const targetDate = new Date();
    targetDate.setHours(targetH, targetM, 0, 0);

    const updateCountdown = () => {
        const now = new Date().getTime();
        const diff = targetDate.getTime() - now;
        const display = document.getElementById('timerDisplay');

        if (diff <= 0) {
            clearInterval(timerInterval);
            if(display) display.innerText = "00:00:00";
            handleTimeUp();
            return;
        }

        if(display) {
            display.innerText = formatTime(diff);
            if (diff < 5 * 60 * 1000) {
                display.classList.add('text-danger');
                showAlert('⚠️ ใกล้หมดเวลาแล้ว! กรุณาบันทึกงาน');
            }
        }
    };

    updateCountdown();
    timerInterval = setInterval(updateCountdown, 1000);
}

function setupUnlimitedMode(session) {
    const label = document.getElementById('timerLabel');
    if(label) label.innerText = "เวลาที่ใช้งานไป (Elapsed Time)";
    
    // ตรวจสอบรูปแบบเวลาให้ถูกต้องสำหรับการสร้าง Date Object
    const startTime = new Date(session.startTime).getTime();

    const updateElapsed = () => {
        const now = new Date().getTime();
        let diff = now - startTime;
        if (diff < 0) diff = 0;
        
        const display = document.getElementById('timerDisplay');
        if(display) display.innerText = formatTime(diff);
    };

    updateElapsed();
    timerInterval = setInterval(updateElapsed, 1000);
}

/**
 * ฟังก์ชัน Logout (Check-out)
 * ต้องประกาศเป็น window.doCheckout เพื่อให้ HTML เรียกใช้งานได้
 */
window.doCheckout = function() {
    if (confirm('คุณต้องการเลิกใช้งานและออกจากระบบใช่หรือไม่?')) {
        // เคลียร์การทำงานทั้งหมดก่อนไปหน้าถัดไป
        if (timerInterval) clearInterval(timerInterval);
        if (syncInterval) clearInterval(syncInterval);
        
        // ไปยัง URL หน้า Feedback ที่ส่งมาจาก Django
        window.location.href = window.djangoData.feedbackUrl;
    }
};

function startSyncWithAdmin(url) {
    if (syncInterval) clearInterval(syncInterval);
    
    syncInterval = setInterval(() => {
        fetch(url)
            .then(response => response.json())
            .then(data => {
                const myPC = data.data.find(pc => String(pc.pc_id) === String(window.djangoData.pcId));
                // ถ้าสถานะเป็น available แสดงว่า Admin สั่งเตะออก
                if (myPC && myPC.status === 'available') {
                    if (timerInterval) clearInterval(timerInterval);
                    clearInterval(syncInterval);
                    alert("⚠️ เจ้าหน้าที่ได้ทำการเช็คเอาท์ให้คุณแล้ว");
                    window.location.href = window.djangoData.indexUrl;
                }
            })
            .catch(err => console.error("Sync error:", err));
    }, 10000);
}

function formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
}

function handleTimeUp() {
    alert("⏰ หมดเวลาการใช้งานแล้ว ระบบจะพาคุณไปหน้าประเมินผล");
    window.location.href = window.djangoData.feedbackUrl;
}

function showAlert(msg) {
    const box = document.getElementById('alertBox');
    if(box) {
        box.classList.remove('d-none');
        const msgEl = document.getElementById('alertMsg');
        if(msgEl) msgEl.innerText = msg;
    }
}