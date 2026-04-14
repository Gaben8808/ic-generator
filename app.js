import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    // ... a te változatlan configod ...
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(() => {});

// === 5. PONT: HAPTIKUS VISSZAJELZÉS (REZGÉS) ===
const haptic = (type = 'light') => {
    if (!("vibrate" in navigator)) return;
    if (type === 'light') navigator.vibrate(30);           // Rövid érintés
    if (type === 'success') navigator.vibrate([40, 30, 40]); // Kettős rezdülés
    if (type === 'error') navigator.vibrate([100, 50, 100]); // Hosszabb hiba-rezgés
};

// === 1. PONT: IC FORMÁZÓ SEGÉDFÜGGVÉNY ===
// Nyers 13 karakterből csinál: A2.C013-1370.2.00 formátumot
const formatIC = (raw) => {
    const c = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    if (c.length !== 13) return c; // Ha nem 13, nem formázzuk (hibakezeléshez kell)
    return `${c.slice(0,2)}.${c.slice(2,6)}-${c.slice(6,10)}.${c.slice(10,11)}.${c.slice(11,13)}`;
};

// ... Téma kezelő kódod változatlan ...

let icDatabase = [], currentGenType = 'ESS', editIcId = null;

onSnapshot(collection(db, 'ic_numbers'), (snap) => {
    icDatabase = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAdminList();
    updateGenSelect();
});

// UI Kezelés
window.showTab = (name) => {
    haptic('light');
    ['generator', 'admin', 'info'].forEach(t => document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== name));
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.toggle('active', b.onclick.toString().includes(name)));
};

window.switchType = (type) => {
    haptic('light');
    currentGenType = type;
    document.querySelectorAll('.pill-nav button').forEach(b => b.classList.toggle('active', b.textContent === type));
    updateGenSelect();
};

const updateGenSelect = () => {
    const sel = document.getElementById('genSelect');
    const filtered = icDatabase.filter(ic => ic.type === currentGenType);
    // Megjelenítéskor formázzuk az IC-t
    sel.innerHTML = filtered.length ? '<option value="">-- Válassz --</option>' + 
        filtered.map(ic => `<option value="${ic.code}">${formatIC(ic.code)}</option>`).join('') : '<option>Nincs adat</option>';
};

// Generátor
window.generateData = () => {
    const code = document.getElementById('genSelect').value;
    const amountStr = document.getElementById('genAmount').value;
    const amount = parseInt(amountStr);

    if (!code || !amountStr) { haptic('error'); return showToast("Adatok hiányoznak!"); }
    if (amount > 5000) { haptic('error'); return showToast("Max 5000 lehet!"); }

    haptic('success');
    const cleanIC = code.replace(/[^a-zA-Z0-9]/g, '');
    const paddedAmount = amountStr.padStart(7, '0');
    const r11 = Math.floor(Math.random() * 9e10 + 1e10).toString();
    const r10 = Math.floor(Math.random() * 9e9 + 1e9).toString();

    document.getElementById('q1-large').innerHTML = '';
    document.getElementById('q2-large').innerHTML = '';

    new QRCode(document.getElementById("q1-large"), { text: r11, width: 300, height: 300, correctLevel: QRCode.CorrectLevel.H });
    new QRCode(document.getElementById("q2-large"), { text: `${cleanIC}${paddedAmount}${r10}`, width: 300, height: 300, correctLevel: QRCode.CorrectLevel.H });
    
    document.getElementById('q1-text').innerHTML = `<strong style="color:#000">${r11}</strong>`;
    document.getElementById('q2-text').innerHTML = `<strong style="color:#000">${formatIC(cleanIC)}${paddedAmount}${r10}</strong>`;

    document.getElementById('qrFullscreen').classList.remove('hidden');
};

window.closeQr = () => {
    haptic('light');
    document.getElementById('qrFullscreen').classList.add('hidden');
    document.getElementById('genAmount').value = '';
    document.getElementById('genSelect').value = '';
};

// Admin felület frissítése formázott listával
const renderAdminList = () => {
    document.getElementById('adminList').innerHTML = icDatabase.sort((a,b) => a.code.localeCompare(b.code)).map(ic => `
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <div><span class="badge me-2 ${ic.type==='ESS'?'bg-primary':'bg-warning'}">${ic.type}</span><b>${formatIC(ic.code)}</b></div>
            <button class="btn btn-sm btn-light" onclick="openIcModal('${ic.id}')">✏️</button>
        </div>`).join('') || '<p class="text-center py-4 small text-muted">Üres lista.</p>';
};

window.openIcModal = (id = null) => {
    haptic('light');
    editIcId = id;
    const ic = id ? icDatabase.find(x => x.id === id) : null;
    document.getElementById('imCode').value = ic?.code || '';
    document.getElementById('imType').value = ic?.type || 'ESS';
    document.getElementById('imDel').style.display = id ? 'block' : 'none';
    document.getElementById('icModal').classList.add('open');
};

// === ÚJMENTÉS LOGIKA: VALIDÁLÁS ÉS DUPLIKÁCIÓ SZŰRÉS ===
window.saveIc = async () => {
    let code = document.getElementById('imCode').value.trim().toUpperCase();
    const type = document.getElementById('imType').value;
    
    // Tisztítás (csak betű/szám maradjon az ellenőrzéshez)
    const cleanCode = code.replace(/[^A-Z0-9]/gi, '');

    // 1. Hossz ellenőrzés
    if (cleanCode.length !== 13) {
        haptic('error');
        return showToast("Az IC száma pontosan 13 karakter kell legyen!");
    }

    // 2. Duplikáció ellenőrzés
    const isDuplicate = icDatabase.some(ic => ic.code === cleanCode && ic.id !== editIcId);
    if (isDuplicate) {
        haptic('error');
        return showToast("Ez az IC már szerepel az adatbázisban!");
    }

    haptic('success');
    // Csak a tiszta 13 karaktert mentjük el az adatbázisba, a formázást a megjelenítő végzi
    editIcId ? 
        await updateDoc(doc(db, 'ic_numbers', editIcId), {code: cleanCode, type}) : 
        await addDoc(collection(db, 'ic_numbers'), {code: cleanCode, type});
    
    closeModal('icModal');
    showToast("Adatbázis frissítve! ✓");
};

window.deleteIc = async () => {
    if (confirm("Biztosan törlöd?")) {
        haptic('error');
        if (editIcId) await deleteDoc(doc(db, 'ic_numbers', editIcId));
        closeModal('icModal');
    }
};

window.closeModal = (id) => {
    haptic('light');
    document.getElementById(id).classList.remove('open');
};

const showToast = (m) => {
    document.getElementById('toastMsg').textContent = m;
    new bootstrap.Toast(document.getElementById('liveToast')).show();
};
