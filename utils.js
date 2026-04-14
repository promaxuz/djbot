// UTILS.JS - Umumiy yordamchi funksiyalar

// Global ma'lumotlar bazasi (LocalStorage bilan ishlaydi)
const DB = {
    users: JSON.parse(localStorage.getItem('protest_users')) || [],
    subjects: JSON.parse(localStorage.getItem('protest_subjects')) || ['Matematika', 'Informatika', 'Fizika', 'Tarix'],
    tests: JSON.parse(localStorage.getItem('protest_tests')) || [],
    results: JSON.parse(localStorage.getItem('protest_results')) || [],
    currentUser: null
};

// Ma'lumotlarni saqlash
function saveDB() {
    localStorage.setItem('protest_users', JSON.stringify(DB.users));
    localStorage.setItem('protest_subjects', JSON.stringify(DB.subjects));
    localStorage.setItem('protest_tests', JSON.stringify(DB.tests));
    localStorage.setItem('protest_results', JSON.stringify(DB.results));
}

// Modal oynalarni boshqarish
function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Tashqariga bosganda modalni yopish
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
}

// Sahifa bo'ylab harakat
function scrollToFeatures() {
    document.getElementById('featuresSection').scrollIntoView({ behavior: 'smooth' });
}

// Linkni nusxalash
function copyLink() {
    const linkInput = document.getElementById('testLink');
    linkInput.select();
    document.execCommand('copy');
    
    Swal.fire({
        icon: 'success',
        title: 'Nusxalandi!',
        text: 'Havola buferga ko\'chirildi',
        timer: 1500,
        showConfirmButton: false
    });
}

// Excel namuna yuklab olish
function downloadTemplate() {
    // Oddiy CSV formatida namuna yaratamiz
    const csvContent = "data:text/csv;charset=utf-8," 
        + "Tartib raqami,Savol,To'g'ri javob,Muqobil javob 1,Muqobil javob 2,Muqobil javob 3\n"
        + "1,O'zbekiston poytaxti qaysi shahar?,Toshkent,Samarqand,Buxoro,Xiva\n"
        + "2,2+2=? ,4,3,5,6";
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "test_namuna.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// QR Kod yaratish
function generateQRCode(text, elementId) {
    const qrContainer = document.getElementById(elementId);
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
        text: text,
        width: 128,
        height: 128
    });
}

// PDF ga chop etish
function printToPDF(elementId, filename = 'hisobot') {
    const element = document.getElementById(elementId);
    html2pdf().from(element).save(filename + '.pdf');
}

// Formatlash funksiyalari
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('uz-UZ', options);
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Unique ID yaratish
function generateId() {
    return 'test_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

console.log("Utils.js yuklandi");