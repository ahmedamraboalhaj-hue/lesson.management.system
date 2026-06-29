/**
 * ============================================================
 *  demo-mode.js  —  نسخة العرض التجريبية
 *  Demo Mode — Auto-enter dashboard, session writes, clear on close
 *  Designed & Developed By: ENG Ahmed Amr Aboulhaj
 * ============================================================
 */

window.DEMO_MODE = true;

// ──────────────────────────────────────────────────────────────
//  1. StorageEngine: كتابة في الـ session فقط، مسح عند الإغلاق
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    const patchStorageEngine = () => {
        if (typeof StorageEngine === 'undefined') {
            setTimeout(patchStorageEngine, 100);
            return;
        }

        const _demoAdded = {
            students: new Set(), attendance: new Set(), payments: new Set(),
            expenses: new Set(), exams: new Set(), scores: new Set(),
            groups: new Set(), cycles: new Set(), rewards: new Set(),
            handouts: new Set(), studentHandouts: new Set(), waQueue: new Set()
        };

        const _originalSave   = StorageEngine.save.bind(StorageEngine);
        const _originalDelete = StorageEngine.delete.bind(StorageEngine);

        StorageEngine.save = async function(storeName, data) {
            const arr = Array.isArray(data) ? data : [data];
            if (_demoAdded[storeName]) {
                arr.forEach(item => { if (item && item.id) _demoAdded[storeName].add(String(item.id)); });
            }
            return _originalSave(storeName, data);
        };

        window.addEventListener('beforeunload', () => {
            for (const [storeName, ids] of Object.entries(_demoAdded)) {
                ids.forEach(id => {
                    try { _originalDelete(storeName, id); } catch(e) {}
                });
            }
        });

        console.info('[DEMO] StorageEngine — session-only writes ✓');
    };

    patchStorageEngine();

    // ──────────────────────────────────────────────────────────
    //  2. Auto-enter dashboard — تجاوز بوابة اختيار المرحلة
    //     بيشتغل بعد window.onload بوقت كافي
    // ──────────────────────────────────────────────────────────
    const demoDashboardEnter = () => {
        // لو عنده grade وgroup محفوظين من قبل → اتركه يدخل تلقائي عادي
        if (localStorage.getItem('edu_active_grade') && localStorage.getItem('edu_active_group')) return;

        // اختار أول grade وأول group متاحين
        const grades = window.gradesList || [];
        const groups = (window.db && window.db.groups) || [];

        const firstGrade = grades[0];
        const firstGroup = groups[0];

        if (!firstGrade) return; // لو مفيش بيانات أصلاً

        const gradeId  = String(firstGrade.id);
        const sysCode  = typeof gradeIdToSystemCode === 'function'
            ? gradeIdToSystemCode(gradeId)
            : gradeId;

        // حفظ في localStorage عشان التطبيق يتعرف عليهم
        localStorage.setItem('edu_active_grade', sysCode);
        window.currentGrade = sysCode;

        if (firstGroup) {
            localStorage.setItem('edu_active_group', String(firstGroup.id));
            window.currentGroupId = String(firstGroup.id);
        }

        // إخفاء كل الـ overlays
        ['grade-selection-overlay','group-selection-overlay','portal-overlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // تحديث الـ badge
        const badge = document.getElementById('current-grade-badge');
        if (badge) {
            const gradeLabel = firstGrade.name || sysCode;
            const groupLabel = firstGroup ? ` · ${firstGroup.name}` : '';
            badge.innerText = gradeLabel + groupLabel;
        }

        // فتح الـ dashboard
        if (typeof showSection === 'function') showSection('dashboard');
        if (typeof syncUIWithContext === 'function') syncUIWithContext();

        console.info(`[DEMO] Auto-entered dashboard — grade: ${sysCode}, group: ${firstGroup?.id}`);
    };

    // ننتظر window.onload ينتهي (+800ms) عشان التطبيق يكون حمّل بياناته
    window.addEventListener('load', () => {
        setTimeout(demoDashboardEnter, 800);
    });

    // ──────────────────────────────────────────────────────────
    //  3. شريط Demo Banner
    // ──────────────────────────────────────────────────────────
    const demoBanner = document.createElement('div');
    demoBanner.id = 'demo-banner';
    demoBanner.innerHTML = `
        <span>🚀</span>
        <span style="flex:1;text-align:center">نسخة تجريبية للعرض · Demo Mode · البيانات المضافة لا تُحفظ بعد الإغلاق</span>
        <span>🚀</span>
    `;
    demoBanner.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 99999;
        background: linear-gradient(90deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #1a1a2e 100%);
        border-bottom: 2px solid #f59e0b;
        color: #f59e0b;
        text-align: center;
        padding: 6px 16px;
        font-size: 0.78rem;
        font-weight: 700;
        font-family: 'Tajawal', 'Cairo', sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        box-shadow: 0 2px 20px rgba(245,158,11,0.3);
    `;
    document.body.prepend(demoBanner);
    document.documentElement.style.setProperty('--demo-banner-height', '34px');

    console.info('[DEMO] Banner injected ✓');
});

// ──────────────────────────────────────────────────────────────
//  4. تجاوز كلمات المرور تلقائياً
// ──────────────────────────────────────────────────────────────
const _origPrompt = window.prompt;
window.prompt = function(msg, def) {
    if (msg && (msg.includes('كلمة المرور') || msg.includes('password') || msg.includes('PIN'))) {
        const pw = { main:'2446', finance:'4321', unlockPayment:'100qwe', endSubscription:'01000' };
        return pw.finance;
    }
    return _origPrompt.call(window, msg, def);
};
