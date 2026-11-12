/* Memasang aplikasi Apps Script di iframe dan mengatur layar pembuka. */
(function () {
    'use strict';
    var root = document.documentElement;
    var frame = document.getElementById('app');
    var bantuan = document.getElementById('bantuan');
    var url = frame.getAttribute('data-src');
    var selesai = false;

    function siap() {
        if (selesai) return;
        selesai = true;
        root.classList.add('siap');
        try { frame.focus(); } catch (e) { /* abaikan */ }
    }
    function muat() { frame.src = url; }
    function cekOnline() { root.classList.toggle('offline', !navigator.onLine); }

    // Pasang listener dulu, baru isi src, agar event "load" tidak terlewat.
    frame.addEventListener('load', siap);
    if (navigator.onLine === false) {
        cekOnline();
    } else {
        muat();
    }

    // Bila lebih dari 12 detik belum tampil, beri jalan pintas membuka langsung.
    setTimeout(function () { if (!selesai) bantuan.hidden = false; }, 12000);

    window.addEventListener('offline', cekOnline);
    window.addEventListener('online', function () {
        cekOnline();
        if (!selesai) muat();
    });
})();
