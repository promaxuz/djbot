// dashboard.js - Test yaratish, Excel yuklash va Boshqaruv paneli

// Global o'zgaruvchilar
let currentUser = null;
let allSubjects = ['Matematika', 'Informatika', 'Fizika', 'Tarix', 'Ona tili'];
let testsDB = []; // { id, subject, type, questionsCount, score, timeLimit, activeDuration, questions: [], createdBy, date }
let resultsDB = []; // { testId, userName, score, answers, timeSpent, date }

// Sahifa yuklanganda ishga tushadi
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadDashboardData();
    setupEventListeners();
});

// Autorizatsiyani tekshirish
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    if (!user) {
        window.location.href = 'index.html';
        return;
    }
    currentUser = JSON.parse(user);
    document.getElementById('user-display-name').textContent = currentUser.fullName || currentUser.email;
    
    // Admin bo'lmasa, ba'zi tugmalarni yashirish mumkin (ixtiyoriy)
    if (currentUser.role !== 'admin') {
        // console.log("Oddiy foydalanuvchi");
    }
}

// Ma'lumotlarni yuklash
function loadDashboardData() {
    // Fanlarni yuklash
    const storedSubjects = localStorage.getItem('protest_subjects');
    if (storedSubjects) {
        allSubjects = JSON.parse(storedSubjects);
    }
    
    // Testlarni yuklash
    const storedTests = localStorage.getItem('protest_tests');
    if (storedTests) {
        testsDB = JSON.parse(storedTests);
    }

    // Natijalarni yuklash
    const storedResults = localStorage.getItem('protest_results');
    if (storedResults) {
        resultsDB = JSON.parse(storedResults);
    }

    renderSubjectSelects();
    renderTestsList();
    updateStats();
}

// Event listenerlarni o'rnatish
function setupEventListeners() {
    // Yangi fan qo'shish
    document.getElementById('add-subject-btn')?.addEventListener('click', addNewSubject);
    
    // Excel yuklash
    document.getElementById('upload-excel-btn')?.addEventListener('click', handleExcelUpload);
    
    // Namuna yuklab olish
    document.getElementById('download-template-btn')?.addEventListener('click', downloadTemplate);

    // Test yaratish formasi
    document.getElementById('create-test-form')?.addEventListener('submit', handleCreateTest);

    // Chiqish
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });

    // Tablarni almashtirish
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('data-target');
            document.querySelectorAll('.dashboard-section').forEach(sec => sec.classList.add('hidden'));
            document.getElementById(target).classList.remove('hidden');
            
            // Active classni yangilash
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            e.target.classList.add('active');
        });
    });
}

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
        
        // "Yangi fan qo'shish" opsiyasi
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

// Excel yuklash funksiyasi (ASOSIY QISM)
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
        showStatus(statusMsg, "❌ Iltimos, test turini (Umumiy/Shaxsiy) tanlang!", "error");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            // SheetJS kutubxonasidan foydalanamiz (XLSX global obyekt)
            if (typeof XLSX === 'undefined') {
                throw new Error("Excel kutubxonasi yuklanmadi. Internetni tekshiring.");
            }
            
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // JSON ga aylantirish (header: 1 deganda massivlar massivi bo'ladi)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            if (jsonData.length < 2) {
                throw new Error("Fayl bo'sh yoki faqat sarlavhadan iborat!");
            }

            // Sarlavhalarni tekshirish
            const headers = jsonData[0].map(h => String(h).trim().toLowerCase());
            const requiredHeaders = ['tartib raqami', 'savol', 'to\'g\'ri javob', 'muqobil javob 1', 'muqabil javob 2', 'muqabil javob 3'];
            
            // Oddiy solishtirish (belgilarni tozalab)
            const isValidStructure = requiredHeaders.every(req => 
                headers.some(h => h.includes(req))
            );

            if (!isValidStructure) {
                console.log("Topilgan headerlar:", headers);
                throw new Error("❌ Excel fayl formati noto'g'ri! Iltimos, 'Namuna yuklab olish' tugmasi orqali to'g'ri shablonni oling.<br>Kerakli ustunlar: Tartib raqami, Savol, To'g'ri javob, Muqabil 1, Muqabil 2, Muqabil 3.");
            }

            // Ma'lumotlarni tozalash va obyektkga o'tkazish
            const questions = [];
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row[1]) continue; // Savol bo'lmasa o'tkazib yuborish

                // Ustun indekslarini aniqlash (flexible)
                const getCol = (keyword) => {
                    const idx = headers.findIndex(h => h.includes(keyword));
                    return idx !== -1 ? row[idx] : '';
                };

                questions.push({
                    id: Date.now() + i,
                    questionText: String(getCol('savol')),
                    correctAnswer: String(getCol('to\'g\'ri')),
                    options: [
                        String(getCol('muqabil 1')),
                        String(getCol('muqabil 2')),
                        String(getCol('muqabil 3')),
                        String(getCol('to\'g\'ri')) // To'g'ri javobni ham variantlarga qo'shamiz aralashtirish uchun
                    ].sort(() => Math.random() - 0.5) // Aralashtirish
                });
            }

            if (questions.length === 0) {
                throw new Error("Faylda savollar topilmadi!");
            }

            // Bazaga saqlash (Hozircha oddiy "Testlar bazasi" ga qo'shamiz, keyin test yaratishda ishlatamiz)
            // Bu yerda biz shunchaki savollarni vaqtincha saqlaymiz yoki darhol "Bank" ga qo'shamiz
            // Foydalanuvchi so'roviga ko'ra: "Umumiy baza shakillansin"
            
            const newQuestionBank = {
                id: Date.now(),
                subject: subject,
                type: type, // 'public' or 'private'
                owner: currentUser.email,
                questions: questions,
                date: new Date().toISOString()
            };

            // Mavjud banklarni olish va qo'shish
            let questionBanks = JSON.parse(localStorage.getItem('protest_question_banks') || '[]');
            questionBanks.push(newQuestionBank);
            localStorage.setItem('protest_question_banks', JSON.stringify(questionBanks));

            showStatus(statusMsg, `✅ Muvaffaqiyatli! ${questions.length} ta savol "${subject}" fani bo'yicha ${type === 'public' ? 'Umumiy' : 'Shaxsiy'} bazaga qo'shildi.`, "success");
            fileInput.value = ""; // Tozalash
            updateStats();

        } catch (error) {
            console.error(error);
            showStatus(statusMsg, error.message, "error");
        }
    };

    reader.onerror = () => {
        showStatus(statusMsg, "❌ Faylni o'qishda xatolik yuz berdi.", "error");
    };

    reader.readAsArrayBuffer(file);
}

// Namuna Excel yaratish va yuklab olish
function downloadTemplate() {
    if (typeof XLSX === 'undefined') {
        alert("Excel kutubxonasi yuklanmadi!");
        return;
    }

    const data = [
        ["Tartib raqami", "Savol", "To'g'ri javob", "Muqabil javob 1", "Muqabil javob 2", "Muqabil javob 3"],
        [1, "2 + 2 nechiga teng?", "4", "3", "5", "6"],
        [2, "O'zbekiston poytaxti qaysi shahar?", "Toshkent", "Samarqand", "Buxoro", "Xiva"],
        [3, "HTML nima?", "Gipermatn belgilash tili", "Dasturlash tili", "Operatsion tizim", "Brauzer"]
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
    } else {
        alert("⚠️ Fan nomini kiriting!");
    }
}

// Test yaratish jarayoni
function handleCreateTest(e) {
    e.preventDefault();
    
    const subject = document.getElementById('subject-select-create').value;
    const sourceType = document.getElementById('test-source-type').value; // public/private
    const qCount = parseInt(document.getElementById('question-count').value);
    const scorePerQ = parseFloat(document.getElementById('score-per-q').value);
    const timeLimit = parseInt(document.getElementById('time-limit').value);
    const activeDuration = document.getElementById('active-duration').value; // 'always' or minutes
    
    if (!subject) { alert("Fan tanlanmagan!"); return; }
    if (qCount <= 0) { alert("Savollar soni noto'g'ri!"); return; }

    // Savollar bazasidan keraklisini olish
    const allBanks = JSON.parse(localStorage.getItem('protest_question_banks') || '[]');
    
    // Filtrlash: Fan + Tur (Public yoki Private egasi)
    let availableQuestions = [];
    
    allBanks.forEach(bank => {
        if (bank.subject !== subject) return;
        
        if (sourceType === 'public') {
            if (bank.type === 'public') {
                availableQuestions = [...availableQuestions, ...bank.questions];
            }
        } else if (sourceType === 'private') {
            // Shaxsiy bazadan faqat o'zining testlari
            if (bank.type === 'private' && bank.owner === currentUser.email) {
                availableQuestions = [...availableQuestions, ...bank.questions];
            }
        }
    });

    if (availableQuestions.length < qCount) {
        alert(`⚠️ Tanlangan bazada yetarli savol yo'q! Hozir bor: ${availableQuestions.length} ta, kerak: ${qCount} ta.\nIltimos, avval Excel orqali ko'proq savol yuklang.`);
        return;
    }

    // Tasdiqlash
    if (!confirm(`📝 Test parametrlari:\nFan: ${subject}\nSavollar: ${qCount}\nBall: ${qCount * scorePerQ}\nVaqt: ${timeLimit} daqiqa\n\nDavom etilsinmi?`)) {
        return;
    }

    // Savollarni tasodifiy tanlash
    const selectedQuestions = availableQuestions.sort(() => 0.5 - Math.random()).slice(0, qCount);

    const newTest = {
        id: 'TEST-' + Date.now(),
        subject: subject,
        type: sourceType,
        questionsCount: qCount,
        scorePerQuestion: scorePerQ,
        totalTime: timeLimit,
        activeDuration: activeDuration,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email,
        creatorName: currentUser.fullName || currentUser.email,
        questions: selectedQuestions,
        isActive: true,
        link: window.location.origin + window.location.pathname.replace(/[^/]*$/, '') + 'test-runner.html?id=' + 'TEST-' + Date.now() // Linkni keyin to'g'rilaymiz
    };

    // Test ID ni keyinroq aniq belgilaymiz (chunki Date.now() har xil bo'lishi mumkin)
    // Hozircha saqlaymiz
    testsDB.push(newTest);
    localStorage.setItem('protest_tests', JSON.stringify(testsDB));

    // Natijalar oynasiga o'tish va ma'lumotni ko'rsatish
    showTestResultModal(newTest);
    renderTestsList();
    updateStats();
}

// Test natijasi modalini ko'rsatish (QR va Link bilan)
function showTestResultModal(test) {
    const modal = document.getElementById('test-result-modal');
    const testLink = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}test-runner.html?id=${test.id}`;
    
    document.getElementById('result-test-id').textContent = test.id;
    document.getElementById('result-link-input').value = testLink;
    
    // QR Code generatsiya (Google Charts API yoki jsQR kutubxonasi orqali)
    // Bu yerda oddiy Google Charts API dan foydalanamiz (internet kerak)
    const qrImg = document.getElementById('qr-code-img');
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(testLink)}`;
    
    modal.classList.remove('hidden');
    
    // Yopish tugmasi
    document.getElementById('close-result-modal')?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
}

// Testlar ro'yxatini chiqarish
function renderTestsList() {
    const tbody = document.getElementById('tests-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Faqat joriy foydalanuvchi yoki Admin yaratgan testlarni ko'rsatish
    const myTests = testsDB.filter(t => t.createdBy === currentUser.email || currentUser.role === 'admin');

    if (myTests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Hali testlar yaratilmagan.</td></tr>';
        return;
    }

    myTests.forEach(test => {
        const tr = document.createElement('tr');
        const testLink = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}test-runner.html?id=${test.id}`;
        
        tr.innerHTML = `
            <td>${test.subject}</td>
            <td>${test.type === 'public' ? '🌍 Umumiy' : '🔒 Shaxsiy'}</td>
            <td>${test.questionsCount}</td>
            <td>${test.totalTime} daq</td>
            <td>${test.isActive ? '<span class="badge-success">Aktiv</span>' : '<span class="badge-danger">Nofaol</span>'}</td>
            <td>${new Date(test.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn-sm btn-info" onclick="copyLink('${testLink}')">🔗 Nusxa</button>
                <button class="btn-sm btn-primary" onclick="viewTestStats('${test.id}')">📊 Statistika</button>
                <button class="btn-sm btn-danger" onclick="deleteTest('${test.id}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Statistika ko'rish
window.viewTestStats = function(testId) {
    const test = testsDB.find(t => t.id === testId);
    if (!test) return;

    const testResults = resultsDB.filter(r => r.testId === testId);
    
    let statsHtml = `
        <div class="stats-header">
            <h3>${test.subject} - Test Statistikasi</h3>
            <p>Jami ishlaganlar: <strong>${testResults.length}</strong> nafar</p>
        </div>
        <table class="simple-table">
            <thead>
                <tr>
                    <th>Ism Familiya</th>
                    <th>Ball</th>
                    <th>To'g'ri</th>
                    <th>Noto'g'ri</th>
                    <th>Vaqt</th>
                    <th>Sana</th>
                    <th>Amal</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (testResults.length === 0) {
        statsHtml += `<tr><td colspan="7" class="text-center">Hali hech kim ishlamagan.</td></tr>`;
    } else {
        testResults.forEach(res => {
            const correctCount = res.answers.filter(a => a.isCorrect).length;
            const wrongCount = test.questionsCount - correctCount;
            
            statsHtml += `
                <tr>
                    <td>${res.userName}</td>
                    <td><strong>${res.score}</strong></td>
                    <td class="text-success">${correctCount}</td>
                    <td class="text-danger">${wrongCount}</td>
                    <td>${res.timeSpent} sek</td>
                    <td>${new Date(res.date).toLocaleString()}</td>
                    <td><button class="btn-sm" onclick='printResult(${JSON.stringify(res)})'>🖨️ Chop etish</button></td>
                </tr>
            `;
        });
    }

    statsHtml += `</tbody></table>`;
    
    // Modal ochish
    const modal = document.getElementById('stats-modal');
    document.getElementById('stats-content').innerHTML = statsHtml;
    modal.classList.remove('hidden');
    
    document.getElementById('close-stats-modal')?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });
};

// Print qilish funksiyasi
window.printResult = function(result) {
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Natija</title>');
    printWindow.document.write('</head><body style="font-family: sans-serif; padding: 20px;">');
    printWindow.document.write(`<h1>Test Natijasi</h1>`);
    printWindow.document.write(`<p><strong>Ism:</strong> ${result.userName}</p>`);
    printWindow.document.write(`<p><strong>Umumiy ball:</strong> ${result.score}</p>`);
    printWindow.document.write(`<p><strong>Sana:</strong> ${new Date(result.date).toLocaleString()}</p>`);
    printWindow.document.write('<hr>');
    printWindow.document.write('<h3>Batafsil tahlil:</h3><ul>');
    
    result.answers.forEach((ans, index) => {
        const color = ans.isCorrect ? 'green' : 'red';
        printWindow.document.write(`<li style="color:${color}">
            ${index + 1}. Savol: <strong>${ans.isCorrect ? 'To\'g\'ri' : 'Noto\'g\'ri'}</strong><br>
            Sizning javob: ${ans.selected}<br>
            To'g'ri javob: ${ans.correct}
        </li><br>`);
    });
    
    printWindow.document.write('</ul>');
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
};

// Testni o'chirish
window.deleteTest = function(id) {
    if(confirm("Rostdan ham bu testni o'chirmoqchimisiz?")) {
        testsDB = testsDB.filter(t => t.id !== id);
        localStorage.setItem('protest_tests', JSON.stringify(testsDB));
        renderTestsList();
        updateStats();
    }
};

// Linkni nusxalash
window.copyLink = function(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("✅ Link buferga nusxalandi!");
    }, () => {
        alert("❌ Nusxalashda xatolik!");
    });
};

// Statistika kartalarini yangilash
function updateStats() {
    const totalTests = testsDB.filter(t => t.createdBy === currentUser.email).length;
    const totalQuestions = testsDB.reduce((acc, t) => acc + t.questions.length, 0);
    
    document.getElementById('stat-tests-count').textContent = totalTests;
    document.getElementById('stat-questions-count').textContent = totalQuestions;
    // Boshqa statistikalarni ham qo'shish mumkin
}

// Status xabarini ko'rsatish
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status-msg ${type}`;
    element.style.display = 'block';
    
    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}
