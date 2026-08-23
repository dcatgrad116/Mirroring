document.addEventListener('DOMContentLoaded', () => {
  
    function createCarousel(trackId, prevBtnId, nextBtnId, autoInterval = 4000) {
        const track = document.getElementById(trackId);
        const prevBtn = document.getElementById(prevBtnId);
        const nextBtn = document.getElementById(nextBtnId);

        if (!track || !prevBtn || !nextBtn) return;
        const frameContainer = track.closest('.glass-slider-frame') || track.parentElement;
        const slides = track.querySelectorAll('.slide-item');
        const total = slides.length;
        let index = 0;
        let timer = null;

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

        nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showNext();
            resetAuto();
        });

        
        prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showPrev();
            resetAuto();
        });

       
        function startAuto() {
            timer = setInterval(showNext, autoInterval);
        }

        function resetAuto() {
            clearInterval(timer);
            startAuto();
        }

        frameContainer.addEventListener('mouseenter', () => clearInterval(timer));
        frameContainer.addEventListener('mouseleave', () => startAuto());
        startAuto();
    }

    createCarousel('project-track', 'project-prev', 'project-next', 4000);
    createCarousel('paper-track', 'paper-prev', 'paper-next', 4000);
});