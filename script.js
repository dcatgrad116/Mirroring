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
