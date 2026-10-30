$(function () {
    var $intro = $('#intro-video');
    var video = $('#intro-video-player')[0];

    var isMobile = window.matchMedia('(max-width: 430px)').matches;
    video.src = isMobile ? 'assets/video-phone.mp4' : 'assets/video-pc.mp4';

    $('body').addClass('intro-locked');

    var introEnded = false;
    function hideIntro() {
        if (introEnded) return;
        introEnded = true;
        $intro.addClass('fade-out');
        setTimeout(function () {
            $intro.remove();
            $('body').removeClass('intro-locked');
        }, 1000);
    }

    video.muted = true;
    var playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(function () {
            hideIntro();
        });
    }

    video.addEventListener('ended', hideIntro);
    video.addEventListener('error', hideIntro);

    // ===== 長按加速 =====
    var HOLD_DELAY = 70;   // 按住超過幾毫秒才算長按
    var FAST_RATE  = 3;     // 加速倍率
    var holdTimer  = null;

    function startHold(e) {
        if (introEnded) return;
        if (e.button !== undefined && e.button !== 0) return;  // 只認左鍵／手指
        clearTimeout(holdTimer);
        holdTimer = setTimeout(function () {
            video.playbackRate = FAST_RATE;
            $intro.addClass('speeding');
        }, HOLD_DELAY);
    }

    function endHold() {
        clearTimeout(holdTimer);
        video.playbackRate = 1;
        $intro.removeClass('speeding');
    }

    $intro.on('pointerdown', startHold);
    $intro.on('contextmenu', function (e) { e.preventDefault(); });
    $(window).on('pointerup pointercancel', endHold);

    var maxWaitTime = 8000;
    setTimeout(hideIntro, maxWaitTime);
});

// 導覽列
$('.menu').on('click', function () {
    $('.mob-wrapper').toggleClass('open');
});

$('.arrow').on('click', function(){
    $(this).closest('.mob-dropdown').toggleClass('open');
})
