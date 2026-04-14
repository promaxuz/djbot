// APP.JS - Asosiy dastur logikasi va ishga tushirish

// Sahifa yuklanganda ishga tushadi
document.addEventListener('DOMContentLoaded', function() {
    console.log('ProTest Platforma ishga tushdi...');
    
    // Autentifikatsiya holatini tekshirish
    checkAuthState();
    
    // Yangi fan qo'shish inputini boshqarish
    const subjectSelect = document.getElementById('subjectSelect');
    const newSubjectInput = document.getElementById('newSubjectInput');
    
    if (subjectSelect) {
        subjectSelect.addEventListener('change', function() {
            if (this.value === 'new_subject') {
                newSubjectInput.style.display = 'block';
                newSubjectInput.focus();
            } else {
                newSubjectInput.style.display = 'none';
            }
        });
    }
});

// Sahifa o'zgarish funksiyasi
function showSection(sectionId) {
    // Hamma sectionlarni yashirish
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Keraklisini ko'rsatish
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
    }
    
    // URL ni yangilash (test runner uchun emas)
    if (sectionId !== 'runnerSection') {
        window.history.pushState({}, '', window.location.pathname);
    }
}

// Admin huquqlarini tekshirish
function isAdmin() {
    return DB.currentUser && DB.currentUser.role === 'admin';
}

// Barcha testlarni ko'rish (Admin uchun)
function viewAllTests() {
    if (!isAdmin()) {
        Swal.fire('Ruxsat yo\'q', 'Faqat admin buni ko\'ra oladi', 'warning');
        return;
    }
    
    switchDashTab('analytics');
    
    const allTests = DB.tests;
    const totalParticipants = DB.results.length;
    
    let html = `
        <h3>Barcha testlar (${allTests.length})</h3>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Fan</th>
                    <th>Tuzgan</th>
                    <th>Turi</th>
                    <th>Savollar</th>
                    <th>Ishtirokchilar</th>
                    <th>Sana</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    allTests.forEach(test => {
        const participants = DB.results.filter(r => r.testId === test.id).length;
        html += `
            <tr>
                <td>${test.subject}</td>
                <td>${test.creatorName}</td>
                <td>${test.type === 'public' ? 'Umumiy' : 'Shaxsiy'}</td>
                <td>${test.totalQuestions}</td>
                <td>${participants}</td>
                <td>${formatDate(test.createdAt)}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    
    document.getElementById('detailedStatsArea').innerHTML = html;
}

// Global xabarlar
window.addEventListener('online', () => {
    console.log('Internetga ulandi');
});

window.addEventListener('offline', () => {
    Swal.fire({
        icon: 'warning',
        title: 'Internet yo\'q',
        text: 'Ba\'zi funksiyalar ishlamasligi mumkin'
    });
});

// LocalStorage tozalash (Debug uchun)
function clearDB() {
    Swal.fire({
        title: 'Hammasini o\'chirish?',
        text: 'Barcha foydalanuvchilar, testlar va natijalar o\'chiriladi!',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ha, o\'chirish',
        cancelButtonText: 'Yo\'q'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear();
            location.reload();
        }
    });
}

// Demo ma'lumotlar yaratish (Test uchun)
function createDemoData() {
    // Demo user
    const demoUser = {
        id: 'demo_user',
        name: 'Demo Foydalanuvchi',
        email: 'demo@test.uz',
        password: '12345',
        role: 'user'
    };
    
    if (!DB.users.find(u => u.email === demoUser.email)) {
        DB.users.push(demoUser);
    }
    
    // Demo test
    const demoTest = {
        id: 'demo_test_1',
        subject: 'Informatika',
        type: 'public',
        creatorId: 'demo_user',
        creatorName: 'Demo Foydalanuvchi',
        questions: [
            {
                id: 1,
                question: 'HTML qanday ma\'noni anglatadi?',
                correctAnswer: 'Hyper Text Markup Language',
                options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Mark Language', 'Home Tool Markup Language']
            },
            {
                id: 2,
                question: 'CSS bu...',
                correctAnswer: 'Cascading Style Sheets',
                options: ['Computer Style Sheets', 'Cascading Style Sheets', 'Creative Style System', 'Colorful Style Sheets']
            },
            {
                id: 3,
                question: 'JavaScript asosiy vazifasi?',
                correctAnswer: 'Veb sahifani interaktiv qilish',
                options: ['Ma\'lumot bazasi', 'Veb sahifani interaktiv qilish', 'Serverni sozlash', 'Grafika chizish']
            }
        ],
        totalQuestions: 3,
        scorePerQuestion: 1,
        maxScore: 3,
        duration: 5,
        activeDuration: 'always',
        createdAt: new Date().toISOString(),
        link: window.location.origin + window.location.pathname + '?test=demo_test_1',
        status: 'active'
    };
    
    if (!DB.tests.find(t => t.id === demoTest.id)) {
        DB.tests.push(demoTest);
    }
    
    saveDB();
    console.log('Demo ma\'lumotlar yaratildi');
}

// Sahifa yuklanganda demo ma'lumotlarni yaratish
createDemoData();

console.log("App.js yuklandi - Tizim tayyor!");