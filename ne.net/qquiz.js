/**
 * QuizMicro - A lightweight quiz framework
 * Create quizzes instantly with different question types, styling, and timing
 */

class QuizMicro {
    constructor(quizConfig) {
      // Default settings
      this.defaultConfig = {
        name: "Quick Quiz",
        font: "Arial",
        theme: "light",
        timePerQuestion: 30000, // 30 seconds default
        showResults: true,
        shuffleQuestions: false,
        shuffleOptions: false
      };
      
      // Merge provided config with defaults
      this.config = { ...this.defaultConfig, ...quizConfig };
      
      // Initialize quiz state
      this.currentQuestion = 0;
      this.score = 0;
      this.questions = [];
      this.timer = null;
      this.timeLeft = 0;
      this.quizStarted = false;
      this.quizEnded = false;
      
      // Process questions
      this._processQuestions();
      
      // Create DOM elements
      this.quizContainer = null;
      this.questionContainer = null;
      this.optionsContainer = null;
      this.resultContainer = null;
      this.timerDisplay = null;
    }
    
    _processQuestions() {
      if (!this.config.question_v_answers) {
        console.error("No questions provided!");
        return;
      }
      
      // Process each question based on type
      for (const [question, answer] of Object.entries(this.config.question_v_answers)) {
        if (question === "mcq") {
          // Process multiple choice questions
          if (typeof answer === 'object') {
            for (const [mcqQuestion, correctIndex] of Object.entries(answer)) {
              if (mcqQuestion !== "options") {
                this.questions.push({
                  type: "mcq",
                  question: mcqQuestion,
                  correctAnswer: correctIndex,
                  options: answer.options || ["No options provided"],
                  time: this.config.timePerQuestion
                });
              }
            }
          }
        } else {
          // Process direct Q/A questions
          this.questions.push({
            type: "text",
            question: question,
            correctAnswer: answer,
            time: this.config.timePerQuestion
          });
        }
      }
      
      // If specific time is provided for entire quiz
      if (this.config.time) {
        this.questions.forEach(q => q.time = this.config.time);
      }
      
      // Shuffle questions if needed
      if (this.config.shuffleQuestions) {
        this.questions = this._shuffleArray(this.questions);
      }
    }
    
    _shuffleArray(array) {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    }
    
    render(targetElement) {
      const target = document.querySelector(targetElement);
      if (!target) {
        console.error(`Target element "${targetElement}" not found!`);
        return;
      }
      
      // Create quiz container
      this.quizContainer = document.createElement('div');
      this.quizContainer.className = 'quiz-micro-container';
      this.quizContainer.style.fontFamily = this.config.font;
      
      // Apply theme
      this._applyTheme();
      
      // Create header
      const header = document.createElement('div');
      header.className = 'quiz-micro-header';
      
      const title = document.createElement('h2');
      title.textContent = this.config.name;
      header.appendChild(title);
      
      this.timerDisplay = document.createElement('div');
      this.timerDisplay.className = 'quiz-micro-timer';
      header.appendChild(this.timerDisplay);
      
      this.quizContainer.appendChild(header);
      
      // Create main content area
      const mainContent = document.createElement('div');
      mainContent.className = 'quiz-micro-content';
      
      // Question container
      this.questionContainer = document.createElement('div');
      this.questionContainer.className = 'quiz-micro-question';
      mainContent.appendChild(this.questionContainer);
      
      // Options container
      this.optionsContainer = document.createElement('div');
      this.optionsContainer.className = 'quiz-micro-options';
      mainContent.appendChild(this.optionsContainer);
      
      // Results container
      this.resultContainer = document.createElement('div');
      this.resultContainer.className = 'quiz-micro-results';
      this.resultContainer.style.display = 'none';
      mainContent.appendChild(this.resultContainer);
      
      this.quizContainer.appendChild(mainContent);
      
      // Add controls
      const controls = document.createElement('div');
      controls.className = 'quiz-micro-controls';
      
      const startButton = document.createElement('button');
      startButton.textContent = 'Start Quiz';
      startButton.className = 'quiz-micro-btn quiz-micro-start';
      startButton.addEventListener('click', () => this.startQuiz());
      controls.appendChild(startButton);
      
      this.quizContainer.appendChild(controls);
      
      // Add styles
      this._addStyles();
      
      // Add to target
      target.appendChild(this.quizContainer);
    }
    
    _applyTheme() {
      const themes = {
        light: {
          background: '#f5f5f5',
          text: '#333',
          primary: '#3498db',
          secondary: '#2ecc71',
          accent: '#e74c3c'
        },
        dark: {
          background: '#333',
          text: '#f5f5f5',
          primary: '#3498db',
          secondary: '#2ecc71',
          accent: '#e74c3c'
        },
        colorful: {
          background: '#f9f9f9',
          text: '#2c3e50',
          primary: '#9b59b6',
          secondary: '#f1c40f',
          accent: '#e74c3c'
        }
      };
      
      const theme = themes[this.config.theme] || themes.light;
      
      this.quizContainer.style.setProperty('--quiz-bg', theme.background);
      this.quizContainer.style.setProperty('--quiz-text', theme.text);
      this.quizContainer.style.setProperty('--quiz-primary', theme.primary);
      this.quizContainer.style.setProperty('--quiz-secondary', theme.secondary);
      this.quizContainer.style.setProperty('--quiz-accent', theme.accent);
    }
    
    _addStyles() {
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        .quiz-micro-container {
          --quiz-bg: #f5f5f5;
          --quiz-text: #333;
          --quiz-primary: #3498db;
          --quiz-secondary: #2ecc71;
          --quiz-accent: #e74c3c;
          
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          background-color: var(--quiz-bg);
          color: var(--quiz-text);
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .quiz-micro-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid var(--quiz-primary);
        }
        
        .quiz-micro-timer {
          font-size: 18px;
          font-weight: bold;
          color: var(--quiz-accent);
        }
        
        .quiz-micro-question {
          font-size: 22px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        
        .quiz-micro-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .quiz-micro-option {
          padding: 12px 15px;
          background-color: rgba(255,255,255,0.8);
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .quiz-micro-option:hover {
          background-color: var(--quiz-primary);
          color: white;
        }
        
        .quiz-micro-option.selected {
          background-color: var(--quiz-primary);
          color: white;
        }
        
        .quiz-micro-option.correct {
          background-color: var(--quiz-secondary);
          color: white;
        }
        
        .quiz-micro-option.wrong {
          background-color: var(--quiz-accent);
          color: white;
        }
        
        .quiz-micro-text-input {
          width: 100%;
          padding: 10px;
          font-size: 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 10px;
        }
        
        .quiz-micro-btn {
          padding: 10px 15px;
          background-color: var(--quiz-primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-right: 10px;
        }
        
        .quiz-micro-btn:hover {
          opacity: 0.9;
        }
        
        .quiz-micro-results {
          text-align: center;
          padding: 20px;
        }
        
        .quiz-micro-score {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .quiz-micro-feedback {
          font-size: 18px;
          margin-bottom: 20px;
        }
        
        .quiz-micro-summary {
          text-align: left;
          margin-top: 20px;
        }
        
        .quiz-micro-summary-item {
          margin-bottom: 10px;
          padding: 10px;
          border-radius: 4px;
        }
        
        .quiz-micro-summary-item.correct {
          background-color: rgba(46, 204, 113, 0.2);
        }
        
        .quiz-micro-summary-item.wrong {
          background-color: rgba(231, 76, 60, 0.2);
        }
      `;
      
      document.head.appendChild(styleElement);
    }
    
    startQuiz() {
      this.quizStarted = true;
      this.currentQuestion = 0;
      this.score = 0;
      this.showQuestion();
      
      // Update UI
      const startButton = this.quizContainer.querySelector('.quiz-micro-start');
      if (startButton) {
        startButton.style.display = 'none';
      }
    }
    
    showQuestion() {
      if (this.currentQuestion >= this.questions.length) {
        this.endQuiz();
        return;
      }
      
      const question = this.questions[this.currentQuestion];
      
      // Clear containers
      this.questionContainer.innerHTML = '';
      this.optionsContainer.innerHTML = '';
      
      // Display question
      this.questionContainer.textContent = question.question;
      
      // Create appropriate input based on question type
      if (question.type === 'mcq') {
        let options = [...question.options];
        
        // Shuffle options if needed
        if (this.config.shuffleOptions) {
          options = this._shuffleArray(options);
        }
        
        options.forEach((option, index) => {
          const optionElement = document.createElement('div');
          optionElement.className = 'quiz-micro-option';
          optionElement.textContent = option;
          optionElement.dataset.index = index;
          
          optionElement.addEventListener('click', (e) => {
            // Clear previous selections
            this.optionsContainer.querySelectorAll('.quiz-micro-option').forEach(el => {
              el.classList.remove('selected');
            });
            
            // Mark as selected
            e.target.classList.add('selected');
          });
          
          this.optionsContainer.appendChild(optionElement);
        });
        
        // Add submit button
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit Answer';
        submitButton.className = 'quiz-micro-btn quiz-micro-submit';
        submitButton.addEventListener('click', () => {
          const selectedOption = this.optionsContainer.querySelector('.quiz-micro-option.selected');
          if (selectedOption) {
            this.checkAnswer(parseInt(selectedOption.dataset.index));
          } else {
            alert('Please select an option!');
          }
        });
        
        this.optionsContainer.appendChild(submitButton);
        
      } else {
        // Text input for direct answer questions
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.className = 'quiz-micro-text-input';
        inputElement.placeholder = 'Type your answer here...';
        this.optionsContainer.appendChild(inputElement);
        
        // Add submit button
        const submitButton = document.createElement('button');
        submitButton.textContent = 'Submit Answer';
        submitButton.className = 'quiz-micro-btn quiz-micro-submit';
        submitButton.addEventListener('click', () => {
          const answer = inputElement.value.trim();
          if (answer) {
            this.checkAnswer(answer);
          } else {
            alert('Please enter an answer!');
          }
        });
        
        this.optionsContainer.appendChild(submitButton);
      }
      
      // Start timer
      this.startTimer(question.time);
    }
    
    startTimer(duration) {
      this.clearTimer();
      
      this.timeLeft = duration;
      this.updateTimerDisplay();
      
      this.timer = setInterval(() => {
        this.timeLeft -= 1000;
        
        if (this.timeLeft <= 0) {
          this.clearTimer();
          this.moveToNextQuestion('Time\'s up!');
        } else {
          this.updateTimerDisplay();
        }
      }, 1000);
    }
    
    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }
    
    updateTimerDisplay() {
      const seconds = Math.ceil(this.timeLeft / 1000);
      this.timerDisplay.textContent = `Time: ${seconds}s`;
      
      // Add warning color when time is running low
      if (seconds <= 5) {
        this.timerDisplay.style.color = 'var(--quiz-accent)';
      } else {
        this.timerDisplay.style.color = 'var(--quiz-text)';
      }
    }
    
    checkAnswer(userAnswer) {
      this.clearTimer();
      
      const question = this.questions[this.currentQuestion];
      let isCorrect = false;
      
      if (question.type === 'mcq') {
        isCorrect = userAnswer === question.correctAnswer;
        
        // Highlight correct and wrong answers
        const options = this.optionsContainer.querySelectorAll('.quiz-micro-option');
        options.forEach((option, index) => {
          if (index === question.correctAnswer) {
            option.classList.add('correct');
          } else if (index === userAnswer) {
            option.classList.add('wrong');
          }
        });
        
      } else {
        // For text questions, compare normalized strings
        const normalizedUserAnswer = userAnswer.toLowerCase().trim();
        const normalizedCorrectAnswer = String(question.correctAnswer).toLowerCase().trim();
        isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        
        // Show feedback
        const inputElement = this.optionsContainer.querySelector('.quiz-micro-text-input');
        if (inputElement) {
          inputElement.disabled = true;
          if (isCorrect) {
            inputElement.style.backgroundColor = 'rgba(46, 204, 113, 0.2)';
          } else {
            inputElement.style.backgroundColor = 'rgba(231, 76, 60, 0.2)';
            
            // Show correct answer
            const correctAnswerElement = document.createElement('div');
            correctAnswerElement.className = 'quiz-micro-correct-answer';
            correctAnswerElement.textContent = `Correct answer: ${question.correctAnswer}`;
            correctAnswerElement.style.marginTop = '10px';
            correctAnswerElement.style.fontWeight = 'bold';
            correctAnswerElement.style.color = 'var(--quiz-secondary)';
            this.optionsContainer.appendChild(correctAnswerElement);
          }
        }
      }
      
      // Update score
      if (isCorrect) {
        this.score++;
      }
      
      // Store user's answer for results summary
      question.userAnswer = userAnswer;
      question.isCorrect = isCorrect;
      
      // Disable submit button
      const submitButton = this.optionsContainer.querySelector('.quiz-micro-submit');
      if (submitButton) {
        submitButton.disabled = true;
      }
      
      // Add next button
      const nextButton = document.createElement('button');
      nextButton.textContent = 'Next Question';
      nextButton.className = 'quiz-micro-btn quiz-micro-next';
      nextButton.addEventListener('click', () => {
        this.moveToNextQuestion();
      });
      
      this.optionsContainer.appendChild(nextButton);
    }
    
    moveToNextQuestion(message = null) {
      // If time ran out and no answer was submitted
      if (message) {
        const question = this.questions[this.currentQuestion];
        question.userAnswer = null;
        question.isCorrect = false;
        
        // Display message
        this.optionsContainer.innerHTML = `<div style="color: var(--quiz-accent); font-weight: bold; margin-bottom: 15px;">${message}</div>`;
        
        // Show correct answer
        const correctAnswerElement = document.createElement('div');
        correctAnswerElement.className = 'quiz-micro-correct-answer';
        
        if (question.type === 'mcq') {
          correctAnswerElement.textContent = `Correct answer: ${question.options[question.correctAnswer]}`;
        } else {
          correctAnswerElement.textContent = `Correct answer: ${question.correctAnswer}`;
        }
        
        correctAnswerElement.style.marginBottom = '15px';
        correctAnswerElement.style.fontWeight = 'bold';
        correctAnswerElement.style.color = 'var(--quiz-secondary)';
        this.optionsContainer.appendChild(correctAnswerElement);
        
        // Add next button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next Question';
        nextButton.className = 'quiz-micro-btn quiz-micro-next';
        nextButton.addEventListener('click', () => {
          this.currentQuestion++;
          this.showQuestion();
        });
        
        this.optionsContainer.appendChild(nextButton);
        
      } else {
        // Normal progression
        this.currentQuestion++;
        this.showQuestion();
      }
    }
    
    endQuiz() {
      this.quizEnded = true;
      this.clearTimer();
      
      // Hide question and options
      this.questionContainer.style.display = 'none';
      this.optionsContainer.style.display = 'none';
      
      // Show results if enabled
      if (this.config.showResults) {
        this.resultContainer.style.display = 'block';
        
        // Calculate percentage
        const percentage = Math.round((this.score / this.questions.length) * 100);
        
        // Create score element
        const scoreElement = document.createElement('div');
        scoreElement.className = 'quiz-micro-score';
        scoreElement.textContent = `Your Score: ${this.score}/${this.questions.length} (${percentage}%)`;
        this.resultContainer.appendChild(scoreElement);
        
        // Create feedback element
        const feedbackElement = document.createElement('div');
        feedbackElement.className = 'quiz-micro-feedback';
        
        if (percentage >= 80) {
          feedbackElement.textContent = 'Excellent! Great job!';
        } else if (percentage >= 60) {
          feedbackElement.textContent = 'Good work! You did well!';
        } else if (percentage >= 40) {
          feedbackElement.textContent = 'Not bad, but you can do better!';
        } else {
          feedbackElement.textContent = 'Keep practicing to improve your score!';
        }
        
        this.resultContainer.appendChild(feedbackElement);
        
        // Create detailed summary
        const summaryElement = document.createElement('div');
        summaryElement.className = 'quiz-micro-summary';
        summaryElement.innerHTML = '<h3>Question Summary:</h3>';
        
        this.questions.forEach((question, index) => {
          const summaryItem = document.createElement('div');
          summaryItem.className = `quiz-micro-summary-item ${question.isCorrect ? 'correct' : 'wrong'}`;
          
          let summaryHTML = `<strong>Q${index + 1}:</strong> ${question.question}<br>`;
          
          if (question.type === 'mcq') {
            summaryHTML += `<strong>Correct answer:</strong> ${question.options[question.correctAnswer]}<br>`;
            
            if (question.userAnswer !== null) {
              summaryHTML += `<strong>Your answer:</strong> ${question.options[question.userAnswer]}<br>`;
            } else {
              summaryHTML += '<strong>Your answer:</strong> No answer provided<br>';
            }
          } else {
            summaryHTML += `<strong>Correct answer:</strong> ${question.correctAnswer}<br>`;
            
            if (question.userAnswer !== null) {
              summaryHTML += `<strong>Your answer:</strong> ${question.userAnswer}<br>`;
            } else {
              summaryHTML += '<strong>Your answer:</strong> No answer provided<br>';
            }
          }
          
          summaryItem.innerHTML = summaryHTML;
          summaryElement.appendChild(summaryItem);
        });
        
        this.resultContainer.appendChild(summaryElement);
        
        // Add restart button
        const restartButton = document.createElement('button');
        restartButton.textContent = 'Restart Quiz';
        restartButton.className = 'quiz-micro-btn quiz-micro-restart';
        restartButton.addEventListener('click', () => {
          this.resultContainer.innerHTML = '';
          this.resultContainer.style.display = 'none';
          this.questionContainer.style.display = 'block';
          this.optionsContainer.style.display = 'block';
          this.startQuiz();
        });
        
        this.resultContainer.appendChild(restartButton);
      }
    }
  }
  
  // Example usage:
  
  const myQuiz = new QuizMicro({
    name: "General Knowledge Quiz",
    font: "JetBrains mono",
    theme: "light",
    question_v_answers: {
      "Who is the author of 'To Kill a Mockingbird'?": "Harper Lee",
      "What is the capital of Japan?": "Tokyo",
      mcq: {
        "Which planet is known as the Red Planet?": 2,
        options: ["Venus", "Jupiter", "Mars", "Saturn"]
      }
    },
    timePerQuestion: 10000, // 10 seconds per question
    shuffleQuestions: true,
    shuffleOptions: false
  });
  
  // Render the quiz when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    myQuiz.render('#quiz-container');
  });