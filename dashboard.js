// DASHBOARD.JS - Foydalanuvchi paneli boshqaruvi

let currentStep = 1;
let uploadedQuestions = [];
let selectedSubject = '';
let newTestId = null;

// Dashboard tablarini almashtirish
function switchDashTab(tabName) {
    // Barcha tab yashirin
    document.querySelectorAll('.dash-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Sidebar aktivlik
    document.querySelectorAll('.sidebar li').forEach(li => {
        li.classList.remove('active');
    });
    
    // Tanlanganni ko'rsatish
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Sidebar da aktiv qilish (index orqali)
    const tabs = ['createTest', 'myTests', 'analytics', 'subjects'];
    const index = tabs.indexOf(tabName);
    if (index >= 0) {
        document.querySelectorAll('.sidebar li')[index].classList.add('active');
    }
    
    // Agar analytics bo'lsa yangilash
    if (tabName === 'analytics') {
        updateAnalytics();
    }
    
    // Agar subjects bo'lsa yangilash
    if (tabName === 'subjects') {
        updateSubjectsList();
    }
    
    // Agar myTests bo'lsa yangilash
    if (tabName === 'myTests') {
        updateMyTestsTable();
    }
}

// STEP 1: Fan tanlash
function goToStep2() {
    const select = document.getElementById('subjectSelect');
    const newInput = document.getElementById('newSubjectInput');
    
    if (select.value === 'new_subject') {
        newInput.style.display = 'block';
        return; // Yangi fan kiritilguncha kutamiz
    }
    
    if (!select.value) {
        Swal.fire('Xatolik', 'Fanni tanlang', 'warning');
        return;
    }
    
    selectedSubject = select.value;
    
    document.getElementById('step1').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    currentStep = 2;
}

function backToStep1() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    currentStep = 1;
}

// STEP 2: Excel yuklash
function processExcel() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];
    
    if (!file) {
        Swal.fire('Xatolik', 'Excel faylni tanlang', 'warning');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
            
            // Ma'lumotlarni tekshirish
            if (jsonData.length < 2) {
                throw new Error('Fayl bo\'sh yoki noto\'g\'ri formatda');
            }
            
            // Header qatorni o'tkazib yuborish
            uploadedQuestions = [];
            
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (row.length >= 5) {
                    uploadedQuestions.push({
                        id: i,
                        question: row[1] || '',
                        correctAnswer: row[2] || '',
                        options: [
                            row[2] || '', // To'g'ri javob ham variantlarda bo'ladi
                            row[3] || '',
                            row[4] || '',
                            row[5] || ''
                        ].filter(opt => opt !== '')
                    });
                }
            }
            
            if (uploadedQuestions.length === 0) {
                throw new Error('Savollar topilmadi. Formatni tekshiring.');
            }
            
            Swal.fire({
                icon: 'success',
                title: 'Muvaffaqiyatli!',
                text: `${uploadedQuestions.length} ta savol yuklandi`
            }).then(() => {
                document.getElementById('step2').style.display = 'none';
                document.getElementById('step3').style.display = 'block';
                currentStep = 3;
            });
            
        } catch (error) {
            Swal.fire('Xatolik', error.message, 'error');
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function backToStep2() {
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step2').style.display = 'block';
    currentStep = 2;
}

// STEP 3: Baza tanlash -> STEP 4 ga o'tish
function goToStep4() {
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step4').style.display = 'block';
    currentStep = 4;
}

function backToStep3() {
    document.getElementById('step4').style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    currentStep = 3;
}

// STEP 4: Test yaratishni yakunlash
function finalizeTestSetup() {
    const questionCount = parseInt(document.getElementById('testQuestionCount').value);
    const scorePerQuestion = parseFloat(document.getElementById('testScorePerQuestion').value);
    const duration = parseInt(document.getElementById('testDuration').value);
    const activeDuration = document.getElementById('testActiveDuration').value;
    
    if (!questionCount || !scorePerQuestion || !duration) {
        Swal.fire('Xatolik', 'Barcha maydonlarni to\'ldiring', 'warning');
        return;
    }
    
    if (questionCount > uploadedQuestions.length) {
        Swal.fire('Xatolik', `Faqat ${uploadedQuestions.length} ta savol mavjud`, 'warning');
        return;
    }
    
    // Bazani aniqlash
    const baseType = document.querySelector('input[name="baseType"]:checked').value;
    
    // Tasdiqlash
    Swal.fire({
        title: 'Tasdiqlaysizmi?',
        html: `
            <p>Fan: <b>${selectedSubject}</b></p>
            <p>Savollar soni: <b>${questionCount}</b></p>
            <p>Ball: <b>${questionCount * scorePerQuestion}</b></p>
            <p>Vaqt: <b>${duration} daqiqa</b></p>
            <p>Baza turi: <b>${baseType === 'public' ? 'Umumiy' : 'Shaxsiy'}</b></p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Ha, yaratish',
        cancelButtonText: 'Yo\'q'
    }).then((result) => {
        if (result.isConfirmed) {
            createTest(questionCount, scorePerQuestion, duration, activeDuration, baseType);
        }
    });
}

// Test yaratish funksiyasi
function createTest(count, score, duration, active, type) {
    // Savollarni tasodifiy tanlash
    const shuffled = uploadedQuestions.sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, count);
    
    newTestId = generateId();
    
    const testLink = window.location.origin + window.location.pathname + '?test=' + newTestId;
    
    const newTest = {
        id: newTestId,
        subject: selectedSubject,
        type: type, // public yoki private
        creatorId: DB.currentUser.id,
        creatorName: DB.currentUser.name,
        questions: selectedQuestions,
        totalQuestions: count,
        scorePerQuestion: score,
        maxScore: count * score,
        duration: duration,
        activeDuration: active,
        createdAt: new Date().toISOString(),
        link: testLink,
        status: 'active'
    };
    
    DB.tests.push(newTest);
    
    // Agar yangi fan bo'lsa, bazaga qo'shish
    if (!DB.subjects.includes(selectedSubject)) {
        DB.subjects.push(selectedSubject);
    }
    
    saveDB();
    
    // Natijani ko'rsatish
    document.getElementById('step4').style.display = 'none';
    document.getElementById('stepResult').style.display = 'block';
    
    document.getElementById('testLink').value = testLink;
    generateQRCode(testLink, 'qrcode');
    
    Swal.fire('Yaratildi!', 'Test muvaffaqiyatli yaratildi', 'success');
}

// Testni bekor qilish
function cancelTest() {
    Swal.fire({
        title: 'O\'chirish?',
        text: 'Test butunlay o\'chiriladi',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ha'
    }).then((result) => {
        if (result.isConfirmed) {
            DB.tests = DB.tests.filter(t => t.id !== newTestId);
            saveDB();
            
            document.getElementById('stepResult').style.display = 'none';
            resetForm();
            
            Swal.fire('O\'chirildi', '', 'success');
        }
    });
}

// Formani tozalash
function resetForm() {
    currentStep = 1;
    uploadedQuestions = [];
    selectedSubject = '';
    newTestId = null;
    
    document.getElementById('step1').style.display = 'block';
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step3').style.display = 'none';
    document.getElementById('step4').style.display = 'none';
    document.getElementById('stepResult').style.display = 'none';
    
    document.getElementById('subjectSelect').value = '';
    document.getElementById('newSubjectInput').value = '';
    document.getElementById('newSubjectInput').style.display = 'none';
    document.getElementById('excelFile').value = '';
    document.getElementById('testQuestionCount').value = '';
    document.getElementById('testScorePerQuestion').value = '';
    document.getElementById('testDuration').value = '';
}

// Mening testlarim jadvalini yangilash
function updateMyTestsTable() {
    const tbody = document.getElementById('myTestsTableBody');
    tbody.innerHTML = '';
    
    const userTests = DB.tests.filter(t => t.creatorId === DB.currentUser.id || DB.currentUser.role === 'admin');
    
    userTests.forEach(test => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${test.subject}</td>
            <td><span class="badge ${test.type === 'public' ? 'bg-success' : 'bg-warning'}">${test.type === 'public' ? 'Umumiy' : 'Shaxsiy'}</span></td>
            <td>${test.totalQuestions}</td>
            <td>${test.status === 'active' ? '<span style="color:green">Aktiv</span>' : '<span style="color:red">Nofaol</span>'}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="copyTestLink('${test.id}')"><i class="fas fa-copy"></i></button>
                <button class="btn btn-sm btn-info" onclick="showTestStats('${test.id}')"><i class="fas fa-chart-bar"></i></button>
                <button class="btn btn-sm btn-danger" onclick="deleteTest('${test.id}')"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function copyTestLink(testId) {
    const test = DB.tests.find(t => t.id === testId);
    if (test) {
        navigator.clipboard.writeText(test.link);
        Swal.fire('Nusxalandi', '', 'success');
    }
}

function deleteTest(testId) {
    Swal.fire({
        title: 'O\'chirish?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ha'
    }).then((result) => {
        if (result.isConfirmed) {
            DB.tests = DB.tests.filter(t => t.id !== testId);
            saveDB();
            updateMyTestsTable();
            Swal.fire('O\'chirildi', '', 'success');
        }
    });
}

// Statistika sahifasini yangilash
function updateAnalytics() {
    const userTests = DB.tests.filter(t => t.creatorId === DB.currentUser.id || DB.currentUser.role === 'admin');
    const totalTests = userTests.length;
    
    let totalParticipants = 0;
    userTests.forEach(test => {
        const testResults = DB.results.filter(r => r.testId === test.id);
        totalParticipants += testResults.length;
    });
    
    document.getElementById('totalTestsCount').textContent = totalTests;
    document.getElementById('totalParticipantsCount').textContent = totalParticipants;
}

// Fanlar ro'yxatini yangilash
function updateSubjectsList() {
    const list = document.getElementById('subjectsList');
    list.innerHTML = '';
    
    DB.subjects.forEach(subject => {
        const publicTests = DB.tests.filter(t => t.subject === subject && t.type === 'public').length;
        const privateTests = DB.tests.filter(t => t.subject === subject && t.type === 'private' && t.creatorId === DB.currentUser.id).length;
        
        const li = document.createElement('li');
        li.style.padding = '10px';
        li.style.borderBottom = '1px solid #eee';
        li.innerHTML = `
            <strong>${subject}</strong><br>
            <small>Umumiy: ${publicTests} | Shaxsiy: ${privateTests}</small>
        `;
        list.appendChild(li);
    });
}

// Test statistikasini ko'rsatish
function showTestStats(testId) {
    const test = DB.tests.find(t => t.id === testId);
    if (!test) return;
    
    const results = DB.results.filter(r => r.testId === testId);
    
    let html = `
        <div id="statsContent">
            <p><strong>Fan:</strong> ${test.subject}</p>
            <p><strong>Jami ishtirokchilar:</strong> ${results.length}</p>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Ism</th>
                        <th>Ball</th>
                        <th>To\'g\'ri</th>
                        <th>Noto\'g\'ri</th>
                        <th>Vaqt</th>
                        <th>Sana</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    results.forEach(result => {
        const correctCount = result.answers.filter((ans, idx) => ans === test.questions[idx].correctAnswer).length;
        const wrongCount = test.totalQuestions - correctCount;
        
        html += `
            <tr>
                <td>${result.studentName}</td>
                <td>${result.score}</td>
                <td style="color:green">${correctCount}</td>
                <td style="color:red">${wrongCount}</td>
                <td>${formatTime(result.timeSpent)}</td>
                <td>${formatDate(result.completedAt)}</td>
            </tr>
        `;
    });
    
    html += `</tbody></table></div>`;
    
    document.getElementById('statsModalTitle').textContent = `${test.subject} - Statistika`;
    document.getElementById('statsModalBody').innerHTML = html;
    showModal('statsModal');
}

function printStatsPDF() {
    printToPDF('statsContent', 'test_statistika');
}

// Dashboardni umumiy yangilash
function updateDashboard() {
    updateMyTestsTable();
    updateAnalytics();
}

console.log("Dashboard.js yuklandi");