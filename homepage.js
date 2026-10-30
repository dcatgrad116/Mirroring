document.addEventListener('DOMContentLoaded', () => {
    function createCarousel(trackId, prevBtnId, nextBtnId) {
        const track = document.getElementById(trackId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);

        if (!track || !prevBtn || !nextBtn) return;
        const slides = track.querySelectorAll('.slide-item');
        const total = slides.length;
        let index = 0;

        function updatePosition() {
            track.style.transform = `translateX(-${index * 100}%)`;
        }

        function showNext() {
            index = (index + 1) % total;
            updatePosition();
        }

        function showPrev() {
            index = (index - 1 + total) % total;
            updatePosition();
        }

        // 僅在點擊「下一張」按鈕時切換
        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNext();
        });

        // 僅在點擊「上一張」按鈕時切換
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPrev();
        });
    }

    // 初始化專題組與論文組輪播（無自動播放）
    createCarousel('project-track', 'project-prev', 'project-next');
    createCarousel('paper-track', 'paper-prev', 'paper-next');
});
