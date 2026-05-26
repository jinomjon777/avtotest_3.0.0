import { useState, useEffect, useRef } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js';

// Public path where this page's test JSON files are served from (page-local)
const TESTS_PUBLIC = '/mavzuli';

// Default rasm URL-i
const DEFAULT_QUESTION_IMAGE = 'https://via.placeholder.com/400x300?text=Test+Savoli';
function shuffleArray(array = []) {
  // Aralashtirmaymiz — faqat nusxasini qaytaramiz
  return Array.isArray(array) ? [...array] : [];
}


function App() {
  const [isStarted, setIsStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [incorrectAnswers, setIncorrectAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60 * 60);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [testType, setTestType] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startTime, setStartTime] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [showTopicSelection, setShowTopicSelection] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [lang, setLang] = useState('oz'); // 'oz' (Latin) default; other: 'uz' (kril), 'ru' (rus)
  const SUPPORTED_LANGS = [
    { code: 'oz', label: 'Lotin (Oʻz)' },
    { code: 'uz', label: 'Kril (Ўз)' },
    { code: 'ru', label: 'Ruscha' }
  ];

  // Supabase sozlamalari
  const supabaseUrl = 'https://oietcsgsbklgqjatefxt.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pZXRjc2dzYmtsZ3FqYXRlZnh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3MTg5NTAsImV4cCI6MjA2NDI5NDk1MH0.I_1HUJSBjclNsNNI69yr133UD-VZZCdAoMpLCBQb_ns';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Load saved state from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('testState');
    if (savedState) {
      const state = JSON.parse(savedState);
      setIsStarted(state.isStarted);
      setQuestions(state.questions);
      setCurrentQuestionIndex(state.currentQuestionIndex);
      setSelectedAnswers(state.selectedAnswers);
      setTimeLeft(state.timeLeft);
      setTestType(state.testType);
      setShowResults(state.showResults);
      setIncorrectAnswers(state.incorrectAnswers || {});
      setSelectedTopic(state.selectedTopic || '');
      setLang(state.lang || 'oz');
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isStarted) {
      const state = {
        isStarted,
        questions,
        currentQuestionIndex,
        selectedAnswers,
        timeLeft,
        testType,
        showResults,
        incorrectAnswers,
        selectedTopic
      };
      localStorage.setItem('testState', JSON.stringify(state));
    }
  }, [isStarted, questions, currentQuestionIndex, selectedAnswers, timeLeft, testType, showResults, incorrectAnswers, selectedTopic]);
  // Persist language selection separately
  useEffect(() => {
    localStorage.setItem('testLang', lang);
  }, [lang]);

  // Load persisted language on startup
  useEffect(() => {
    const persistedLang = localStorage.getItem('testLang');
    if (persistedLang) setLang(persistedLang);
  }, []);

  // Load available topics
  useEffect(() => {
    async function loadTopics() {
      try {
        const topics = [ 
          { id: '32', name: 'Yangi Savollar', },
          { id: '31', name: 'Barcha savollar2', filename: '31.json' },
          { id: '1', name: 'Umumiy qoydalar', filename: '1.json' },
          { id: '2', name: 'Haydovchi va piyodalarning umumiy vazifalari', filename: '2.json' },
          { id: '1', name: 'Umumiy qoydalar', filename: '1.json' },
          { id: '3', name: 'Ogohlantiruvchi belgilar', filename: '3.json' },
          { id: '4', name: 'Imtiyoz belgilar', filename: '4.json' },
          { id: '5', name: 'Taqiqlovchi belgilar', filename: '5.json' },
          { id: '6', name: 'Buyuruvchi belgilar', filename: '6.json' },
          { id: '7', name: 'Axborot ishora belgilari', filename: '7.json' },
          { id: '8', name: 'Qo\'shimcha axborot belgilari', filename: '8.json' },
          { id: '9', name: 'Yotiq chiziqlar 1', filename: '9.json' },
          { id: '6', name: 'Yotiq va tik chiziqlar 2', filename: '10.json' },
          { id: '11', name: 'Svetafor ishoralari', filename: '11.json' },
          { id: '12', name: 'Tartibga soluvchining ishoralari', filename: '12.json' },
          { id: '13', name: 'Ogohlantiruvchi va avariya ishoralari', filename: '13.json' },
          { id: '14', name: 'Harakatlanishni (Manyovir) boshlash', filename: '14.json' }, 
          { id: '11', name: 'Yo\'lning qatnov qismida transport vositalarining joylashuvi', filename: '15.json' },
          { id: '16', name: 'Harakatlanish tezligi', filename: '16.json' },
          { id: '17', name: 'Quvib o\'tish', filename: '17.json' },
          { id: '18', name: 'To\'xtash va to\'xtab turish qoydalari 1', filename: '18.json' },
          { id: '19', name: 'To\'xtash va to\'xtab turish qoydalari 2', filename: '19.json' },
          { id: '20', name: 'Chorraxalarda xarakatlanish', filename: '20.json' },
          { id: '21', name: 'Piyodalar o\'tish joylari va turar joy dahalarida harakatlanish', filename: '21.json' },
          { id: '22', name: 'Temir yo\'l kesishmalari va Avtomagistrallarda harakat', filename: '22.json' },
          { id: '23', name: 'Yo\'nalishli transport vositalarining imtiyozlari va tashqi yoritish ', filename: '23.json' },
          { id: '24', name: 'Transport vositalarini shatakka olish', filename: '24.json' },
          { id: '25', name: 'Transport boshqarishni o\'rganish va Yo\'l harakati xavfsizligini taminlash', filename: '25.json' },
          { id: '26', name: 'Odam va yuk tashish', filename: '26.json' },
          { id: '27', name: 'Transport vositalarida harakatlanish taqiqlanadigan vaziyatlar', filename: '27.json' },
          { id: '28', name: 'Harakat xavfsizligini taminlash 1', filename: '28.json' },
          { id: '29', name: 'Harakat xavfsizligini taminlash 2', filename: '29.json' },
          { id: '30', name: 'Birinchi tibbiy yordam', filename: '30.json' },
          { id: '10', name: 'Yotiq va tik chiziqlar 2', filename: '10.json' },
          { id: '20', name: 'Chorraxa', filename: '20.json' },
          { id: '11', name: 'Svetafor ishoralari', filename: '11.json' },
          { id: '13', name: 'Ogohlantiruvchi va avariya ishoralari', filename: '13.json' },
          { id: '14', name: 'Avtomabilda harakatlanishdagi holatlar', filename: '14.json' },
          { id: '16', name: 'Harakatlanish tezligi', filename: '16.json' },
          { id: '17', name: 'Quvib o\'tish', filename: '17.json' },
          { id: '18', name: 'To\'xtash va to\'xtab turish  1', filename: '18.json' },
          { id: '19', name: 'To\'xtash va to\'xtab turish  2', filename: '19.json' },
          { id: '34', name: 'Teng axamiyatli chorrahalar', filename: '34tengaxamiyatli.json' },
          { id: '33', name: 'Tartibga solinmagan chorrahalar', filename: '33.json' },
          { id: '12', name: 'Tartibga soluvchi', filename: '12.json' },
          { id: '22', name: 'Temir yo\'l kesishmalari va Avtomagistrallarda harakat', filename: '22.json' },
          { id: '23', name: 'Yo\'nalishli transport vositalari va tashqi yoritish', filename: '23.json' },
          { id: '24', name: 'Shatakka olish', filename: '24.json' },
          { id: '25', name: 'Yo\'l harakati xavfsizligini taminlash', filename: '25.json' },
          { id: '26', name: 'Odam va yuk tashish', filename: '26.json' },
          { id: '27', name: 'Transport vositalarining qo\'shimcha majburiyatlari', filename: '27.json' },
          { id: '28', name: 'Harakat xavfsizligi 1', filename: '28.json' },
          { id: '29', name: 'Harakat xavfsizligi  2', filename: '29.json' },
          { id: '15', name: 'Yo\'lning qatnov qismi', filename: '15.json' },
          { id: '2', name: 'Haydovchi va piyodalarning umumiy vazifalari', filename: '2.json' },
          { id: '30', name: 'Birinchi tibbiy yordam', filename: '30.json' },
          { id: '31', name: 'Barcha savollar', filename: '31.json' },
          { id: '32', name: 'Yangi Savollar' }, // faqat supabaseab44d34 (first commit)
        ];
        setAvailableTopics(topics);
        setLoading(false);
      } catch (error) {
        console.error('Mavzularni yuklashda xatolik:', error);
        setLoading(false);
      }
    }

    loadTopics();
  }, []);

  // Supabase'dan savollar va variantlarni yuklash
  const loadQuestionsFromSupabase = async () => {
    // sections, questions, choices jadval tuzilmasiga mos
    // Boshqa savollar uchun barcha questions va choices-ni yuklaymiz
    const { data: questions, error: qError } = await supabase
      .from('questions1')
      .select('*');
    if (qError) throw qError;

    // Har bir question uchun choices-ni yuklaymiz
    const { data: choices, error: cError } = await supabase
      .from('choices1')
      .select('*');
    if (cError) throw cError;

    // Savollarni variantlari bilan birlashtiramiz
    const transformedQuestions = questions.map((q) => {
      const qChoices = choices.filter((c) => c.question_id === q.id);
      return {
        id: q.id,
        question_texts: {
          oz: q.question_text || '',
          uz: q.question_text || '',
          ru: q.question_text || '',
        },
        image_url: q.image_url,
        choices: qChoices.map((c) => ({
          id: c.id,
          choice_texts: {
            oz: c.choice_text || '',
            uz: c.choice_text || '',
            ru: c.choice_text || '',
          },
          is_correct: c.is_correct,
        })),
      };
    });
    return transformedQuestions;
  };

  // Load questions from JSON file (supports multiple JSON shapes)
  const loadQuestionsFromFile = async (filename) => {
    try {
      let data;
      const localKey = `/src/pages/mavzuli/public/testlar/${filename}`;
      // Use import-time bundled JSON if available
      const LOCAL_TEST_FILES = (typeof import.meta !== 'undefined' && import.meta.globEager)
        ? import.meta.globEager('/src/pages/mavzuli/public/testlar/*.json')
        : {};
      if (LOCAL_TEST_FILES && LOCAL_TEST_FILES[localKey]) {
        const mod = LOCAL_TEST_FILES[localKey];
        data = (mod && mod.default) ? mod.default : mod;
      } else {
        // Primary: root public/testlar where user placed files
        let response = await fetch(`/testlar/${filename}`);
        // Fallback: page-local public folder (/mavzuli/testlar)
        if (!response.ok) {
          response = await fetch(`${TESTS_PUBLIC}/testlar/${filename}`);
        }
        // Dev fallback: source folder path
        if (!response.ok) {
          response = await fetch(`/src/pages/mavzuli/public/testlar/${filename}`);
        }
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        data = await response.json();
      }

      // Try to find where the questions array lives in the JSON
      let raw = [];
      if (Array.isArray(data)) raw = data;
      else if (Array.isArray(data.data)) raw = data.data;
      else if (Array.isArray(data.questions)) raw = data.questions;
      else {
        const arrValue = Object.values(data).find(v => Array.isArray(v));
        if (arrValue) raw = arrValue;
      }

      const transformedQuestions = raw.map((item, index) => {
        const id = item.id || item.ID || `q_${index}`;
        const getQuestionTexts = () => {
          if (!item) return { oz: '', uz: '', ru: '' };
          if (typeof item.question === 'string') return { oz: item.question, uz: item.question, ru: item.question };
          if (item.question && (item.question.oz || item.question.uz || item.question.ru)) return {
            oz: item.question.oz || item.question.uz || item.question.ru || '',
            uz: item.question.uz || item.question.oz || item.question.ru || '',
            ru: item.question.ru || item.question.oz || item.question.uz || ''
          };
          if (item.question_text) return { oz: item.question_text, uz: item.question_text, ru: item.question_text };
          if (item.text) return { oz: item.text, uz: item.text, ru: item.text };
          return { oz: '', uz: '', ru: '' };
        };

        const question_texts = getQuestionTexts();
        const question_text = question_texts.oz || question_texts.uz || question_texts.ru || '';

        const imgField = item.photo || item.image || item.img || item.photo_url || item.image_url;
        let image_url = null;
        if (imgField) image_url = (typeof imgField === 'string' && imgField.startsWith('http')) ? imgField : `/${String(imgField).replace(/^\//, '')}`;
        else if (item.media && item.media.name) {
          const name = String(item.media.name);
          image_url = /\.(png|jpg|jpeg|webp|gif)$/i.test(name) ? `/${name}` : `/${name}.png`;
        }

        let choices = [];
        if (item.answers && item.answers.answer) {
          const answersObj = item.answers;
          const answersOz = (answersObj.answer.oz && Array.isArray(answersObj.answer.oz)) ? answersObj.answer.oz : [];
          const correctIndex = (answersObj.status ? Number(answersObj.status) - 1 : -1);
          choices = answersOz.map((choiceText, ci) => ({
            id: `${id}_${ci}`,
            choice_texts: { oz: choiceText || '', uz: (answersObj.answer.uz && answersObj.answer.uz[ci]) || choiceText || '', ru: (answersObj.answer.ru && answersObj.answer.ru[ci]) || choiceText || '' },
            choice_text: choiceText || '',
            is_correct: ci === correctIndex
          }));
        } else if (Array.isArray(item.answers)) {
          choices = item.answers.map((a, ci) => {
            const text = (typeof a === 'string') ? a : (a.text || a.label || a.choice || '');
            const correct = !!(a.correct || a.is_correct || a.answer);
            return { id: `${id}_${ci}`, choice_texts: { oz: text, uz: text, ru: text }, choice_text: text, is_correct: correct };
          });
        } else {
          const rawChoices = item.options || item.variants || item.choices || item.choises || [];
          choices = (rawChoices || []).map((c, ci) => {
            if (typeof c === 'string') return { id: `${id}_${ci}`, choice_texts: { oz: c, uz: c, ru: c }, choice_text: c, is_correct: false };
            const text = c.text || c.label || c.choice || '';
            const correct = !!(c.correct || c.is_correct || c.answer);
            return { id: `${id}_${ci}`, choice_texts: { oz: text, uz: text, ru: text }, choice_text: text, is_correct: correct };
          });
        }

        return { id, question_texts, question_text, image_url, choices };
      });

      return transformedQuestions;
    } catch (error) {
      console.error('Savollarni yuklashda xatolik:', error);
      throw error;
    }
  };

  const startTest = (type) => {
    setTestType(type);
    setShowTopicSelection(true);
  };

  const selectTopic = async (topic) => {
    setSelectedTopic(topic.name);
    setLoading(true);
    try {
      let questionsData;
      if (topic.id === '32') { // Boshqa savollar
        questionsData = await loadQuestionsFromSupabase();
      } else {
        questionsData = await loadQuestionsFromFile(topic.filename);
      }
      const shuffled = shuffleArray(questionsData);
      setQuestions(shuffled);
      setIsStarted(true);
      setStartTime(Date.now());
      setTimeSpent(0);
      setSelectedAnswers({});
      setIncorrectAnswers({});
      setTimeLeft(60 * 60);
      setCurrentQuestionIndex(0);
      setShowResults(false);
      setShowTopicSelection(false);
      localStorage.removeItem('testState');
      setLoading(false);
    } catch (error) {
      console.error('Testni boshlashda xatolik:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (isStarted && timeLeft > 0 && !showResults) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            finishTest(true); // Pass true to indicate automatic completion
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStarted, timeLeft]);

  useEffect(() => {
    setTimeout(() => {
      const currentButton = document.querySelector(`.question-number:nth-child(${currentQuestionIndex + 1})`);
      if (currentButton) {
        const container = document.querySelector('.question-navigation');
        if (container) {
          const containerWidth = container.offsetWidth;
          const buttonWidth = currentButton.offsetWidth;
          const scrollLeft = currentButton.offsetLeft - (containerWidth / 2) + (buttonWidth / 2);
          container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
        }
      }
    }, 100);
  }, [currentQuestionIndex]);

  const findNextUnansweredQuestion = (currentIndex) => {
    let nextIndex = currentIndex + 1;
    while (nextIndex < questions.length) {
      if (!selectedAnswers[questions[nextIndex].id]) {
        return nextIndex;
      }
      nextIndex++;
    }
    // Agar keyingi savollardan topilmasa, oldingi savollardan qidirish
    nextIndex = 0;
    while (nextIndex < currentIndex) {
      if (!selectedAnswers[questions[nextIndex].id]) {
        return nextIndex;
      }
      nextIndex++;
    }
    return -1; // Barcha savollar belgilangan
  };

  const handleAnswerSelect = (questionId, choiceId) => {
    const currentQuestion = questions[currentQuestionIndex];
    const selectedChoice = currentQuestion.choices.find(choice => choice.id === choiceId);
    const isCorrect = selectedChoice.is_correct;

    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: choiceId
    }));

    if (!isCorrect) {
      setIncorrectAnswers((prev) => ({
        ...prev,
        [questionId]: true
      }));
      const totalIncorrect = Object.keys(incorrectAnswers).length + 1;
      setErrorMessage(`Xato javob! (${totalIncorrect} ta xato)`);
      setTimeout(() => setErrorMessage(''), 2000);
    }

    // Always mark correct answer so it can be highlighted
    setTimeout(() => {
      // No additional state required here because we derive correct from question.choices
      const nextQuestionIndex = findNextUnansweredQuestion(currentQuestionIndex);
      if (nextQuestionIndex === -1) {
        setShowResults(true);
      } else {
        setCurrentQuestionIndex(nextQuestionIndex);
      }
    }, 2000);
  };

  const finishTest = (isAutomatic = false) => {
    if (isAutomatic) {
      // For automatic completion, just show results without confirmation
      setShowResults(true);
      localStorage.removeItem('testState');
    } else {
      // For manual completion, show modal confirmation
      setShowFinishConfirm(true);
    }
  };

  const confirmFinishTest = () => {
    setShowResults(true);
    localStorage.removeItem('testState');
    setShowFinishConfirm(false);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimeSpent = (totalSeconds) => {
    if (!totalSeconds) return { minutes: 0, seconds: 0 };
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return { minutes, seconds };
  };

  const calculateResults = () => {
    let correctAnswers = 0;
    const results = [];

    questions.forEach((question, index) => {
      const selectedAnswer = selectedAnswers[question.id];
      const correctChoice = question.choices.find(choice => choice.is_correct);
      
      const isCorrect = selectedAnswer === correctChoice?.id;
      if (isCorrect) correctAnswers++;

      results.push({
        questionNumber: index + 1,
        question: question.question_text,
        isCorrect,
        selectedAnswer: question.choices.find(choice => choice.id === selectedAnswer)?.choice_text,
        correctAnswer: correctChoice?.choice_text
      });
    });

    return { correctAnswers, results };
  };

  const renderQuestion = (question) => {
    if (!question) return null;

    return (
      <div className="question" key={question.id}>
        <h3>Savol {currentQuestionIndex + 1} / {questions.length}</h3>
        {/* Render question text for selected language */}
        <p>{question.question_texts?.[lang] || question.question_texts?.oz || ''}</p>
        {question.image_url && (
          <div className="question-image" key={question.id}>
            <img 
              src={question.image_url} 
              alt="Savol rasmi"
              onError={(e) => {
                e.target.src = DEFAULT_QUESTION_IMAGE;
              }}
              loading="eager"
            />
          </div>
        )}
        <div className="choices">
          {question.choices?.map((choice) => {
            const isSelected = selectedAnswers[question.id] === choice.id;
            let className = 'choice';
            const correctChoice = question.choices.find(c => c.is_correct);
            const isCorrectChoice = choice.is_correct;
            // If user selected and this choice is correct, mark as correct; if user selected wrong, also highlight correct one
            if (selectedAnswers[question.id]) {
              if (isCorrectChoice) className += ' correct';
              if (isSelected && !isCorrectChoice) className += ' incorrect';
            }
            
            return (
              <button
                key={choice.id}
                className={className}
                onClick={() => !selectedAnswers[question.id] && handleAnswerSelect(question.id, choice.id)}
                disabled={selectedAnswers[question.id]}
              >
                {choice.choice_texts?.[lang] || choice.choice_texts?.oz || ''}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWelcomeScreen = () => (
    <div className="welcome-screen">
      <h1>Avtomaktab Test</h1>
      <div className="test-info">
        <h2>Test ma'lumotlari:</h2>
        <ul>
          <li>Mavzlashtirilgan testlar</li>
          <li>60 daqiqa vaqt</li>
          <li>O'tish bali: 90% to'g'ri javob</li>
        </ul>
      </div>
      <div className="test-type-buttons">
        {/* Language selector */}
        <div className="language-selector">
          {SUPPORTED_LANGS.map(l => (
            <button
              key={l.code}
              className={`lang-button ${lang === l.code ? 'active' : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button 
          className="test-type-button" 
          onClick={() => startTest('practice')}
        >
          Testni boshlash
        </button>
      {/* Bosh saxifa link removed: topic selection opens on entry */}

      </div>
    </div>
  );

  const renderTopicSelection = () => (
    <div className="topic-selection">
      <h2>Test mavzusini tanlang</h2>
      <div className="topic-list">
        {availableTopics.map((topic) => (
          <button
            key={topic.id}
            className="topic-button"
            onClick={() => selectTopic(topic)}
          >
            {topic.name}
          </button>
        ))}
      </div>
      <button
        className="back-button"
        onClick={() => { window.location.href = '/'; }}
      >
        Bosh saxifaga qaytish
      </button>
    </div>
  );

  // Combined landing area: language selector + home button at top, topics below
  const renderLanding = () => (
    <div className="landing-screen">
      <div className="landing-top" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
        <div className="language-selector">
          {SUPPORTED_LANGS.map(l => (
            <button
              key={l.code}
              className={`lang-button ${lang === l.code ? 'active' : ''}`}
              onClick={() => setLang(l.code)}
            >
              {l.label}
            </button>
          ))}
        </div>
        <a href="/" className="home-button">Bosh sahifa</a>
      </div>
      <div className="landing-body">
        <h2>Test mavzusini tanlang</h2>
        <div className="topic-list">
          {availableTopics.map((topic) => (
            <button
              key={topic.id}
              className="topic-button"
              onClick={() => selectTopic(topic)}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTestScreen = () => (
    <>
      <div className="header-controls">
        <div className="timer">Vaqt: {formatTime(timeLeft)}</div>
        <div className="header-buttons">
          <button className="finish-button-header" onClick={() => finishTest()}>
            Testni yakunlash
          </button>
          <button className="exit-button" onClick={() => setShowExitConfirm(true)}>
            Testdan chiqish
          </button>
        </div>
      </div>
      <div className="question-navigation">
        {questions.map((_, index) => (
          <button
            key={index}
            className={`question-number ${
              selectedAnswers[questions[index]?.id] ? 'answered' : ''
            } ${incorrectAnswers[questions[index]?.id] ? 'incorrect' : ''} ${
              index === currentQuestionIndex ? 'current' : ''
            }`}
            onClick={() => setCurrentQuestionIndex(index)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      <div className="question-container">
        {renderQuestion(questions[currentQuestionIndex])}
        {errorMessage && <div className="error-message">{errorMessage}</div>}
      </div>
    </>
  );

  const renderResults = () => {
    const { correctAnswers, results } = calculateResults();
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    // Calculate passing score: 90% of total questions
    const passingScore = Math.ceil(questions.length * 0.9);
    const isPassed = correctAnswers >= passingScore;

    return (
      <div className="results-screen">
        <div className="results-content">
          <div className="results-header">
            <h2>Test Natijalari</h2>
          </div>
          
          <div className="results-progress">
            <div 
              className="progress-circle"
              style={{ "--progress": `${percentage}%` }}
            >
              <div className="progress-inner">
                <div className="progress-value">{percentage}%</div>
                <div className="progress-label">{isPassed ? "O'tdi" : "O'tmadi"}</div>
              </div>
            </div>
          </div>

          <div className="results-stats">
            <div className="stat-card">
              <div className="stat-value">{correctAnswers}</div>
              <div className="stat-label">To'g'ri javoblar</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{questions.length - correctAnswers}</div>
              <div className="stat-label">Noto'g'ri javoblar</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{questions.length}</div>
              <div className="stat-label">Umumiy savollar</div>
            </div>
          </div>
          
          

          <div className="results-buttons">
            <button 
              className="result-button secondary"
              onClick={() => {
                setShowResults(false);
                setCurrentQuestionIndex(0);
              }}
            >
              Testga qaytish
            </button>
            <button 
              className="result-button primary"
              onClick={() => {
                setIsStarted(false);
                setShowResults(false);
                setSelectedAnswers({});
                setIncorrectAnswers({});
                setTimeLeft(60 * 60);
                setCurrentQuestionIndex(0);
                setStartTime(null);
                setTimeSpent(0);
                setQuestions([]);
                localStorage.removeItem('testState');
              }}
            >
              Yangi test boshlash
            </button>
          <a href="/" className="result-button home">Bosh sahifaga qaytish</a>
          </div>
        </div>
      </div>
    );
  };

  const renderExitConfirm = () => (
    <div className="modal-overlay" onClick={() => setShowExitConfirm(false)}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-icon">
          <svg viewBox="0 0 24 24" width="32" height="32">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <h3>Testni yakunlamoqchimisiz?</h3>
        <p>Barcha javoblaringiz o'chiriladi va test qaytadan boshlanadi.</p>
        <div className="modal-buttons">
          <button
            className="modal-button confirm"
            onClick={() => {
              setIsStarted(false);
              setShowExitConfirm(false);
              setSelectedAnswers({});
              setIncorrectAnswers({});
              setTimeLeft(60 * 60);
              setCurrentQuestionIndex(0);
              setQuestions([]);
              localStorage.removeItem('testState');
            }}
          >
            Ha, yakunlash
          </button>
          <button 
            className="modal-button cancel"
            onClick={() => setShowExitConfirm(false)}
          >
            Yo'q, davom etish
          </button>
        </div>
      </div>
    </div>
  );

  const renderFinishConfirm = () => {
    const unansweredQuestions = questions.filter(q => !selectedAnswers[q.id]).length;
    const answeredQuestions = questions.length - unansweredQuestions;
    
    return (
      <div className="modal-overlay" onClick={() => setShowFinishConfirm(false)}>
        <div className="modal-content finish-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-icon finish-icon">
            <svg viewBox="0 0 24 24" width="48" height="48">
              <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h3>Testni yakunlash</h3>
          <div className="finish-stats">
            <div className="stat-item">
            <span className="stat-label">Javob berilgan</span>
              <span className="stat-number">{answeredQuestions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Javobsiz</span>
              <span className="stat-number">{unansweredQuestions}</span>  
            </div>
            <div className="stat-item">
              <span className="stat-label">Jami savollar</span>
              <span className="stat-number">{questions.length}</span>
            </div>
          </div>
          {unansweredQuestions > 0 && (
            <p className="warning-text">
              {unansweredQuestions} ta savol javobsiz qolgan. Testni yakunlashni xohlaysizmi?
            </p>
          )}
          {unansweredQuestions === 0 && (
            <p className="success-text">
              Barcha savollarga javob berdingiz. Testni yakunlashni xohlaysizmi?
            </p>
          )}
          <div className="modal-buttons">
            <button 
              className="modal-button cancel"
              onClick={() => setShowFinishConfirm(false)}
            >
              Bekor qilish
            </button>
            <button
              className="modal-button finish"
              onClick={confirmFinishTest}
            >
              Ha, yakunlash
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Combined landing (language + home + topics) before test starts */}
      {!isStarted ? (
        renderLanding()
      ) : showResults ? (
        renderResults()
      ) : (
        renderTestScreen()
      )}

      {showExitConfirm && renderExitConfirm()}
      {showFinishConfirm && renderFinishConfirm()}
    </div>
  );
}

export default App;
