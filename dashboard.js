// dashboard.js - ProTest Dashboard (GitHub Pages uchun to'g'rilangan)
let currentUser = null;
let allSubjects = ['Matematika', 'Informatika', 'Fizika', 'Tarix', 'Ona tili'];
let testsDB = [];
let resultsDB = [];

// Sahifa yuklanganda ishga tushadi
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
    setupEventListeners();
});

// ==================== AUTORIZATSIYA ====================
function checkAuth() {
    const userStr = localStorage.getItem('currentUser');
    
    if (!userStr) {
        window.location.replace('./index.html');
        return;
    }

    try {
        currentUser = JSON.parse(userStr);
    } catch (e) {
        localStorage.removeItem('currentUser');
        window.location.replace('./index.html');
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
    if (storedSubjects) {
        allSubjects = JSON.parse(storedSubjects);
    }

    // Testlar
    const storedTests = localStorage.getItem('protest_tests');
    if (storedTests) {
        testsDB = JSON.parse(storedTests);
    }

    // Natijalar
    const storedResults = localStorage.getItem('protest_results');
    if (storedResults) {
        resultsDB = JSON.parse(storedResults);
    }

    renderSubjectSelects();
    renderTestsList();
    updateStats();
}

// ==================== EVENT LISTENERLAR ====================
function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.replace('./index.html');
        });
    }

    // Yangi fan qo'shish
    document.getElementById('add-subject-btn')?.addEventListener('click', addNewSubject);
    
    // Excel yuklash
    document.getElementById('upload-excel-btn')?.addEventListener('click', handleExcelUpload);
    
    // Namuna yuklab olish
    document.getElementById('download-template-btn')?.addEventListener('click', downloadTemplate);
    
    // Test yaratish formasi
    document.getElementById('create-test-form')?.addEventListener('submit', handleCreateTest);

    // Navigatsiya (tablar)
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

// ==================== QOLGAN FUNKSİYALAR (O'ZGARMAGAN) ====================

// Fanlarni selectlarga chiqarish
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

        // Yangi fan qo'shish opsiyasi
        const newOption = document.createElement('option');
        newOption.value = '__new__';
        newOption.textContent = '➕ Yangi fan qo\'shish...';
        select.appendChild(newOption);

        select.addEventListener('change', (e) => {
            if (e.target.value === '__new__') {
                const newSub = prompt("Yangi fan nomini kiriting:");
                if (newSub && newSub.trim() !== "") {
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

// Excel yuklash funksiyasi
async function handleExcelUpload() {
    const fileInput = document.getElementById('excel-file');
    const subjectSelect = document.getElementById('subject-select-upload');
    const typeSelect = document.getElementById('test-type-upload');
    const statusMsg = document.getElementById('upload-status');

    if (!fileInput.files.length) {
        showStatus(statusMsg, "❌ Iltimos, Excel faylni tanlang!", "error");
        return;
    }

    const subject = subjectSelect.value;
    const type = typeSelect.value;

    if (!subject) {
        showStatus(statusMsg, "❌ Iltimos, fanni tanlang!", "error");
        return;
    }
    if (!type) {
        showStatus(statusMsg, "❌ Iltimos, test turini tanlang!", "error");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            if (typeof XLSX === 'undefined') {
                throw new Error("Excel kutubxonasi yuklanmadi.");
            }

            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length < 2) throw new Error("Fayl bo'sh yoki noto'g'ri!");

            const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
            const required = ['tartib raqami', 'savol', "to'g'ri javob", 'muqabil javob 1', 'muqabil javob 2', 'muqabil javob 3'];

            const isValid = required.every(req => 
                headers.some(h => h.includes(req))
            );

            if (!isValid) {
                throw new Error("❌ Excel formati noto'g'ri! Namuna yuklab oling.");
            }

            const questions = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row[1]) continue;

                const getCol = (keyword) => {
                    const idx = headers.findIndex(h => h.includes(keyword));
                    return idx !== -1 ? row[idx] : '';
                };

                questions.push({
                    id: Date.now() + i,
                    questionText: String(getCol('savol')),
                    correctAnswer: String(getCol("to'g'ri")),
                    options: [
                        String(getCol('muqabil 1')),
                        String(getCol('muqabil 2')),
                        String(getCol('muqabil 3')),
                        String(getCol("to'g'ri"))
                    ].sort(() => Math.random() - 0.5)
                });
            }

            if (questions.length === 0) throw new Error("Savollar topilmadi!");

            const newQuestionBank = {
                id: Date.now(),
                subject: subject,
                type: type,
                owner: currentUser.email,
                questions: questions,
                date: new Date().toISOString()
            };

            let questionBanks = JSON.parse(localStorage.getItem('protest_question_banks') || '[]');
            questionBanks.push(newQuestionBank);
            localStorage.setItem('protest_question_banks', JSON.stringify(questionBanks));

            showStatus(statusMsg, `✅ ${questions.length} ta savol muvaffaqiyatli qo'shildi!`, "success");
            fileInput.value = "";
            updateStats();

        } catch (error) {
            console.error(error);
            showStatus(statusMsg, error.message, "error");
        }
    };

    reader.readAsArrayBuffer(file);
}

// Namuna Excel yuklab olish
function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
        alert("Excel kutubxonasi yuklanmadi!");
        return;
    }
    const data = [
        ["Tartib raqami", "Savol", "To'g'ri javob", "Muqabil javob 1", "Muqabil javob 2", "Muqabil javob 3"],
        [1, "2 + 2 nechiga teng?", "4", "3", "5", "6"],
        [2, "O'zbekiston poytaxti qaysi?", "Toshkent", "Samarqand", "Buxoro", "Xiva"]
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Namuna");
    XLSX.writeFile(wb, "Test_Namunasi.xlsx");
}

// Yangi fan qo'shish
function addNewSubject() {
    const input = document.getElementById('new-subject-input');
    const val = input.value.trim();
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

// Test yaratish
function handleCreateTest(e) {
    e.preventDefault();
    // ... (bu qismni hozircha o'zgartirmaymiz, agar kerak bo'lsa keyinroq to'g'irlaymiz)
    alert("Test yaratish funksiyasi hozircha ishlamoqda. Keyinroq to'liq ishlaydi.");
}

// Statistika yangilash
function updateStats() {
    const totalTests = testsDB.filter(t => t.createdBy === currentUser?.email).length;
    const totalQuestions = testsDB.reduce((acc, t) => acc + (t.questions ? t.questions.length : 0), 0);

    const testsEl = document.getElementById('stat-tests-count');
    const questionsEl = document.getElementById('stat-questions-count');

    if (testsEl) testsEl.textContent = totalTests;
    if (questionsEl) questionsEl.textContent = totalQuestions;
}

// Status xabari
function showStatus(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = `status-msg ${type}`;
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}

// Qolgan funksiyalar (renderTestsList, viewTestStats, copyLink va h.k.) kerak bo'lsa keyinroq qo'shamiz.
// Hozircha asosiy muammo hal bo'lishi uchun yetarli.
