import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAsthGIMXvc-pFXfc63tGEclGg5V6qCT0s",
    authDomain: "ic-generator-93915.firebaseapp.com",
    projectId: "ic-generator-93915",
    storageBucket: "ic-generator-93915.firebasestorage.app",
    messagingSenderId: "571045375663",
    appId: "1:571045375663:web:591a7f51b5921dac90ae5a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
enableIndexedDbPersistence(db).catch(() => {});

// === SÖTÉT MÓD LOGIKA BEÉPÍTÉSE ===
const themeToggle = document.getElementById('themeToggle');
// Ellenőrzi, hogy van-e mentett beállítás, vagy a telefon alapból sötét módon van-e
const currentTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    let theme = 'light';
    if (document.body.classList.contains('dark-mode')) {
        theme = 'dark';
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
    localStorage.setItem('theme', theme);
});
// ===================================

let icDatabase = [], currentGenType = 'ESS', editIcId = null;

onSnapshot(collection(db, 'ic_numbers'), (snap) => {
    icDatabase = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderAdminList();
    updateGenSelect();
});

// UI Kezelés
window.showTab = (name) => {
    ['generator', 'admin', 'info'].forEach(t => document.getElementById(`tab-${t}`).classList.toggle('hidden', t !== name));
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.toggle('active', b.onclick.toString().includes(name)));
};

window.switchType = (type) => {
    currentGenType = type;
    document.querySelectorAll('.pill-nav button').forEach(b => b.classList.toggle('active', b.textContent === type));
    updateGenSelect();
};

const updateGenSelect = () => {
    const sel = document.getElementById('genSelect');
    const filtered = icDatabase.filter(ic => ic.type === currentGenType);
    sel.innerHTML = filtered.length ? '<option value="">-- Válassz --</option>' + filtered.map(ic => `<option value="${ic.code}">${ic.code}</option>`).join('') : '<option>Nincs adat</option>';
};

// Generátor (Új, teljes képernyős logika)
window.generateData = () => {
    const code = document.getElementById('genSelect').value;
    const amountStr = document.getElementById('genAmount').value;
    const amount = parseInt(amountStr);
    
    if (!code || !amountStr) return showToast("Adatok hiányoznak!");
    if (amount > 5000) return showToast("A mennyiség maximum 5000 lehet!");
    if (amount <= 0) return showToast("Érvénytelen mennyiség!");

    const cleanIC = code.replace(/[^a-zA-Z0-9]/g, '');
    const paddedAmount = amountStr.padStart(7, '0');
    const r11 = Math.floor(Math.random() * 9e10 + 1e10).toString();
    const r10 = Math.floor(Math.random() * 9e9 + 1e9).toString();

    // Előző QR kódok törlése
    document.getElementById('q1-large').innerHTML = '';
    document.getElementById('q2-large').innerHTML = '';

    // Új kódok legenerálása hatalmas méretben (a CSS majd igazítja)
    new QRCode(document.getElementById("q1-large"), { text: r11, width: 300, height: 300, correctLevel: QRCode.CorrectLevel.H });
    new QRCode(document.getElementById("q2-large"), { text: `${cleanIC}${paddedAmount}${r10}`, width: 300, height: 300, correctLevel: QRCode.CorrectLevel.H });
    
    // Szövegek beállítása a QR kódok alá (sötét módban is sötét színnel a fehér doboz miatt)
    document.getElementById('q1-text').innerHTML = `<strong style="color:#000">${r11}</strong>`;
    document.getElementById('q2-text').innerHTML = `<strong style="color:#000">${cleanIC}${paddedAmount}${r10}</strong>`;

    // Teljes képernyős ablak megjelenítése
    document.getElementById('qrFullscreen').classList.remove('hidden');
};

// Teljes képernyős ablak bezárása és form ürítése
window.closeQr = () => {
    document.getElementById('qrFullscreen').classList.add('hidden');
    document.getElementById('genAmount').value = '';
};

// Admin
const renderAdminList = () => {
    document.getElementById('adminList').innerHTML = icDatabase.sort((a,b) => a.code.localeCompare(b.code)).map(ic => `
        <div class="list-group-item d-flex justify-content-between align-items-center">
            <div><span class="badge me-2 ${ic.type==='ESS'?'bg-primary':'bg-warning'}">${ic.type}</span><b>${ic.code}</b></div>
            <button class="btn btn-sm btn-light" onclick="openIcModal('${ic.id}')">✏️</button>
        </div>`).join('') || '<p class="text-center py-4 small text-muted">Üres lista.</p>';
};

window.openIcModal = (id = null) => {
    editIcId = id;
    const ic = id ? icDatabase.find(x => x.id === id) : null;
    document.getElementById('imCode').value = ic?.code || '';
    document.getElementById('imType').value = ic?.type || 'ESS';
    document.getElementById('imDel').style.display = id ? 'block' : 'none';
    document.getElementById('icModal').classList.add('open');
};

window.saveIc = async () => {
    const code = document.getElementById('imCode').value.trim().toUpperCase(), type = document.getElementById('imType').value;
    if (!code) return;
    editIcId ? await updateDoc(doc(db, 'ic_numbers', editIcId), {code, type}) : await addDoc(collection(db, 'ic_numbers'), {code, type});
    closeModal('icModal');
};

window.deleteIc = async () => { if (confirm("Törlöd?") && editIcId) await deleteDoc(doc(db, 'ic_numbers', editIcId)); closeModal('icModal'); };

window.closeModal = (id) => document.getElementById(id).classList.remove('open');

const showToast = (m) => {
    document.getElementById('toastMsg').textContent = m;
    new bootstrap.Toast(document.getElementById('liveToast')).show();
};

if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
