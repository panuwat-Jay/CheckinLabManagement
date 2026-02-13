/* feedback.js - Django Version (UI Logic Only) */

// ข้อความและสีบรรยายระดับคะแนน
const RATING_TEXTS = {
    1: "ต้องปรับปรุง (Poor)", 
    2: "พอใช้ (Fair)", 
    3: "ปานกลาง (Good)", 
    4: "ดี (Very Good)", 
    5: "ยอดเยี่ยม (Excellent)"
};

const RATING_COLORS = {
    1: "#dc3545", // Red
    2: "#dc3545", // Red
    3: "#ffc107", // Yellow/Orange
    4: "#28a745", // Green
    5: "#198754"  // Dark Green
};

let currentRate = 5;

document.addEventListener('DOMContentLoaded', () => {
    // 1. ตั้งค่าเริ่มต้น 5 ดาว
    setRate(5);

    // 2. จัดการ Event การส่งฟอร์ม (ป้องกันกดซ้ำ)
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', function(e) {
            const btn = this.querySelector('button[type="submit"]');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>กำลังบันทึก...';
            }
        });
    }

    // 3. ผูก Event ให้กับดาวแต่ละดวง
    const stars = document.querySelectorAll('.star-rating span');
    stars.forEach(star => {
        // Hover Effect
        star.addEventListener('mouseover', function() {
            const val = parseInt(this.getAttribute('data-value'));
            hoverStar(val);
        });

        // Reset Hover
        star.addEventListener('mouseout', function() {
            resetHover();
        });

        // Click to Rate
        star.addEventListener('click', function() {
            const val = parseInt(this.getAttribute('data-value'));
            setRate(val);
        });
    });
});

// --- Functions จัดการดาว ---

function setRate(rate) {
    currentRate = rate;
    const stars = document.querySelectorAll('.star-rating span');
    const ratingInput = document.getElementById('ratingInput'); // Hidden Input ใน HTML
    const txtElement = document.getElementById('rateText');

    // 1. อัปเดต UI ดาว
    stars.forEach((star, index) => {
        const starVal = index + 1;
        if (starVal <= rate) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });

    // 2. อัปเดตข้อความและสี
    if (txtElement) {
        txtElement.innerText = `${RATING_TEXTS[rate]}`;
        txtElement.style.color = RATING_COLORS[rate];
    }

    // 3. อัปเดตค่าลง Input Hidden เพื่อส่งไป Django
    if (ratingInput) {
        ratingInput.value = rate;
    }
}

function hoverStar(rate) {
    const stars = document.querySelectorAll('.star-rating span');
    stars.forEach((star, index) => {
        const starVal = index + 1;
        if (starVal <= rate) {
            star.classList.add('hover-active');
        } else {
            star.classList.remove('hover-active');
        }
    });
}

function resetHover() {
    const stars = document.querySelectorAll('.star-rating span');
    stars.forEach(star => star.classList.remove('hover-active'));
}