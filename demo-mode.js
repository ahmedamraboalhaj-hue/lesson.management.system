/**
 * ============================================================
 *  demo-mode.js  —  نسخة العرض التجريبية
 *  Demo Mode — Session writes allowed, cleared on close
 *  Designed & Developed By: ENG Ahmed Amr Aboulhaj
 * ============================================================
 */

window.DEMO_MODE = true;

// ──────────────────────────────────────────────────────────────
//  1. StorageEngine: نسمح بالكتابة في الـ session فقط
//     وعند إغلاق التطبيق تُمسح البيانات المضافة تلقائياً
// ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

    const patchStorageEngine = () => {
        if (typeof StorageEngine === 'undefined') {
            setTimeout(patchStorageEngine, 100);
            return;
        }

        // تتبّع الـ IDs اللي اتضافت في الـ session عشان نمسحها عند الخروج
        const _demoAdded = {
            students: new Set(), attendance: new Set(), payments: new Set(),
            expenses: new Set(), exams: new Set(), scores: new Set(),
            groups: new Set(), cycles: new Set(), rewards: new Set(),
            handouts: new Set(), studentHandouts: new Set(), waQueue: new Set()
        };

        const _originalSave   = StorageEngine.save.bind(StorageEngine);
        const _originalDelete = StorageEngine.delete.bind(StorageEngine);

        // الكتابة مسموحة — بس نتتبّع الـ IDs الجديدة
        StorageEngine.save = async function(storeName, data) {
            const arr = Array.isArray(data) ? data : [data];
            if (_demoAdded[storeName]) {
                arr.forEach(item => { if (item && item.id) _demoAdded[storeName].add(String(item.id)); });
            }
            return _originalSave(storeName, data);
        };

        // مسح البيانات المضافة لما المستخدم يغلق/يعيد التحميل
        window.addEventListener('beforeunload', () => {
            for (const [storeName, ids] of Object.entries(_demoAdded)) {
                ids.forEach(id => {
                    try { _originalDelete(storeName, id); } catch(e) {}
                });
            }
        });

        console.info('[DEMO] StorageEngine patched — session-only writes ✓');
    };

    patchStorageEngine();

    // ──────────────────────────────────────────────────────────
    //  2. إضافة شريط تنبيه Demo داخل التطبيق
    // ──────────────────────────────────────────────────────────
    const demoBanner = document.createElement('div');
    demoBanner.id = 'demo-banner';
    demoBanner.innerHTML = `
        <span class="demo-icon">🚀</span>
        <span class="demo-text">نسخة تجريبية للعرض فقط · Demo Mode · البيانات المضافة لا تُحفظ بعد الإغلاق</span>
        <span class="demo-icon">🚀</span>
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
        font-size: 0.82rem;
        font-weight: 700;
        letter-spacing: 1px;
        font-family: 'Tajawal', 'Cairo', sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        box-shadow: 0 2px 20px rgba(245,158,11,0.3);
    `;
    document.body.prepend(demoBanner);

    document.documentElement.style.setProperty('--demo-banner-height', '36px');
    console.info('[DEMO] Demo banner injected ✓');
});

// ──────────────────────────────────────────────────────────────
//  3. تجاوز كلمات المرور تلقائياً في نسخة الديمو
// ──────────────────────────────────────────────────────────────
const _origPrompt = window.prompt;
window.prompt = function(msg, def) {
    if (msg && (msg.includes('كلمة المرور') || msg.includes('password') || msg.includes('PIN'))) {
        console.info('[DEMO] prompt() bypassed');
        const demoPasswords = { main: '2446', finance: '4321', unlockPayment: '100qwe', endSubscription: '01000' };
        return demoPasswords.finance;
    }
    return _origPrompt.call(window, msg, def);
};
