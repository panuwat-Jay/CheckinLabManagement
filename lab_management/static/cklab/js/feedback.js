document.addEventListener('DOMContentLoaded', () => {
    const stars = document.querySelectorAll('.star-rating span');
    const ratingInput = document.getElementById('ratingInput');
    const rateText = document.getElementById('rateText');
    const starContainer = document.getElementById('starContainer');

    const RATING_DATA = { 
        1: { text: "ต้องปรับปรุง (1/5)", color: "#dc3545" }, 
        2: { text: "พอใช้ (2/5)", color: "#fd7e14" }, 
        3: { text: "ปานกลาง (3/5)", color: "#ffc107" }, 
        4: { text: "ดี (4/5)", color: "#0d6efd" }, 
        5: { text: "ยอดเยี่ยม (5/5)", color: "#198754" } 
    };

    let currentRating = 5;

    function updateStarsUI(score) {
        stars.forEach((star, index) => {
            const starValue = index + 1;
            if (starValue <= score) {
                star.classList.add('active'); // จะดึงสีทองจาก CSS
                star.style.color = "#ffc107";
            } else {
                star.classList.remove('active');
                star.style.color = "#ddd";
            }
        });

        if (rateText && RATING_DATA[score]) {
            rateText.innerText = RATING_DATA[score].text;
            rateText.style.color = RATING_DATA[score].color;
        }
    }

    // Initialize
    updateStarsUI(currentRating);

    stars.forEach((star, index) => {
        const val = index + 1;

        star.addEventListener('click', () => {
            currentRating = val;
            if (ratingInput) ratingInput.value = val;
            updateStarsUI(val);
            
            // Animation เล็กๆ
            star.style.transform = "scale(0.8)";
            setTimeout(() => { star.style.transform = "scale(1)"; }, 100);
        });

        star.addEventListener('mouseover', () => {
            updateStarsUI(val);
        });
    });

    if (starContainer) {
        starContainer.addEventListener('mouseleave', () => {
            updateStarsUI(currentRating);
        });
    }

    // C. เมื่อเมาส์ออกจากพื้นที่ดาวทั้งหมด (กลับไปค่าที่เลือกไว้)
    if (starContainer) {
        starContainer.addEventListener('mouseleave', () => {
            updateRatingUI(currentRating);
        });
    }
});