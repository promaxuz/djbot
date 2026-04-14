# ProTest Platform - Professional Test Tizimi

## 📋 Loyiha haqida
Bu professional test platformasi bo'lib, quyidagi funksiyalarni o'z ichiga oladi:

### ✨ Asosiy Xususiyatlar

1. **Autentifikatsiya**
   - Email/Parol orqali kirish
   - Google OAuth orqali kirish (simulyatsiya)
   - Ro'yxatdan o'tish
   - Admin paneli (admin@protest.uz / admin)

2. **Test Yaratish**
   - Fan tanlash (tayyor yoki yangi qo'shish)
   - Excel orqali savollarni yuklash
   - Umumiy yoki Shaxsiy baza tanlash
   - Test parametrlari (savollar soni, ball, vaqt, aktivlik muddati)
   - Avtomatik QR kod va link yaratish

3. **Test Ishlash**
   - Ism-familiya kiritish
   - Taymer bilan ishlash
   - Oldinga/orqaga o'tish
   - Natijalarni real-vaqtda ko'rsatish

4. **Statistika va Hisobot**
   - Har bir test uchun batafsil statistika
   - Ishtirokchilar ro'yxati
   - To'g'ri/noto'g'ri javoblar tahlili
   - PDF formatida chop etish

## 🚀 Ishga Tushirish

Faylni shunchaki brauzerda oching:
```bash
# Oddiy usul
index.html faylini brauzerda oching

# Yoki Python server orqali
python3 -m http.server 8000
# Keyin http://localhost:8000 ga o'ting
```

## 📁 Fayl Tuzilishi

```
/workspace/
├── index.html          # Asosiy HTML sahifa
├── style.css           # Barcha stillar
├── utils.js            # Yordamchi funksiyalar
├── auth.js             # Kirish/Ro'yxatdan o'tish
├── dashboard.js        # Foydalanuvchi paneli
├── test-runner.js      # Test ishlash jarayoni
└── app.js              # Asosiy dastur logikasi
```

## 🔐 Demo Hisoblar

**Admin:**
- Email: `admin@protest.uz`
- Parol: `admin`

**Demo User:**
- Email: `demo@test.uz`
- Parol: `12345`

## 📝 Excel Format Namuna

Excel faylingiz quyidagi ustunlarga ega bo'lishi kerak:

| Tartib raqami | Savol | To'g'ri javob | Muqobil 1 | Muqobil 2 | Muqobil 3 |
|--------------|-------|---------------|-----------|-----------|-----------|
| 1 | O'zbekiston poytaxti? | Toshkent | Samarqand | Buxoro | Xiva |
| 2 | 2+2=? | 4 | 3 | 5 | 6 |

## 🛠 Texnologiyalar

- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Kutubxonalar:**
  - Font Awesome (Iconlar)
  - SheetJS/XLSX (Excel o'qish)
  - QRCode.js (QR kod yaratish)
  - html2pdf.js (PDF eksport)
  - SweetAlert2 (Chiroyli xabarlar)
- **Ma'lumotlar bazasi:** LocalStorage (brauzer xotirasi)

## 🎯 Funksiyalar

### Admin Imkoniyatlari
- Barcha foydalanuvchilarni boshqarish
- Barcha testlarni ko'rish va tahrirlash
- Umumiy statistika
- Har bir foydalanuvchi natijalarini ko'rish

### Oddiy Foydalanuvchi
- Shaxsiy testlar yaratish
- Umumiy bazadan foydalanish
- O'z testlarining statistikasini ko'rish
- QR kod orqali test ulashish

## 📱 Responsive Dizayn

Sayt barcha qurilmalarda (kompyuter, planshet, telefon) to'g'ri ishlaydi.

## ⚠️ Eslatma

Bu loyiha **frontend-only** versiya bo'lib, ma'lumotlar brauzerning LocalStorage saqlanadi. Haqiqiy loyihada backend (Node.js, Python, PHP) va ma'lumotlar bazasi (MongoDB, PostgreSQL) kerak bo'ladi.

---

**Muallif:** ProTest Team  
**Versiya:** 1.0  
**Sana:** 2024
