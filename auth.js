// AUTH.JS - Autentifikatsiya (Kirish/Ro'yxatdan o'tish)

// Tizimga kirish (Login)
function handleLogin(event) {
    event.preventDefault();
    
    const email = event.target[0].value;
    const password = event.target[1].value;
    
    // Admin uchun maxsus tekshiruv
    if (email === 'admin@protest.uz' && password === 'admin') {
        DB.currentUser = {
            id: 'admin',
            name: 'Admin',
            email: email,
            role: 'admin'
        };
        loginSuccess();
        return;
    }
    
    // Oddiy foydalanuvchi
    const user = DB.users.find(u => u.email === email && u.password === password);
    
    if (user) {
        DB.currentUser = user;
        loginSuccess();
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Xatolik!',
            text: 'Email yoki parol noto\'g\'ri'
        });
    }
}

// Ro'yxatdan o'tish (Register)
function handleRegister(event) {
    event.preventDefault();
    
    const name = event.target[0].value;
    const email = event.target[1].value;
    const password = event.target[2].value;
    
    // Email mavjudligini tekshirish
    if (DB.users.find(u => u.email === email)) {
        Swal.fire({
            icon: 'warning',
            title: 'Diqqat!',
            text: 'Bu email bilan foydalanuvchi allaqachon mavjud'
        });
        return;
    }
    
    const newUser = {
        id: generateId(),
        name: name,
        email: email,
        password: password,
        role: 'user',
        createdAt: new Date().toISOString()
    };
    
    DB.users.push(newUser);
    saveDB();
    
    DB.currentUser = newUser;
    
    Swal.fire({
        icon: 'success',
        title: 'Muvaffaqiyatli!',
        text: 'Ro\'yxatdan o\'tdingiz'
    }).then(() => {
        closeModal('registerModal');
        loginSuccess();
    });
}

// Google orqali kirish (Simulyatsiya)
function googleLogin() {
    // Haqiqiy loyihada Firebase yoki Google OAuth API ishlatiladi
    // Hozircha simulyatsiya qilamiz
    
    Swal.fire({
        title: 'Google orqali kirish...',
        text: 'Bu demo versiya, shunchaki davom etamiz',
        timer: 1500,
        didOpen: () => {
            Swal.showLoading();
        }
    }).then(() => {
        const googleUser = {
            id: 'google_' + Date.now(),
            name: 'Google User',
            email: 'user@gmail.com',
            role: 'user',
            provider: 'google'
        };
        
        // Agar mavjud bo'lmasa qo'shamiz
        let existingUser = DB.users.find(u => u.email === googleUser.email);
        if (!existingUser) {
            DB.users.push(googleUser);
            saveDB();
            DB.currentUser = googleUser;
        } else {
            DB.currentUser = existingUser;
        }
        
        loginSuccess();
    });
}

// Login muvaffaqiyatli bo'lganda
function loginSuccess() {
    closeModal('loginModal');
    closeModal('registerModal');
    
    // UI ni yangilash
    document.getElementById('guestNav').style.display = 'none';
    document.getElementById('userNav').style.display = 'flex';
    document.getElementById('userNameDisplay').textContent = DB.currentUser.name;
    
    // Dashboardga o'tish
    showSection('dashboardSection');
    updateDashboard();
    
    Swal.fire({
        icon: 'success',
        title: 'Xush kelibsiz!',
        text: DB.currentUser.name,
        timer: 1500,
        showConfirmButton: false
    });
}

// Chiqish (Logout)
function logout() {
    DB.currentUser = null;
    
    document.getElementById('guestNav').style.display = 'block';
    document.getElementById('userNav').style.display = 'none';
    
    showSection('homeSection');
    
    Swal.fire({
        icon: 'success',
        title: 'Chiqildi',
        timer: 1000,
        showConfirmButton: false
    });
}

// Sahifani yangilaganda holatni tekshirish
function checkAuthState() {
    // Agar URL da test parametri bo'lsa, test runner ochiladi
    const urlParams = new URLSearchParams(window.location.search);
    const testId = urlParams.get('test');
    
    if (testId) {
        // Test ishlash rejimi
        showSection('runnerSection');
        initTestRunner(testId);
        return;
    }
    
    // Agar user login qilingan bo'lsa
    if (DB.currentUser) {
        document.getElementById('guestNav').style.display = 'none';
        document.getElementById('userNav').style.display = 'flex';
        document.getElementById('userNameDisplay').textContent = DB.currentUser.name;
        showSection('dashboardSection');
        updateDashboard();
    } else {
        showSection('homeSection');
    }
}

console.log("Auth.js yuklandi");