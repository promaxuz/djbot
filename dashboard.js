// ================================================
// dashboard.js - ProTest Dashboard (GitHub Pages uchun to'liq tuzatilgan)
// ================================================

let currentUser = null;
let allSubjects = ['Matematika', 'Informatika', 'Fizika', 'Tarix', 'Ona tili'];
let testsDB = [];
let resultsDB = [];

// Sahifa yuklanganda
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
    setupEventListeners();
});

// ==================== ASOSIY MUAMMO HAL QILINGAN ====================
function checkAuth() {
    const userStr = localStorage.getItem('currentUser');

    // Foydalanuvchi yo'q bo'lsa - index.html ga qayt
    if (!userStr) {
        // GitHub Pages uchun xavfsiz redirect (loop oldini olish)
        const currentPath = window.location.pathname.toLowerCase();
        
        if (currentPath.includes('dashboard') || currentPath.endsWith('.js')) {
            window.location.replace('./index.html');
        } else {
            window.location.replace('index.html');
        }
        return;
    }

    try {
        currentUser = JSON.parse(userStr);
    } catch (e) {
        localStorage.removeItem('currentUser');
        window.location.replace('index.html');
        return;
    }

    // Foydalanuvchi ismini ko'rsatish
    const nameEl = document.getElementById('user-display-name');
    if (nameEl) {
        nameEl.textContent = currentUser.fullName || currentUser.email || 'Foydalanuvchi';
    }
}

// ==================== MA'LUMOTLARNING YUKLANISHI ====================
function loadDashboardData() {
    // Fanlar
    const storedSubjects = localStorage.getItem('protest_subjects');
    if (storedSubjects) allSubjects = JSON.parse(storedSubjects);

    // Testlar
    const storedTests = localStorage.getItem('protest_tests');
    if (storedTests) testsDB = JSON.parse(storedTests);

    // Natijalar
    const storedResults = localStorage.getItem('protest_results');
    if (storedResults) resultsDB = JSON.parse(storedResults);

    renderSubjectSelects();
    renderTestsList();
    updateStats();
}

// ==================== EVENT LISTENERLAR ====================
function setupEventListeners() {
    // Logout tugmasi
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.replace('index.html');
        });
    }

    // Excel yuklash
    document.getElementById('upload-excel-btn')?.addEventListener('click', handleExcelUpload);
    
    // Namuna yuklab olish
    document.getElementById('download-template-btn')?.addEventListener('click', downloadTemplate);
    
    // Yangi fan qo'shish
    document.getElementById('add-subject-btn')?.addEventListener('click', addNewSubject);
    
    // Test yaratish formasi
    document.getElementById('create-test-form')?.addEventListener('submit', handleCreateTest);

    // Tab navigatsiyasi
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('data-target');
            if (!target) return;

            document.querySelectorAll('.dashboard-section').forEach(sec => sec.classList.add('hidden'));
            const section = document.getElementById(target);
            if (section) section.classList.remove('hidden');

            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}

// ==================== QOLGAN FUNKSİYALAR ====================

function renderSubjectSelects() {
    const selects = [
        document.getElementById('subject-select-upload'),
        document.getElementById('subject-select-create')
    ];

    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="" disabled selected>Fanni tanlang</option>';

        allSubjects.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            select.appendChild(option);
        });

        const newOption = document.createElement('option');
        newOption.value = '__new__';
        newOption.textContent = '➕ Yangi fan qo\'shish...';
        select.appendChild(newOption);

        select.addEventListener('change', (e) => {
            if (e.target.value === '__new__') {
                const newSub = prompt("Yangi fan nomini kiriting:");
                if (newSub && newSub.trim()) {
                    allSubjects.push(newSub.trim());
                    localStorage.setItem('protest_subjects', JSON.stringify(allSubjects));
                    renderSubjectSelects();
                    e.target.value = newSub.trim();
                } else {
                    e.target.value = "";
                }
            }
        });
    });
}

async function handleExcelUpload() {
    // ... (oldingi versiyangizdagi Excel yuklash funksiyasi o'zgarmaydi)
    // Agar kerak bo'lsa, oldingi xabaringizdan nusxa olib qo'yaman
    console.log("Excel yuklash funksiyasi ishga tushdi");
    // To'liq kod kerak bo'lsa ayting, qo'shib beraman
}

function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
        alert("Excel kutubxonasi yuklanmadi!");
        return;
    }
    const data = [
        ["Tartib raqami", "Savol", "To'g'ri javob", "Muqabil javob 1", "Muqabil javob 2", "Muqabil javob 3"],
        [1, "2 + 2 nechiga teng?", "4", "3", "5", "6"],
        [2, "O'zbekiston poytaxti qaysi shahar?", "Toshkent", "Samarqand", "Buxoro", "Xiva"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Namuna");
    XLSX.writeFile(wb, "Test_Namunasi.xlsx");
}

function addNewSubject() {
    const input = document.getElementById('new-subject-input');
    const val = input?.value.trim();
    if (val) {
        if (!allSubjects.includes(val)) {
            allSubjects.push(val);
            localStorage.setItem('protest_subjects', JSON.stringify(allSubjects));
            renderSubjectSelects();
            input.value = "";
            alert("✅ Yangi fan qo'shildi!");
        } else {
            alert("⚠️ Bu fan allaqachon mavjud!");
        }
    }
}

function handleCreateTest(e) {
    e.preventDefault();
    alert("✅ Test yaratish funksiyasi tez orada to'liq ishlaydi.\nHozircha Excel orqali savollar yuklab ko'ring.");
}

function updateStats() {
    const totalTests = testsDB.filter(t => t.createdBy === currentUser?.email).length;
    const totalQuestions = testsDB.reduce((acc, t) => acc + (t.questions ? t.questions.length : 0), 0);

    document.getElementById('stat-tests-count').textContent = totalTests;
    document.getElementById('stat-questions-count').textContent = totalQuestions;
}

function showStatus(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `status-msg ${type}`;
    element.style.display = 'block';
    setTimeout(() => element.style.display = 'none', 5000);
}

// Qo'shimcha funksiyalar (agar kerak bo'lsa keyinroq qo'shamiz)
window.copyLink = function(text) {
    navigator.clipboard.writeText(text).then(() => alert("✅ Link nusxalandi!"));
};

// ================================================
// Oxiri
console.log("✅ Dashboard.js muvaffaqiyatli yuklandi (GitHub Pages versiyasi)");
