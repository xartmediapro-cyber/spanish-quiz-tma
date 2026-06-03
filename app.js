// Initialize Telegram WebApp SDK
const tg = window.Telegram ? window.Telegram.WebApp : null;

// Backend Log URL (replace with domain if configured, defaults to IP on port 3000)
const API_URL = 'https://151.243.177.120.sslip.io:8444/api/log';

// Helper function to open Telegram links correctly inside and outside Telegram
function openTgLink(url) {
    const isInsideTelegram = tg && tg.platform && tg.platform !== 'unknown';
    if (isInsideTelegram) {
        tg.openTelegramLink(url);
    } else {
        window.open(url, '_blank');
    }
}

function updatePlatformClass() {
    const desktopPlatforms = ['tdesktop', 'macos', 'web', 'weba', 'webk'];
    const isTelegramDesktop = tg && tg.platform && desktopPlatforms.includes(tg.platform);
    const isWideScreen = window.innerWidth > 480;
    
    if (isTelegramDesktop || isWideScreen) {
        document.body.classList.add('platform-desktop');
    } else {
        document.body.classList.remove('platform-desktop');
    }
}

if (tg) {
    tg.ready();
    tg.expand();
    if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

updatePlatformClass();
window.addEventListener('resize', updatePlatformClass);

// Session details for analytics
const startTime = Date.now();
let userProfile = {
    userId: 'browser_user_' + Math.floor(Math.random() * 100000),
    name: 'Browser User',
    username: ''
};

// Populate user profile from Telegram metadata if available
if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
    const u = tg.initDataUnsafe.user;
    userProfile = {
        userId: String(u.id),
        name: [u.first_name, u.last_name].filter(Boolean).join(' '),
        username: u.username || ''
    };
}

// Send logs to backend API (fails silently in the background)
function sendLog(event, score = null) {
    const elapsedSeconds = Math.round((Date.now() - startTime) / 1000);
    const payload = {
        userId: userProfile.userId,
        name: userProfile.name,
        username: userProfile.username,
        event: event,
        timeSpent: elapsedSeconds
    };
    if (score !== null) {
        payload.score = score;
    }

    // Use sendBeacon if browser is closing to ensure delivery, fallback to fetch
    if (event === 'page_exit' && navigator.sendBeacon) {
        navigator.sendBeacon(API_URL, JSON.stringify(payload));
    } else {
        fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(err => console.log('Analytics log failed:', err));
    }
}

// Log initial page view
sendLog('welcome');

// Send exit log when user leaves
function handleExit() {
    const qIndex = currentQuestionIndex + 1;
    const finalScore = Object.keys(userAnswers).length === 10 
        ? Object.values(userAnswers).reduce((sum, val) => sum + val, 0) 
        : null;
    
    // If they finished, they didn't drop out. Otherwise, log exit question.
    const eventName = finalScore !== null ? 'result' : `question_${qIndex}`;
    sendLog(eventName, finalScore);
}
window.addEventListener('visibilitychange', () => {
    if (document.hidden) handleExit();
});
window.addEventListener('pagehide', handleExit);


// 10 Quiz Questions with beautiful, clean 3-4 line paragraph breaks
const quizQuestions = [
    {
        id: 1,
        level: 'Уровень 1',
        title: 'Тебе нужно заказать кофе в испанском баре.<br>Твои действия:',
        options: [
            { text: 'Вежливо прошепчу:<br>"Здравствуйте, прошу прощения, не могли бы вы принести капучино на овсяном..."', points: 1 },
            { text: 'Громко, на весь бар, крикну бармену:<br>"¡Hola! Ponme un café" и спрошу, как дела.', points: 3 },
            { text: 'Закажу через приложение, лишь бы ни с кем не общаться лицом к лицу.', points: 0 }
        ],
        hint: 'В Испании избыточная вежливость считывается как холодность и высокомерие. Здесь все общаются просто, громко и прямо. И никаких "вы" в повседневной жизни.'
    },
    {
        id: 2,
        level: 'Уровень 2',
        title: 'Договорился с испанским сантехником на "завтра утром".<br>В 11:30 его всё еще нет.<br>Твоя реакция:',
        options: [
            { text: 'Начну писать гневные сообщения, требовать компенсацию и грозить судом.<br>У меня дедлайны!', points: 0 },
            { text: 'Пойму, что испанское "утро" длится до 14:00.<br>Спокойно налью себе чашечку кофе и буду читать книгу.', points: 3 },
            { text: 'Буду сидеть у двери, нервно проверять телефон каждые две минуты.', points: 1 }
        ],
        hint: 'Испанское "mañana" — это не завтрашний день, это образ мышления: "сделаю когда-нибудь". В Испании не принято спешить и устраивать невроз из-за времени.'
    },
    {
        id: 3,
        level: 'Уровень 3',
        title: 'Пятница, 22:00.<br>Каковы твои планы на вечер?',
        options: [
            { text: 'Ложусь спать.<br>Завтра же тренировка и продуктивный день, режим нарушать нельзя.', points: 1 },
            { text: 'Смеюсь на шумной террасе бара с друзьями, пью вино до 2 часов ночи.', points: 3 },
            { text: 'Открываю ноутбук.<br>Надо доделать рабочий проект, пока никто не отвлекает.', points: 0 }
        ],
        hint: 'Испанцы живут на улице. Бары — это их гостиные. Закрываться дома в пятницу вечером считается странным.'
    },
    {
        id: 4,
        level: 'Уровень 4',
        title: 'В местном ведомстве в третий раз отказали в выдаче документа, потому что "зависла система".<br>Твои мысли:',
        options: [
            { text: 'Разнесу этот офис! Потребую старшего!<br>Что за банановая республика!', points: 0 },
            { text: 'Улыбнусь чиновнику, скажу<br>"No pasa nada" (ничего страшного),<br>пожелаю хороших выходных и пойду пить пиво.', points: 3 },
            { text: 'Молча уйду в депрессию, сяду плакать на лавочке и захочу домой.', points: 1 }
        ],
        hint: 'Бюрократия в Испании медленная, но агрессия только усугубит дело. Решить вопросы можно только улыбкой, терпением и хорошим испанским.'
    },
    {
        id: 5,
        level: 'Уровень 5',
        title: 'Твоя карьера и работа для тебя — это:',
        options: [
            { text: 'Лишь инструмент, чтобы оплачивать счета.<br>Моя реальная жизнь начинается после 18:00.', points: 3 },
            { text: 'Моя личная религия.<br>Если я не работаю по выходным, то чувствую тревогу. Карьера — всё.', points: 0 },
            { text: 'Люблю свое дело, но без фанатизма.<br>Если встанет выбор: работа или вино у моря — выбор очевиден.', points: 2 }
        ],
        hint: 'В Испании культ наслаждения жизнью (disfrutar de la vida). Здесь никто не уважает трудоголиков, которые сгорают ради прибыли. Если не умеешь расслабляться, общество тебя не поймет.'
    },
    {
        id: 6,
        level: 'Уровень 6',
        title: 'Малознакомый испанец при встрече бурно жестикулирует, подходит близко, хлопает тебя по плечу и целует в обе щеки.<br>Твоя реакция:',
        options: [
            { text: 'Сделаю шаг назад, это грубое нарушение моих личных границ.', points: 0 },
            { text: 'Расслаблюсь и обниму в ответ.<br>Здесь все так общаются, это нормально.', points: 3 },
            { text: 'Замру от шока, сделав дежурную натянутую улыбку.', points: 1 }
        ],
        hint: 'В Испании понятие личных границ гораздо уже, чем на севере. Физический контакт, объятия и поцелуи при встрече — знак дружелюбия, а не фамильярности.'
    },
    {
        id: 7,
        level: 'Уровень 7',
        title: 'Ты пришел поужинать в ресторан в 18:30, а он закрыт.<br>Твои действия:',
        options: [
            { text: 'Ужаснусь такому сервису.<br>Зачем ресторану закрываться в самое прибыльное время?', points: 0 },
            { text: 'Пойму, что до ужина еще два часа.<br>Перекушу тапасом в баре за углом и подожду открытия.', points: 3 },
            { text: 'Куплю шаурму или фастфуд на бегу, чтобы не ломать свой привычный режим.', points: 1 }
        ],
        hint: 'Испанцы обедают с 14:00 до 16:00, а ужинают строго после 20:30 (а чаще в 21:30–22:00). В промежутках кухни ресторанов закрыты. Подстраиваться придется тебе.'
    },
    {
        id: 8,
        level: 'Уровень 8',
        title: 'Ты пытаешься говорить на испанском, путаешь времена и артикли.<br>Испанец улыбается и что-то быстро отвечает.<br>Твои мысли:',
        options: [
            { text: 'Стыд и языковой барьер.<br>Мне кажется, надо мной смеются.', points: 0 },
            { text: 'Драйв.<br>Испанцы обожают, когда пытаются говорить на их языке, они всегда поддержат.', points: 3 },
            { text: 'Желание перейти на английский, чтобы казаться умнее.', points: 1 }
        ],
        hint: 'Испанцы невероятно лояльны к ошибкам. Они никогда не будут поправлять тебя свысока, а наоборот — засыплют комплиментами за любую попытку сказать "hola".'
    },
    {
        id: 9,
        level: 'Уровень 9',
        title: 'Воскресенье, 15:00.<br>Тебе срочно нужно купить продукты, а все супермаркеты закрыты. Что будешь делать?',
        options: [
            { text: 'Буду возмущаться:<br>"Как можно закрывать магазины в выходной?!"', points: 0 },
            { text: 'Приму правила игры: воскресенье — день отдыха.<br>Закажу пиццу или найду открытую лавочку у китайцев.', points: 3 },
            { text: 'Пойму, что сам виноват, и пойду искать дежурный магазин на другом конце города.', points: 1 }
        ],
        hint: 'Воскресенье в Испании — это святое. Крупные магазины закрыты по закону. Это день для ленивых прогулок, обедов с рядом стоящей семьей и полной перезагрузки.'
    },
    {
        id: 10,
        level: 'Уровень 10',
        title: 'В кафе за соседним столиком люди не разговаривают, а буквально кричат, эмоционально размахивая руками. Что думаешь?',
        options: [
            { text: 'Они ссорятся, сейчас начнется драка. Нужно пересесть подальше.', points: 0 },
            { text: 'Они просто увлеченно обсуждают паэлью.<br>В Испании это нормальная громкость разговора.', points: 3 },
            { text: 'Это некультурно и раздражает, почему персонал не сделает им замечание?', points: 1 }
        ],
        hint: 'Испания — очень шумная страна. Испанцы говорят громко и эмоционально, выражая радость жизни. Тишина здесь ассоциируется скорее со скукой или грустью.'
    }
];

// App State
let currentQuestions = [...quizQuestions];
let currentQuestionIndex = 0;
let userAnswers = {}; // Map of question ID to chosen option points

// DOM Elements
const screenWelcome = document.getElementById('screen-welcome');
const screenQuestion = document.getElementById('screen-question');
const screenResults = document.getElementById('screen-results');

const startQuizTrigger = document.querySelector('.start-quiz-trigger');

const questionLevel = document.getElementById('question-level');
const questionProgress = document.getElementById('question-progress');
const questionCounter = document.getElementById('question-counter');
const questionTitle = document.getElementById('question-title');
const questionOptions = document.getElementById('question-options');
const btnPrevQuestion = document.getElementById('btn-prev-question');
const btnHint = document.getElementById('btn-hint');

const hintModal = document.getElementById('hint-modal');
const hintContent = document.getElementById('hint-content');
const btnCloseModal = document.getElementById('btn-close-modal');

const resultScoreNum = document.getElementById('result-score-num');
const resultScoreLabel = document.getElementById('result-score-label');
const resultTitle = document.getElementById('result-title');
const resultDescription = document.getElementById('result-description');
const gaugeFill = document.getElementById('gauge-fill');
const ctaActionTrigger = document.querySelector('.cta-action-trigger');
const telegramChannelTrigger = document.querySelector('.telegram-channel-trigger');
const restartQuizTrigger = document.querySelector('.restart-quiz-trigger');

// Navigation Utilities
function switchScreen(fromScreen, toScreen) {
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
    
    fromScreen.classList.remove('active');
    setTimeout(() => {
        toScreen.classList.add('active');
    }, 150);
}

// Start Trigger (Direct Flow)
startQuizTrigger.addEventListener('click', () => {
    startQuiz();
});

// Start Quiz Logic
function startQuiz() {
    currentQuestionIndex = 0;
    userAnswers = {};
    sendLog('start'); // Log quiz start event
    switchScreen(screenWelcome, screenQuestion);
    renderQuestion();
}

// Render Question
function renderQuestion() {
    const q = currentQuestions[currentQuestionIndex];
    
    questionLevel.textContent = q.level;
    questionCounter.textContent = `${padZero(currentQuestionIndex + 1)} / ${padZero(currentQuestions.length)}`;
    
    const progressPercent = ((currentQuestionIndex + 1) / currentQuestions.length) * 100;
    questionProgress.style.width = `${progressPercent}%`;
    
    questionTitle.innerHTML = q.title;
    
    questionOptions.innerHTML = '';
    q.options.forEach((opt) => {
        const optionCard = document.createElement('div');
        optionCard.className = 'option-card';
        optionCard.innerHTML = opt.text;
        
        if (userAnswers[q.id] !== undefined && userAnswers[q.id] === opt.points) {
            optionCard.classList.add('selected');
        }
        
        optionCard.addEventListener('click', () => {
            if (tg && tg.HapticFeedback) {
                tg.HapticFeedback.impactOccurred('light');
            }
            
            document.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
            optionCard.classList.add('selected');
            
            userAnswers[q.id] = opt.points;
            
            // Log move to next question
            sendLog(`question_${currentQuestionIndex + 2}`);
            
            setTimeout(() => {
                goToNextQuestion();
            }, 300);
        });
        
        questionOptions.appendChild(optionCard);
    });
    
    if (btnPrevQuestion) {
        if (currentQuestionIndex === 0) {
            btnPrevQuestion.style.visibility = 'hidden';
        } else {
            btnPrevQuestion.style.visibility = 'visible';
        }
    }
}

// Navigation inside Quiz
function goToNextQuestion() {
    if (currentQuestionIndex < currentQuestions.length - 1) {
        currentQuestionIndex++;
        renderQuestion();
    } else {
        finishQuiz();
    }
}

if (btnPrevQuestion) {
    btnPrevQuestion.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion();
        }
    });
}

function padZero(num) {
    return num < 10 ? `0${num}` : num;
}

// Russian plural helper for points
function getRussianPlural(number, one, two, five) {
    let n = Math.abs(number);
    n %= 100;
    if (n >= 5 && n <= 20) {
        return five;
    }
    n %= 10;
    if (n === 1) {
        return one;
    }
    if (n >= 2 && n <= 4) {
        return two;
    }
    return five;
}

// Hint Modal Management
btnHint.addEventListener('click', () => {
    const q = currentQuestions[currentQuestionIndex];
    hintContent.textContent = q.hint;
    hintModal.classList.add('active');
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('medium');
    }
});

btnCloseModal.addEventListener('click', () => {
    hintModal.classList.remove('active');
});

let startY = 0;
let currentY = 0;
const modalSheet = document.querySelector('.modal-sheet');

if (modalSheet) {
    modalSheet.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
        currentY = startY;
        modalSheet.style.transition = 'none'; // Disable animations during drag
    }, { passive: true });

    modalSheet.addEventListener('touchmove', (e) => {
        currentY = e.touches[0].clientY;
        const diffY = currentY - startY;
        if (diffY > 0) {
            modalSheet.style.transform = `translateY(${diffY}px)`; // Track finger drag down
        }
    }, { passive: true });

    modalSheet.addEventListener('touchend', () => {
        modalSheet.style.transition = ''; // Restore default CSS transition
        const diffY = currentY - startY;
        if (diffY > 80) {
            hintModal.classList.remove('active'); // Close modal if swiped down far enough
        }
        modalSheet.style.transform = ''; // Reset inline transform for CSS transition
        startY = 0;
        currentY = 0;
    });
}

hintModal.addEventListener('click', (e) => {
    if (e.target === hintModal) {
        hintModal.classList.remove('active');
        if (modalSheet) {
            modalSheet.style.transform = '';
        }
    }
});

// Quiz Finish & Scoring
function finishQuiz() {
    const finalScore = Object.values(userAnswers).reduce((sum, val) => sum + val, 0);
    
    switchScreen(screenQuestion, screenResults);
    animateResultScore(finalScore);
    sendLog('result', finalScore); // Log completion with final score
    
    // Scale strokeDashoffset (Max score is 30)
    const strokeDashOffset = 251 - ((finalScore / 30) * 251);
    
    setTimeout(() => {
        gaugeFill.style.strokeDashoffset = strokeDashOffset;
    }, 450);
    
    let title = '';
    let description = '';
    
    if (finalScore <= 10) {
        title = '🔴 Северный невроз';
        description = 'Ты слишком напряжен.<br><br>Испанский темп жизни и отсутствие дедлайнов доведут тебя до стресса в первую неделю.<br><br>Тебе противопоказан переезд без психологической подготовки.<br><br>Твой первый шаг — научиться расслаблять мозг.<br><br>Начни с уроков испанского языка: он поможет перестроить фильтры контроля и снизить градус невротизма.';
    } else if (finalScore <= 22) {
        title = '🟡 Умеренный оптимист';
        description = 'Ты готов к переменам, но старые привычки «выживать и все контролировать» все еще держат тебя.<br><br>Тебе очень понравится Испания, но языковой барьер и культурные отличия будут замедлять адаптацию.<br><br>Тебе нужно срочно учить живой, разговорный испанский язык, чтобы понимать правила этой игры изнутри.';
    } else {
        title = '🟢 Нативный испанец';
        description = 'Твоя душа уже в Испании!<br><br>Ты ненавидишь бессмысленный стресс, ценишь искреннее общение и умеешь кайфовать от момента.<br><br>Единственное, что отделяет тебя от идеальной жизни на побережье — это отсутствие языка.<br><br>Без него ты будешь лишь немым туристом.<br><br>Пора переходить на новый уровень!';
    }
    
    resultTitle.textContent = title;
    resultDescription.innerHTML = description; // Supports <br> line breaks
    
    if (tg && tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred(finalScore >= 23 ? 'success' : 'warning');
    }
}

function animateResultScore(targetScore) {
    let current = 0;
    const interval = setInterval(() => {
        if (current >= targetScore) {
            resultScoreNum.textContent = targetScore;
            resultScoreLabel.textContent = getRussianPlural(targetScore, 'балл', 'балла', 'баллов');
            clearInterval(interval);
        } else {
            current++;
            resultScoreNum.textContent = current;
            resultScoreLabel.textContent = getRussianPlural(current, 'балл', 'балла', 'баллов');
        }
    }, 25);
}

// CTA Button to sofi_spain with prefilled text
ctaActionTrigger.addEventListener('click', () => {
    sendLog('cta_click'); // Log CTA registration click
    const textParam = encodeURIComponent("Здравствуйте! Я хочу записаться к вам на урок испанского языка");
    const targetUrl = `https://t.me/sofi_spain?text=${textParam}`;
    openTgLink(targetUrl);
});

// Telegram Channel Button
telegramChannelTrigger.addEventListener('click', () => {
    sendLog('telegram_channel_click'); // Log Telegram channel click event
    const targetUrl = 'https://t.me/lazy_spanish';
    openTgLink(targetUrl);
});

// Question Footer Logo Link
const logoLink = document.getElementById('logo-link');
if (logoLink) {
    logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        openTgLink('https://t.me/lazy_spanish');
    });
}

restartQuizTrigger.addEventListener('click', () => {
    gaugeFill.style.strokeDashoffset = '251';
    switchScreen(screenResults, screenWelcome);
});
