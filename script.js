$(function () {
    var $intro = $('#intro-video');
    var video = $('#intro-video-player')[0];

    // 影片播放時鎖住頁面捲動
    $('body').addClass('intro-locked');

    // 淡出並移除 intro 遮罩的共用函式,避免重複觸發
    var introEnded = false;
    function hideIntro() {
        if (introEnded) return;
        introEnded = true;

        $intro.addClass('fade-out');

        // 等 CSS 淡出動畫跑完(要跟 style.css 的 transition 時間一致)再整個移除,
        // 移除後才解鎖捲動,體驗上比較順
        setTimeout(function () {
            $intro.remove();
            $('body').removeClass('intro-locked');
        }, 1000);
    }

    // 有些瀏覽器(尤其 Safari)光靠 HTML 的 muted 屬性不夠穩定,
    // 這裡用 JS 再次確保靜音,並主動呼叫 play() 觸發自動播放
    video.muted = true;
    var playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(function () {
            // 瀏覽器還是擋下自動播放的話,直接跳過 intro,不要讓畫面卡住
            hideIntro();
        });
    }

    // 影片正常播完 → 觸發淡出
    video.addEventListener('ended', hideIntro);

    // 影片載入失敗 → 直接跳過
    video.addEventListener('error', hideIntro);

    // 保險機制:萬一以上狀況都沒觸發,超過安全時限就強制隱藏,
    // 依實際影片長度可調整這個數字(單位:毫秒)
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
