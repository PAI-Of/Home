/**
 * @library AnimateText.js - A micro framework for text animations
 * @type {Micro-framework}
 * @description A lightweight JavaScript library for animating text with various effects.
*/

class AnimTxt {
    constructor(options) {
      // Default options
      this.defaults = {
        text: '',
        type: 'typing',
        speed: 100,
        dom: null,
        delay: 0,
        infinite: false,
        callback: null
      };
  
      // Merge defaults with user options
      this.options = { ...this.defaults, ...options };
      
      // Get target element
      if (this.options.dom) {
        let selector = this.options.dom;
        let firstChar = selector.charAt(0);
        
        if (firstChar === '#') {
          this.element = document.getElementById(selector.substring(1));
        } else if (firstChar === '.') {
          this.element = document.querySelector(selector);
        } else {
          this.element = document.querySelector(selector);
        }
      } else {
        console.error('AnimTxt: No target element specified');
        return;
      }
      
      if (!this.element) {
        console.error(`AnimTxt: Target element ${this.options.dom} not found`);
        return;
      }
  
      // Initialize
      this.init();
    }
  
    init() {
      // Set initial styles
      this.element.style.visibility = 'visible';
      
      // Add specific styles based on animation type
      const styleId = 'animate-text-styles';
      if (!document.getElementById(styleId)) {
        const styleSheet = document.createElement('style');
        styleSheet.id = styleId;
        styleSheet.innerHTML = this.getStyles();
        document.head.appendChild(styleSheet);
      }
  
      // Apply animation after delay
      setTimeout(() => {
        this.animate();
      }, this.options.delay);
    }
  
    getStyles() {
      return `
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(20px); }
        }
        
        @keyframes fadeOutLeft {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(-20px); }
        }
        
        @keyframes fadeOutUp {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-20px); }
        }
        
        @keyframes fadeOutDown {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(20px); }
        }
        
        @keyframes glideRight {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
        
        @keyframes glideLeft {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0); }
        }
        
        @keyframes glitch {
          0% { transform: translate(0); }
          20% { transform: translate(-2px, 2px); }
          40% { transform: translate(-2px, -2px); }
          60% { transform: translate(2px, 2px); }
          80% { transform: translate(2px, -2px); }
          100% { transform: translate(0); }
        }
        
        .animate-text-char {
          display: inline-block;
        }
        
        .typing-cursor {
          display: inline-block;
          width: 2px;
          background-color: currentColor;
          margin-left: 2px;
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .reveal-text {
          position: relative;
        }
        
        .reveal-text::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: currentColor;
          transform-origin: left;
        }
        
        @keyframes revealText {
          0% { transform: scaleX(1); }
          100% { transform: scaleX(0); }
        }
      `;
    }
  
    animate() {
      const type = this.options.type.toLowerCase();
      const text = this.options.text;
      const speed = this.options.speed;
      
      // Clear the element content
      this.element.innerHTML = '';
      
      switch (type) {
        case 'typing':
          this.typingEffect(text, speed);
          break;
          
        case 'fadeinright':
          this.fadeEffect(text, speed, 'fadeInRight');
          break;
          
        case 'fadeinleft':
          this.fadeEffect(text, speed, 'fadeInLeft');
          break;
          
        case 'fadeinup':
          this.fadeEffect(text, speed, 'fadeInUp');
          break;
          
        case 'fadeindown':
          this.fadeEffect(text, speed, 'fadeInDown');
          break;
          
        case 'fadeoutright':
          this.fadeEffect(text, speed, 'fadeOutRight');
          break;
          
        case 'fadeoutleft':
          this.fadeEffect(text, speed, 'fadeOutLeft');
          break;
          
        case 'fadeoutup':
          this.fadeEffect(text, speed, 'fadeOutUp');
          break;
          
        case 'fadeoutdown':
          this.fadeEffect(text, speed, 'fadeOutDown');
          break;
          
        case 'glideright':
          this.glideEffect(text, 'glideRight');
          break;
          
        case 'glideleft':
          this.glideEffect(text, 'glideLeft');
          break;
          
        case 'glitch':
          this.glitchEffect(text);
          break;
          
        case 'reveal':
          this.revealEffect(text);
          break;
          
        default:
          this.element.textContent = text;
          console.warn(`AnimTxt: Animation type '${type}' not recognized. Text displayed without animation.`);
      }
    }
  
    typingEffect(text, speed) {
      let i = 0;
      this.element.innerHTML = '<span class="typing-cursor" style="height: 1em;">&nbsp;</span>';
      const cursor = this.element.querySelector('.typing-cursor');
      
      const type = () => {
        if (i < text.length) {
          if (cursor) {
            cursor.insertAdjacentHTML('beforebegin', text.charAt(i));
          } else {
            this.element.innerHTML += text.charAt(i);
          }
          i++;
          setTimeout(type, speed);
        } else if (typeof this.options.callback === 'function') {
          this.options.callback();
        }
      };
      
      type();
    }
  
    fadeEffect(text, speed, animationName) {
      // Split text into characters
      for (let i = 0; i < text.length; i++) {
        const char = document.createElement('span');
        char.className = 'animate-text-char';
        char.textContent = text[i];
        char.style.opacity = '0';
        char.style.animation = `${animationName} 0.5s forwards`;
        char.style.animationDelay = `${i * speed / 1000}s`;
        this.element.appendChild(char);
      }
      
      // Calculate total animation time and run callback if provided
      const totalTime = text.length * speed;
      if (typeof this.options.callback === 'function') {
        setTimeout(this.options.callback, totalTime);
      }
    }
  
    glideEffect(text, animationName) {
      this.element.style.overflow = 'hidden';
      this.element.textContent = text;
      this.element.style.animation = `${animationName} 0.8s forwards`;
      
      if (typeof this.options.callback === 'function') {
        setTimeout(this.options.callback, 800);
      }
    }
  
    glitchEffect(text) {
      this.element.textContent = text;
      this.element.style.animation = 'glitch 0.3s infinite';
      
      // Stop glitching after 2 seconds
      setTimeout(() => {
        this.element.style.animation = '';
        if (typeof this.options.callback === 'function') {
          this.options.callback();
        }
      }, 2000);
    }
  
    revealEffect(text) {
      this.element.innerHTML = `<span class="reveal-text">${text}</span>`;
      const revealWrap = this.element.querySelector('.reveal-text');
      
      revealWrap.style.visibility = 'hidden';
      
      setTimeout(() => {
        revealWrap.style.visibility = 'visible';
        const overlay = revealWrap.querySelector('::after');
        if (overlay) {
          overlay.style.animation = 'revealText 1s forwards';
        } else {
          // If ::after doesn't work directly, add a span
          const overlaySpan = document.createElement('span');
          overlaySpan.className = 'reveal-overlay';
          overlaySpan.style.position = 'absolute';
          overlaySpan.style.top = '0';
          overlaySpan.style.left = '0';
          overlaySpan.style.width = '100%';
          overlaySpan.style.height = '100%';
          overlaySpan.style.backgroundColor = 'currentColor';
          overlaySpan.style.transformOrigin = 'left';
          overlaySpan.style.animation = 'revealText 1s forwards';
          
          revealWrap.style.position = 'relative';
          revealWrap.appendChild(overlaySpan);
        }
        
        if (typeof this.options.callback === 'function') {
          setTimeout(this.options.callback, 1000);
        }
      }, 100);
    }
  
    // Public methods for controlling animations
    stop() {
      this.element.innerHTML = this.options.text;
    }
    
    restart() {
      this.init();
    }
  }
  
  // Make available globally
  window.AnimTxt = AnimTxt;