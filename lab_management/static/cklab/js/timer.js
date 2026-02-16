/**
 * Timer Logic for Kiosk System
 * รับค่า Config มาจาก window.djangoData (ประกาศไว้ใน timer.html)
 */

let timerInterval = null;
let syncInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    // 1. รับค่าตัวแปรจาก Django Template
    const session = window.djangoData;
    
    // Safety Check: ถ้าไม่มีข้อมูล session ให้หยุดทำงาน
    if (!session) {
        console.error("Django Session Data not found!");
        return;
    }

    // ------------------------------------------------
    // ส่วนที่ 1: ระบบจับเวลา (Timer)
    // ------------------------------------------------
    const startTime = new Date(session.startTime).getTime();
    
    function updateTimer() {
        const now = new Date().getTime();
        let diff = now - startTime;
        
        // ป้องกันเวลาติดลบ (กรณี Clock เครื่อง Client ช้ากว่า Server)
        if (diff < 0) diff = 0;
        
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        const display = document.getElementById('timerDisplay');
        if (display) {
            // Format: HH:MM:SS (เติม 0 ข้างหน้าถ้าเลขหลักเดียว)
            display.innerText = `${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}:${seconds.toString().padStart(2,'0')}`;
        }
    }
    
    // เริ่มทำงานทันที และอัปเดตทุก 1 วินาที
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);

    // ------------------------------------------------
    // ส่วนที่ 2: ระบบ Sync กับ Server (Heartbeat)
    // ------------------------------------------------
    syncInterval = setInterval(() => {
        fetch(session.monitorUrl)
            .then(res => {
                if (!res.ok) throw new Error("Network response was not ok");
                return res.json();
            })
            .then(data => {
                // แปลง pc_id เป็น String ทั้งคู่เพื่อป้องกันปัญหา Type Mismatch
                const myPC = data.data.find(pc => String(pc.pc_id) === String(session.pcId));
                
                // ถ้าสถานะเปลี่ยนเป็น available แสดงว่า Admin สั่งตัดจบ หรือ Session หมดอายุ
                if (myPC && myPC.status === 'available') {
                    // Redirect กลับหน้าแรก (URL จะมี ?pc=... ติดไปด้วยตามที่ตั้งไว้)
                    window.location.href = session.indexUrl;
                }
            })
            .catch(err => {
                console.warn("Sync Warning: Connection to server lost temporarily.", err);
            });
    }, 5000); // ตรวจสอบทุกๆ 5 วินาที
});

// ------------------------------------------------
// ส่วนที่ 3: ฟังก์ชัน Checkout (Export ให้ HTML เรียกใช้ได้)
// ------------------------------------------------
window.doCheckout = function() {
    if (confirm('ยืนยันการเลิกใช้งาน?')) {
        // ส่งต่อไปยังหน้า Feedback (ซึ่งจะทำการ Logout และ Clear Session)
        window.location.href = window.djangoData.feedbackUrl;
    }
};