// TEST-RUNNER.JS - Test ishlash jarayoni

let currentTest = null;
let currentAnswers = [];
let currentQuestionIndex = 0;
let startTime = null;
let timerInterval = null;
let studentInfo = {};

// Test runner ni ishga tushirish
function initTestRunner(testId) {
    // Testni topish
    currentTest = DB.tests.find(t => t.id === testId);
    
    if (!currentTest) {
        Swal.fire({
            icon: 'error',
            title: 'Xatolik!',
            text: 'Test topilmadi yoki o\'chirilgan',
            allowOutsideClick: false,
            allowEscapeKey: false
        }).then(() => {
            window.location.href = window.location.pathname; // Bosh sahifaga
        });
        return;
    }
    
    // Test aktivligini tekshirish
    if (currentTest.status !== 'active') {
        Swal.fire({
            icon: 'warning',
            title: 'Test mavjud emas',
            text: 'Bu test hozirda faol emas'
        }).then(() => {
            window.location.href = window.location.pathname;
        });
        return;
    }
    
    console.log('Test yuklandi:', currentTest.subject);
}

// Test jarayonini boshlash (Ism familiya kiritish)
function startTestProcess() {
    const fullName = document.getElementById('studentFullName').value.trim();
    const group = document.getElementById('studentGroup').value.trim();
    
    if (!fullName) {
        Swal.fire('Xatolik', 'Ism familiyangizni kiriting', 'warning');
        return;
    }
    
    studentInfo = {
        name: fullName,
        group: group || 'N/A'
    };
    
    // Kirish oynasini yashirish, test oynasini ko'rsatish
    document.getElementById('runnerLogin').style.display = 'none';
    document.getElementById('runnerQuiz').style.display = 'block';
    
    // Javoblar massivini tayyorlash
    currentAnswers = new Array(currentTest.totalQuestions).fill(null);
    currentQuestionIndex = 0;
    startTime = new Date();
    
    // Taymerni ishga tushirish
    startTimer(currentTest.duration * 60); // daqiqani sekundga
    
    // Birinchi savolni ko'rsatish
    showQuestion(0);
}

// Savolni ko'rsatish
function showQuestion(index) {
    const question = currentTest.questions[index];
    
    document.getElementById('questionText').textContent = `${index + 1}. ${question.question}`;
    document.getElementById('quizProgress').textContent = `Savol ${index + 1} / ${currentTest.totalQuestions}`;
    
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';
    
    // Variantlarni aralashtirib ko'rsatish (har safar yangi tartibda)
    const shuffledOptions = [...question.options].sort(() => 0.5 - Math.random());
    
    shuffledOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = option;
        
        // Agar oldin tanlangan bo'lsa
        if (currentAnswers[index] === option) {
            btn.classList.add('selected');
        }
        
        btn.onclick = () => selectOption(option, btn);
        optionsContainer.appendChild(btn);
    });
    
    // Tugmalarni boshqarish
    document.getElementById('prevBtn').disabled = index === 0;
    
    if (index === currentTest.totalQuestions - 1) {
        document.getElementById('nextBtn').style.display = 'none';
        document.getElementById('finishBtn').style.display = 'inline-block';
    } else {
        document.getElementById('nextBtn').style.display = 'inline-block';
        document.getElementById('finishBtn').style.display = 'none';
    }
}

// Variant tanlash
function selectOption(option, btnElement) {
    // Hamma tugmadan selected class olish
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    
    // Tanlanganga qo'shish
    btnElement.classList.add('selected');
    currentAnswers[currentQuestionIndex] = option;
}

// Keyingi savol
function nextQuestion() {
    if (currentQuestionIndex < currentTest.totalQuestions - 1) {
        currentQuestionIndex++;
        showQuestion(currentQuestionIndex);
    }
}

// Oldingi savol
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        showQuestion(currentQuestionIndex);
    }
}

// Taymer
function startTimer(duration) {
    let remaining = duration;
    
    timerInterval = setInterval(() => {
        remaining--;
        
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        
        document.getElementById('quizTimer').innerHTML = 
            `<i class="fas fa-clock"></i> ${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (remaining <= 0) {
            finishTest(true); // Vaqt tugadi
        }
    }, 1000);
}

// Testni yakunlash
function finishTest(timeUp = false) {
    if (!timeUp) {
        // Tasdiqlash
        const answeredCount = currentAnswers.filter(a => a !== null).length;
        const unanswered = currentTest.totalQuestions - answeredCount;
        
        if (unanswered > 0) {
            Swal.fire({
                title: 'Diqqat!',
                text: `${unanswered} ta savolga javob bermadingiz. Davom etasizmi?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Ha, yakunlash'
            }).then((result) => {
                if (result.isConfirmed) {
                    completeTest();
                }
            });
            return;
        }
    }
    
    completeTest();
}

// Testni to'liq yakunlash va natijalarni hisoblash
function completeTest() {
    clearInterval(timerInterval);
    
    const endTime = new Date();
    const timeSpent = Math.floor((endTime - startTime) / 1000); // sekundda
    
    // Natijalarni hisoblash
    let correctCount = 0;
    let wrongCount = 0;
    
    currentTest.questions.forEach((q, idx) => {
        if (currentAnswers[idx] === q.correctAnswer) {
            correctCount++;
        } else {
            wrongCount++;
        }
    });
    
    const score = correctCount * currentTest.scorePerQuestion;
    const percentage = (correctCount / currentTest.totalQuestions) * 100;
    
    // Natijani saqlash
    const result = {
        id: generateId(),
        testId: currentTest.id,
        studentName: studentInfo.name,
        studentGroup: studentInfo.group,
        answers: currentAnswers,
        correctCount: correctCount,
        wrongCount: wrongCount,
        score: score,
        maxScore: currentTest.maxScore,
        percentage: percentage,
        timeSpent: timeSpent,
        completedAt: endTime.toISOString()
    };
    
    DB.results.push(result);
    saveDB();
    
    // Natijalarni ko'rsatish
    showResults(result);
}

// Natijalarni ko'rsatish
function showResults(result) {
    document.getElementById('runnerQuiz').style.display = 'none';
    document.getElementById('runnerResult').style.display = 'block';
    
    const content = document.getElementById('resultContent');
    
    let html = `
        <div style="text-align: center; margin-bottom: 2rem;">
            <h3>${studentInfo.name}</h3>
            <p>${currentTest.subject} fani bo'yicha test natijasi</p>
        </div>
        
        <div class="stats-cards">
            <div class="stat-card" style="background: #10b981;">
                <h3>To'g'ri</h3>
                <p>${result.correctCount}</p>
            </div>
            <div class="stat-card" style="background: #ef4444;">
                <h3>Noto'g'ri</h3>
                <p>${result.wrongCount}</p>
            </div>
            <div class="stat-card" style="background: #4f46e5;">
                <h3>Ball</h3>
                <p>${result.score} / ${result.maxScore}</p>
            </div>
            <div class="stat-card" style="background: #f59e0b;">
                <h3>Foiz</h3>
                <p>${result.percentage.toFixed(1)}%</p>
            </div>
        </div>
        
        <div style="margin-top: 2rem;">
            <h4>Batafsil tahlil:</h4>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Savol</th>
                        <th>Sizning javob</th>
                        <th>To'g'ri javob</th>
                        <th>Natija</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    currentTest.questions.forEach((q, idx) => {
        const userAnswer = result.answers[idx];
        const isCorrect = userAnswer === q.correctAnswer;
        
        html += `
            <tr>
                <td>${idx + 1}</td>
                <td>${q.question.substring(0, 50)}${q.question.length > 50 ? '...' : ''}</td>
                <td style="color: ${isCorrect ? 'green' : 'red'}">${userAnswer || 'Javob yo\'q'}</td>
                <td style="color: green">${q.correctAnswer}</td>
                <td>${isCorrect ? '<i class="fas fa-check" style="color:green"></i>' : '<i class="fas fa-times" style="color:red"></i>'}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <div style="margin-top: 1rem; color: #666;">
            <p><strong>Sarflangan vaqt:</strong> ${formatTime(result.timeSpent)}</p>
            <p><strong>Sana:</strong> ${formatDate(result.completedAt)}</p>
        </div>
    `;
    
    content.innerHTML = html;
}

// PDF ga chop etish (Natija)
function printResultPDF() {
    printToPDF('resultContent', `natija_${studentInfo.name.replace(/\s/g, '_')}`);
}

console.log("Test-runner.js yuklandi");