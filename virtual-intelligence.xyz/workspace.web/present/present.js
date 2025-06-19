// Global Variables
let slides = [{
    id: 1,
    content: '<div id="SLDTitle" class="editable" contenteditable="true">Click to add title</div><div class="editable" id="SLD-Body" contenteditable="true">Click to add content</div>'
}];
let currentSlideIndex = 0;
let undoStack = [];
let redoStack = [];

// DOM Elements
const slideNavigator = document.getElementById('slideNavigator');
const currentSlide = document.getElementById('currentSlide');
const slideContent = document.getElementById('slideContent');
const slideInfo = document.getElementById('slideInfo');
const presentationMode = document.getElementById('presentationMode');
const presentationSlide = document.getElementById('presentationSlide');
const toast = document.getElementById('toast');

// Initialize app
function init() {
    renderSlides();
    setupEventListeners();
    setupDragAndDrop();
    checkForSavedData();
}

// Check for saved presentations in local storage
function checkForSavedData() {
    const savedPresentations = localStorage.getItem('savedPresentations');
    if (savedPresentations) {
        const presentations = JSON.parse(savedPresentations);
        if (presentations.length > 0) {
            showRecentPresentations(presentations);
        }
    }
}

// Show recent presentations dialog
function showRecentPresentations(presentations) {
    const recentDialog = document.getElementById('recentDialog');
    const recentList = document.getElementById('recentList');
    
    recentList.innerHTML = '';
    presentations.forEach(presentation => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        item.innerHTML = `
            <span>${presentation.name}</span>
            <div>
                <button class="small-button" onclick="loadPresentation('${presentation.id}')">Open</button>
                <button class="small-button danger" onclick="deletePresentation('${presentation.id}')">Delete</button>
            </div>
        `;
        recentList.appendChild(item);
    });
    
    recentDialog.style.display = 'flex';
}

// Load a saved presentation from local storage
function loadPresentation(id) {
    const savedPresentations = JSON.parse(localStorage.getItem('savedPresentations') || '[]');
    const presentation = savedPresentations.find(p => p.id === id);
    
    if (presentation) {
        slides = JSON.parse(presentation.slides);
        currentSlideIndex = 0;
        renderSlides();
        document.getElementById('recentDialog').style.display = 'none';
        showToast('Presentation loaded successfully');
    }
}

// Delete a saved presentation
function deletePresentation(id) {
    let savedPresentations = JSON.parse(localStorage.getItem('savedPresentations') || '[]');
    savedPresentations = savedPresentations.filter(p => p.id !== id);
    localStorage.setItem('savedPresentations', JSON.stringify(savedPresentations));
    
    // Update the list
    showRecentPresentations(savedPresentations);
    showToast('Presentation deleted');
}

// Close the recent presentations dialog
function closeRecentDialog() {
    document.getElementById('recentDialog').style.display = 'none';
}

// Render slide thumbnails
function renderSlides() {
    // Save the current slide content first
    if (slides[currentSlideIndex]) {
        slides[currentSlideIndex].content = slideContent.innerHTML;
    }
    
    slideNavigator.innerHTML = '';
    slides.forEach((slide, index) => {
        const thumbnail = document.createElement('div');
        thumbnail.className = `slide-thumbnail ${index === currentSlideIndex ? 'active' : ''}`;
        thumbnail.setAttribute('draggable', 'true');
        thumbnail.setAttribute('data-index', index);
        
        // Create a mini preview of the slide content
        const previewContent = slide.content.replace(/<div class="editable"[^>]*>(.*?)<\/div>/g, '<div class="preview-text">$1</div>');
        
        thumbnail.innerHTML = `
            <div class="slide-number">Slide ${index + 1}</div>
            <div class="thumbnail-preview">${previewContent}</div>
        `;
        thumbnail.onclick = () => switchSlide(index);
        slideNavigator.appendChild(thumbnail);
    });
    
    // Update current slide
    slideContent.innerHTML = slides[currentSlideIndex].content;
    
    // Update slide info
    slideInfo.textContent = `Slide ${currentSlideIndex + 1} of ${slides.length}`;
}

// Set up drag and drop for slide reordering
function setupDragAndDrop() {
    let draggedItem = null;
    
    document.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('slide-thumbnail')) {
            draggedItem = e.target;
            setTimeout(() => {
                e.target.style.opacity = '0.5';
            }, 0);
        }
    });
    
    document.addEventListener('dragend', function(e) {
        if (e.target.classList.contains('slide-thumbnail')) {
            e.target.style.opacity = '1';
        }
    });
    
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        if (e.target.classList.contains('slide-thumbnail') && draggedItem) {
            const fromIndex = parseInt(draggedItem.getAttribute('data-index'));
            const toIndex = parseInt(e.target.getAttribute('data-index'));
            
            // Save state for undo
            saveState();
            
            // Reorder slides
            const movedSlide = slides.splice(fromIndex, 1)[0];
            slides.splice(toIndex, 0, movedSlide);
            
            // Update current slide index if necessary
            if (currentSlideIndex === fromIndex) {
                currentSlideIndex = toIndex;
            } else if (currentSlideIndex > fromIndex && currentSlideIndex <= toIndex) {
                currentSlideIndex--;
            } else if (currentSlideIndex < fromIndex && currentSlideIndex >= toIndex) {
                currentSlideIndex++;
            }
            
            renderSlides();
        }
    });
}

// Switch to a different slide
function switchSlide(index) {
    // Save current slide content
    slides[currentSlideIndex].content = slideContent.innerHTML;
    
    // Switch to new slide
    currentSlideIndex = index;
    slideContent.innerHTML = slides[currentSlideIndex].content;
    
    // Update UI
    renderSlides();
}

// Create a new slide
function createNewSlide() {
    // Save current slide content
    slides[currentSlideIndex].content = slideContent.innerHTML;
    
    // Save state for undo
    saveState();
    
    // Create new slide
    const newSlide = {
        id: Date.now(), // Using timestamp as ID
        content: '<div class="editable" contenteditable="true">Click to add title</div><div class="editable" contenteditable="true">Click to add content</div>'
    };
    
    // Add to slides array
    slides.splice(currentSlideIndex + 1, 0, newSlide);
    
    // Switch to new slide
    currentSlideIndex = currentSlideIndex + 1;
    
    // Update UI
    renderSlides();
    showToast('New slide created');
}

// Duplicate current slide
function duplicateSlide() {
    // Save current slide content
    slides[currentSlideIndex].content = slideContent.innerHTML;
    
    // Save state for undo
    saveState();
    
    // Create duplicate slide
    const duplicatedSlide = {
        id: Date.now(),
        content: slides[currentSlideIndex].content
    };
    
    // Add to slides array
    slides.splice(currentSlideIndex + 1, 0, duplicatedSlide);
    
    // Switch to new slide
    currentSlideIndex = currentSlideIndex + 1;
    
    // Update UI
    renderSlides();
    showToast('Slide duplicated');
}

// Delete current slide
function deleteSlide() {
    // Don't delete if it's the only slide
    if (slides.length === 1) {
        showToast('Cannot delete the only slide', 'error');
        return;
    }
    
    // Save state for undo
    saveState();
    
    // Remove current slide
    slides.splice(currentSlideIndex, 1);
    
    // Adjust current index if needed
    if (currentSlideIndex >= slides.length) {
        currentSlideIndex = slides.length - 1;
    }
    
    // Update UI
    renderSlides();
    showToast('Slide deleted');
}

// Enter presentation mode
function enterPresentationMode() {
    // Save current slide content
    slides[currentSlideIndex].content = slideContent.innerHTML;
    
    // Show presentation mode
    presentationMode.style.display = 'flex';
    document.body.classList.add('presenting');
    
    // Show current slide
    showPresentationSlide(currentSlideIndex);
}

// Exit presentation mode
function exitPresentationMode() {
    presentationMode.style.display = 'none';
    document.body.classList.remove('presenting');
}

// Show slide in presentation mode
function showPresentationSlide(index) {
    presentationSlide.innerHTML = slides[index].content;
    
    // Disable editing
    const editables = presentationSlide.querySelectorAll('.editable');
    editables.forEach(el => {
        el.contentEditable = false;
    });
    
    // Update slide counter
    document.getElementById('slideCounter').textContent = `${index + 1} / ${slides.length}`;
}

// Navigate in presentation mode
function nextSlide() {
    if (currentSlideIndex < slides.length - 1) {
        currentSlideIndex++;
        showPresentationSlide(currentSlideIndex);
    }
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        showPresentationSlide(currentSlideIndex);
    }
}

// Apply text formatting
function applyFormatting(command, value = null) {
    document.execCommand(command, false, value);
    
    // Update button states
    updateFormatButtonStates();
}

// Update format button states based on current selection
function updateFormatButtonStates() {
    document.getElementById('boldBtn').classList.toggle('active', document.queryCommandState('bold'));
    document.getElementById('italicBtn').classList.toggle('active', document.queryCommandState('italic'));
    document.getElementById('underlineBtn').classList.toggle('active', document.queryCommandState('underline'));
    
    // Update font and size selects (more complex)
    const fontName = document.queryCommandValue('fontName');
    const fontSize = document.queryCommandValue('fontSize');
    
    if (fontName) {
        const fontSelect = document.getElementById('fontSelect');
        try {
            fontSelect.value = fontName;
        } catch (e) {
            // Font not in list
        }
    }
    
    if (fontSize) {
        const sizeSelect = document.getElementById('sizeSelect');
        try {
            sizeSelect.value = fontSize + 'px';
        } catch (e) {
            // Size not in list
        }
    }
}

// Save state for undo/redo
function saveState() {
    // Save current content to the slide before capturing state
    slides[currentSlideIndex].content = slideContent.innerHTML;
    
    undoStack.push({
        slides: JSON.parse(JSON.stringify(slides)),
        currentSlideIndex: currentSlideIndex
    });
    
    // Clear redo stack when a new action is performed
    redoStack = [];
    
    // Enable/disable undo/redo buttons
    updateUndoRedoButtons();
}

// Undo last action
function undo() {
    if (undoStack.length === 0) return;
    
    // Save current state to redo stack
    redoStack.push({
        slides: JSON.parse(JSON.stringify(slides)),
        currentSlideIndex: currentSlideIndex
    });
    
    // Restore previous state
    const previousState = undoStack.pop();
    slides = previousState.slides;
    currentSlideIndex = previousState.currentSlideIndex;
    
    // Update UI
    renderSlides();
    updateUndoRedoButtons();
    showToast('Undo successful');
}

// Redo previously undone action
function redo() {
    if (redoStack.length === 0) return;
    
    // Save current state to undo stack
    undoStack.push({
        slides: JSON.parse(JSON.stringify(slides)),
        currentSlideIndex: currentSlideIndex
    });
    
    // Restore next state
    const nextState = redoStack.pop();
    slides = nextState.slides;
    currentSlideIndex = nextState.currentSlideIndex;
    
    // Update UI
    renderSlides();
    updateUndoRedoButtons();
    showToast('Redo successful');
}

// Update undo/redo button states
function updateUndoRedoButtons() {
    document.getElementById('undoBtn').disabled = undoStack.length === 0;
    document.getElementById('redoBtn').disabled = redoStack.length === 0;
}

// Export slides to JSON
function exportSlides() {
    // Save current slide content
    slides[currentSlideIndex].content = slideContent.innerHTML;
    
    // Create JSON data
    const jsonData = JSON.stringify(slides, null, 2);
    
    // Create download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create and click download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = prompt("Enter you file name: ") + '.presentation';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    showToast('Presentation exported successfully');
}

// Import slides from JSON
function importSlides() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.presentation' || '.json';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                // Save state for undo
                saveState();
                
                // Parse and validate JSON
                const importedSlides = JSON.parse(event.target.result);
                if (Array.isArray(importedSlides) && importedSlides.length > 0) {
                    slides = importedSlides;
                    currentSlideIndex = 0;
                    renderSlides();
                    showToast('Presentation imported successfully');
                } else {
                    showToast('Invalid presentation file format', 'error');
                }
            } catch (error) {
                showToast('Error importing presentation', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);
    };
    
    fileInput.click();
}

// Save presentation
function savePresentation() {
    // Save current slide content
    slides[currentSlideIndex].content = slideContent.innerHTML;
    
    // Prompt for presentation name
    document.getElementById('saveDialog').style.display = 'flex';
}

// Save presentation to local storage
function finalizeSave() {
    const nameInput = document.getElementById('presentationName');
    const name = nameInput.value.trim() || `Presentation ${new Date().toLocaleString()}`;
    
    // Get existing presentations
    let savedPresentations = JSON.parse(localStorage.getItem('savedPresentations') || '[]');
    
    // Create presentation object
    const presentation = {
        id: Date.now().toString(),
        name: name,
        date: new Date().toISOString(),
        slides: JSON.stringify(slides)
    };
    
    // Add to saved presentations
    savedPresentations.push(presentation);
    
    // Limit to 10 most recent
    if (savedPresentations.length > 10) {
        savedPresentations = savedPresentations.slice(-10);
    }
    
    // Save to local storage
    localStorage.setItem('savedPresentations', JSON.stringify(savedPresentations));
    
    // Close dialog and reset input
    document.getElementById('saveDialog').style.display = 'none';
    nameInput.value = '';
    
    showToast('Presentation saved successfully');
}

// Cancel saving
function cancelSave() {
    document.getElementById('saveDialog').style.display = 'none';
    document.getElementById('presentationName').value = '';
}

// Show recent presentations
function showRecent() {
    const savedPresentations = JSON.parse(localStorage.getItem('savedPresentations') || '[]');
    if (savedPresentations.length > 0) {
        showRecentPresentations(savedPresentations);
    } else {
        showToast('No saved presentations found', 'info');
    }
}

// Insert image
function insertImage() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = `<img src="${event.target.result}" class="slide-image" alt="Inserted Image">`;
            document.execCommand('insertHTML', false, img);
        };
        reader.readAsDataURL(file);
    };
    
    fileInput.click();
}

// Insert shape
function insertShape(type) {
    let shape;
    const color = document.getElementById('colorPicker').value;
    
    switch (type) {
        case 'rectangle':
            shape = `<div class="shape rectangle" style="background-color: ${color}"></div>`;
            break;
        case 'circle':
            shape = `<div class="shape circle" style="background-color: ${color}"></div>`;
            break;
        case 'triangle':
            shape = `<div class="shape triangle" style="border-bottom-color: ${color}"></div>`;
            break;
    }
    
    document.execCommand('insertHTML', false, shape);
}

// Show toast message
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Setup event listeners
function setupEventListeners() {
    // Toolbar buttons
    document.getElementById('newSlideBtn').addEventListener('click', createNewSlide);
    document.getElementById('duplicateBtn').addEventListener('click', duplicateSlide);
    document.getElementById('deleteSlideBtn').addEventListener('click', deleteSlide);
    document.getElementById('presentBtn').addEventListener('click', enterPresentationMode);
    document.getElementById('exportBtn').addEventListener('click', exportSlides);
    document.getElementById('importBtn').addEventListener('click', importSlides);
    document.getElementById('saveBtn').addEventListener('click', savePresentation);
    document.getElementById('openBtn').addEventListener('click', showRecent);
    document.getElementById('undoBtn').addEventListener('click', undo);
    document.getElementById('redoBtn').addEventListener('click', redo);
    document.getElementById('insertImageBtn').addEventListener('click', insertImage);
    
    // Shape dropdown listeners
    document.getElementById('rectangleBtn').addEventListener('click', () => insertShape('rectangle'));
    document.getElementById('circleBtn').addEventListener('click', () => insertShape('circle'));
    document.getElementById('triangleBtn').addEventListener('click', () => insertShape('triangle'));
    
    // Dialog buttons
    document.getElementById('savePresentationBtn').addEventListener('click', finalizeSave);
    document.getElementById('cancelSaveBtn').addEventListener('click', cancelSave);
    document.getElementById('closeRecentBtn').addEventListener('click', closeRecentDialog);
    
    // Format toolbar
    document.getElementById('fontSelect').addEventListener('change', (e) => {
        applyFormatting('fontName', e.target.value);
    });
    
    document.getElementById('sizeSelect').addEventListener('change', (e) => {
        applyFormatting('fontSize', e.target.value);
    });
    
    document.getElementById('boldBtn').addEventListener('click', () => {
        applyFormatting('bold');
    });
    
    document.getElementById('italicBtn').addEventListener('click', () => {
        applyFormatting('italic');
    });
    
    document.getElementById('underlineBtn').addEventListener('click', () => {
        applyFormatting('underline');
    });
    
    document.getElementById('alignLeftBtn').addEventListener('click', () => {
        applyFormatting('justifyLeft');
    });
    
    document.getElementById('alignCenterBtn').addEventListener('click', () => {
        applyFormatting('justifyCenter');
    });
    
    document.getElementById('alignRightBtn').addEventListener('click', () => {
        applyFormatting('justifyRight');
    });
    
    document.getElementById('colorPicker').addEventListener('input', (e) => {
        applyFormatting('foreColor', e.target.value);
    });
    
    document.getElementById('bgColorPicker').addEventListener('input', (e) => {
        applyFormatting('hiliteColor', e.target.value);
    });
    
    // Listen for selection changes to update formatting buttons
    document.addEventListener('selectionchange', updateFormatButtonStates);
    
    // Presentation controls
    document.getElementById('exitPresentation').addEventListener('click', exitPresentationMode);
    document.getElementById('nextSlide').addEventListener('click', nextSlide);
    document.getElementById('prevSlide').addEventListener('click', prevSlide);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // In presentation mode
        if (presentationMode.style.display === 'flex') {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                nextSlide();
                e.preventDefault();
            } else if (e.key === 'ArrowLeft') {
                prevSlide();
                e.preventDefault();
            } else if (e.key === 'Escape') {
                exitPresentationMode();
                e.preventDefault();
            }
        } 
        // In editor mode
        else {
            // Ctrl+S to save
            if (e.ctrlKey && e.key === 's') {
                savePresentation();
                e.preventDefault();
            }
            // Ctrl+Z to undo
            else if (e.ctrlKey && e.key === 'z') {
                undo();
                e.preventDefault();
            }
            // Ctrl+Y to redo
            else if (e.ctrlKey && e.key === 'y') {
                redo();
                e.preventDefault();
            }
            // Ctrl+N for new slide
            else if (e.ctrlKey && e.key === 'n') {
                createNewSlide();
                e.preventDefault();
            }
        }
    });
    
    // Toggle dropdown menus
    document.getElementById('insertBtn').addEventListener('click', () => {
        document.getElementById('insertDropdown').classList.toggle('show');
    });
    
    // Close dropdowns when clicking elsewhere
    window.addEventListener('click', (e) => {
        if (!e.target.matches('.dropdown-button')) {
            const dropdowns = document.getElementsByClassName('dropdown-content');
            for (let i = 0; i < dropdowns.length; i++) {
                if (dropdowns[i].classList.contains('show')) {
                    dropdowns[i].classList.remove('show');
                }
            }
        }
    });
}

// Initialize the app
window.onload = init;
// Content Dataset for PresentationAI
const contentDataset = {
    "energy": {
        includes: ["RENEWABLE", "ENERGY"],
        contents: {
            slide_1: {
                title: "Introduction to Renewable Energy",
                content: "Renewable energy is energy derived from natural resources that replenish themselves over short periods of time. These include sources like sunlight, wind, rain, tides, waves, and geothermal heat."
            },
            slide_2: {
                title: "Types of Renewable Energy",
                content: "The main types include: Solar, Wind, Hydroelectric, Biomass, and Geothermal. Each has unique advantages and challenges for implementation."
            },
            slide_3: {
                title: "Solar Energy",
                content: "Solar power harnesses energy from the sun using photovoltaic cells or solar thermal collectors. It's becoming increasingly affordable and efficient worldwide."
            },
            slide_4: {
                title: "Wind Energy",
                content: "Wind turbines convert kinetic energy from wind into mechanical power, which can be used directly or converted to electricity. Wind farms can be built on land or offshore."
            },
            slide_5: {
                title: "Benefits of Renewable Energy",
                content: "Renewable energy reduces carbon emissions, provides energy security, creates jobs, and offers stable energy prices in the long term."
            },
            slide_6: {
                title: "Future Outlook",
                content: "The renewable energy sector is growing rapidly. With continued innovation and policy support, renewables could provide the majority of global energy needs by 2050."
            }
        }
    },
    "climate": {
        includes: ["CLIMATE", "CHANGE"],
        contents: {
            slide_1: {
                title: "Understanding Climate Change",
                content: "Climate change refers to long-term shifts in temperatures and weather patterns. These changes may be natural, but since the 1800s, human activities have been the main driver."
            },
            slide_2: {
                title: "Causes of Climate Change",
                content: "The primary cause is burning fossil fuels, which releases greenhouse gases that trap heat in Earth's atmosphere. Deforestation, industrial processes, and agriculture also contribute."
            },
            slide_3: {
                title: "Global Impacts",
                content: "Effects include rising sea levels, intense drought, severe fires, extreme storms, biodiversity loss, and threats to food security worldwide."
            },
            slide_4: {
                title: "Economic Consequences",
                content: "Climate change impacts economies through increased healthcare costs, damage to infrastructure, reduced agricultural yields, and lost productivity."
            },
            slide_5: {
                title: "Mitigation Strategies",
                content: "Key strategies include transitioning to renewable energy, improving energy efficiency, sustainable agriculture, and protecting forests and ecosystems."
            },
            slide_6: {
                title: "International Cooperation",
                content: "Global agreements like the Paris Accord establish frameworks for nations to reduce emissions, provide climate financing, and support vulnerable communities."
            }
        }
    },
    "business": {
        includes: ["BUSINESS", "PLAN"],
        contents: {
            slide_1: {
                title: "Business Plan Overview",
                content: "A comprehensive roadmap that outlines your business goals, strategies, financial projections, and operational plans."
            },
            slide_2: {
                title: "Executive Summary",
                content: "Brief overview of your business concept, market opportunity, unique value proposition, and key financial highlights."
            },
            slide_3: {
                title: "Market Analysis",
                content: "Overview of industry trends, target market segments, customer needs, and competitive landscape analysis."
            },
            slide_4: {
                title: "Products and Services",
                content: "Detailed description of your offerings, their unique benefits, development stage, and intellectual property status."
            },
            slide_5: {
                title: "Marketing and Sales Strategy",
                content: "Approach to customer acquisition, retention, pricing strategy, distribution channels, and promotional tactics."
            },
            slide_6: {
                title: "Financial Projections",
                content: "Revenue forecasts, expense budgets, break-even analysis, and funding requirements for the next 3-5 years."
            }
        }
    },
    "technology": {
        includes: ["TECH", "TRENDS"],
        contents: {
            slide_1: {
                title: "Emerging Technology Trends",
                content: "Overview of transformative technologies reshaping industries and society in the coming years."
            },
            slide_2: {
                title: "Artificial Intelligence & Machine Learning",
                content: "AI systems that can perform tasks requiring human intelligence. Machine learning allows systems to learn and improve from experience."
            },
            slide_3: {
                title: "Internet of Things (IoT)",
                content: "Network of physical objects embedded with sensors, software, and connectivity to exchange data with other devices and systems."
            },
            slide_4: {
                title: "Blockchain Technology",
                content: "Distributed ledger technology enabling secure, transparent transactions without need for central verification."
            },
            slide_5: {
                title: "Quantum Computing",
                content: "Computing using quantum-mechanical phenomena to perform operations on data, potentially solving complex problems exponentially faster."
            },
            slide_6: {
                title: "Ethical Considerations",
                content: "Addressing privacy concerns, security vulnerabilities, workforce disruption, and algorithmic bias in technology development."
            }
        }
    },
    "education": {
        includes: ["EDUCATION", "FUTURE"],
        contents: {
            slide_1: {
                title: "The Future of Education",
                content: "Exploring how learning environments, methodologies, and goals are evolving in response to technological and societal changes."
            },
            slide_2: {
                title: "Personalized Learning",
                content: "Adaptive technologies that tailor educational experiences to individual learners' needs, preferences, and pace."
            },
            slide_3: {
                title: "Digital Classrooms",
                content: "Virtual and augmented reality, interactive content, and collaborative platforms transforming how students engage with material."
            },
            slide_4: {
                title: "Skills for the Future",
                content: "Critical thinking, creativity, collaboration, adaptability, and digital literacy becoming central to educational curricula."
            },
            slide_5: {
                title: "Lifelong Learning",
                content: "Continuous education models replacing traditional one-time degree programs as career paths become more fluid."
            },
            slide_6: {
                title: "Accessibility and Inclusion",
                content: "Technologies and methodologies breaking down barriers to education based on geography, economic status, or learning differences."
            }
        }
    }
};

// Function to initialize PresentationAI
function initializePresentationAI() {
    // Create AI panel container
    const aiContainer = document.createElement('div');
    aiContainer.id = 'presentationAI-container';
    aiContainer.innerHTML = `
        <div class="presentationAI-header">
            <h3>PresentationAI</h3>
            <button id="presentationAI-close">×</button>
        </div>
        <div class="presentationAI-input-container">
            <input type="text" id="presentationAI-prompt" placeholder="Ask PresentationAI to create slides...">
            <button id="presentationAI-submit">Generate</button>
        </div>
        <div id="presentationAI-body"></div>
    `;
    document.body.appendChild(aiContainer);
    
    // Add styles
    const styles = document.createElement('style');
    styles.textContent = `
        #presentationAI-container {
            position: fixed;
            top: 0;
            right: -350px;
            width: 350px;
            height: 100vh;
            background-color: #fff;
            box-shadow: -2px 0 5px rgba(0, 0, 0, 0.2);
            transition: right 0.3s ease;
            z-index: 1000;
            display: flex;
            flex-direction: column;
            border-left: 1px solid #ddd;
        }
        
        #presentationAI-container.open {
            right: 0;
        }
        
        .presentationAI-header {
            padding: 15px;
            background-color: #3498db;
            color: white;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .presentationAI-header h3 {
            margin: 0;
        }
        
        #presentationAI-close {
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
        }
        
        .presentationAI-input-container {
            padding: 15px;
            display: flex;
            border-bottom: 1px solid #ddd;
        }
        
        #presentationAI-prompt {
            flex-grow: 1;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px 0 0 4px;
        }
        
        #presentationAI-submit {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 0 4px 4px 0;
            cursor: pointer;
        }
        
        #presentationAI-body {
            flex-grow: 1;
            overflow-y: auto;
            padding: 15px;
        }
        
        .presentationAI-results {
            background-color: #f9f9f9;
            border-radius: 4px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #3498db;
        }
        
        .presentationAI-results h4 {
            margin-top: 0;
            color: #333;
        }
        
        .keyword-highlight {
            background-color: #ffe0b2;
            padding: 2px 4px;
            border-radius: 3px;
        }
        
        .content-results {
            margin: 15px 0;
            line-height: 1.5;
        }
        
        .presentationAI-action {
            text-align: right;
        }
        
        .presentationAI-action button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .presentationAI-create-btn {
            background-color: #2ecc71;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
            display: block;
            width: 100%;
        }
        
        .slide-preview {
            border: 1px solid #ddd;
            padding: 10px;
            margin: 10px 0;
            background-color: white;
        }
        
        .slide-preview h5 {
            margin-top: 0;
            color: #3498db;
        }
        
        .slide-preview p {
            margin-bottom: 0;
            font-size: 0.9em;
            color: #555;
        }
    `;
    document.head.appendChild(styles);
    
    // Add toggle button to the toolbar
    const toolbar = document.querySelector('.toolbar');
    if (toolbar) {
        const aiToggleBtn = document.createElement('button');
        aiToggleBtn.id = 'presentationAI-toggle';
        aiToggleBtn.textContent = 'Ask PresentationAI';
        aiToggleBtn.className = 'toolbar-button';
        aiToggleBtn.addEventListener('click', togglePresentationAI);
        toolbar.appendChild(aiToggleBtn);
    } else {
        // If toolbar not found, create a floating button
        const aiToggleBtn = document.createElement('button');
        aiToggleBtn.id = 'presentationAI-toggle';
        aiToggleBtn.textContent = 'Ask PresentationAI';
        aiToggleBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1001;
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        aiToggleBtn.addEventListener('click', togglePresentationAI);
        document.body.appendChild(aiToggleBtn);
    }
    
    // Set up event listeners
    document.getElementById('presentationAI-close').addEventListener('click', togglePresentationAI);
    document.getElementById('presentationAI-submit').addEventListener('click', processPrompt);
    document.getElementById('presentationAI-prompt').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            processPrompt();
        }
    });
    
    // Add keyboard shortcut (Ctrl+Shift+A) to toggle AI
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            togglePresentationAI();
        }
    });
}

// Toggle AI panel visibility
function togglePresentationAI() {
    const aiContainer = document.getElementById('presentationAI-container');
    aiContainer.classList.toggle('open');
    if (aiContainer.classList.contains('open')) {
        document.getElementById('presentationAI-prompt').focus();
    }
}

// Process the user prompt
function processPrompt() {
    const promptInput = document.getElementById('presentationAI-prompt');
    const prompt = promptInput.value.trim();
    
    if (prompt) {
        // Parse for number of slides requested
        let slideCount = 6; // Default to 6 slides
        const slideMatch = prompt.match(/(\d+)\s*slide/i);
        if (slideMatch) {
            slideCount = parseInt(slideMatch[1]);
            // Cap at reasonable number
            if (slideCount > 20) slideCount = 20;
            if (slideCount < 1) slideCount = 1;
        }
        
        // Extract keywords and find matching content
        const keywords = extractKeywords(prompt);
        const result = generateContent(keywords, slideCount);
        
        // Display results
        displayResults(prompt, keywords, result, slideCount);
        
        promptInput.value = '';
    }
}

// Extract important keywords from prompt
function extractKeywords(prompt) {
    // Convert to uppercase for matching
    const uppercasePrompt = prompt.toUpperCase();
    
    // List of all potential important keywords
    const allKeywords = [];
    
    // Collect all keywords from the dataset
    for (const topic in contentDataset) {
        contentDataset[topic].includes.forEach(keyword => {
            if (!allKeywords.includes(keyword)) {
                allKeywords.push(keyword);
            }
        });
    }
    
    // Find matches
    const foundKeywords = allKeywords.filter(keyword => 
        uppercasePrompt.includes(keyword)
    );
    
    return foundKeywords;
}

// Generate content based on extracted keywords
function generateContent(keywords, slideCount) {
    // If no keywords found
    if (keywords.length === 0) {
        return {
            type: "none",
            message: "I couldn't identify specific keywords in your request. Try phrases like 'renewable energy', 'climate change', 'business plan', 'tech trends', or 'future of education'."
        };
    }
    
    // Try to find matching content in dataset
    for (const topic in contentDataset) {
        const dataset = contentDataset[topic];
        const matches = dataset.includes.every(keyword => keywords.includes(keyword));
        
        if (matches) {
            // We found a matching topic
            return {
                type: "match",
                topic: topic,
                slides: dataset.contents
            };
        }
    }
    
    // No exact match, but we have some keywords
    return {
        type: "partial",
        message: "I recognized these topics: " + keywords.join(", ") + ". Could you provide more specific details about what type of presentation you'd like to create?"
    };
}

// Display results in the AI panel
function displayResults(prompt, keywords, result, slideCount) {
    const aiBody = document.getElementById('presentationAI-body');
    
    const highlightedKeywords = keywords.map(keyword => 
        `<span class="keyword-highlight">${keyword}</span>`
    ).join(", ");
    
    let resultHTML = `
    <div class="presentationAI-results">
        <h4>Your request: "${prompt}"</h4>
        <p><strong>Topics:</strong> ${highlightedKeywords || "None detected"}</p>
    `;
    
    if (result.type === "match") {
        resultHTML += `<div class="content-results">
            <p>I can create a presentation on "${result.topic}" with ${slideCount} slides.</p>
            <div class="slides-preview">`;
        
        // Show preview of the slides
        const slideKeys = Object.keys(result.slides);
        const displayCount = Math.min(slideCount, slideKeys.length);
        
        for (let i = 0; i < displayCount; i++) {
            const slideKey = slideKeys[i];
            const slide = result.slides[slideKey];
            
            resultHTML += `
                <div class="slide-preview">
                    <h5>${slide.title}</h5>
                    <p>${slide.content.substring(0, 100)}${slide.content.length > 100 ? '...' : ''}</p>
                </div>
            `;
        }
        
        resultHTML += `</div>
            <button class="presentationAI-create-btn" onclick="createPresentation('${result.topic}', ${slideCount})">
                Create This Presentation
            </button>
        </div>`;
    } else {
        resultHTML += `<div class="content-results">
            <p>${result.message}</p>
        </div>`;
    }
    
    resultHTML += `</div>`;
    
    // Add to the top of the results area
    aiBody.insertAdjacentHTML('afterbegin', resultHTML);
}

// Create the presentation with the selected topic
// Create the presentation with the selected topic
function createPresentation(topic, slideCount) {
    const dataset = contentDataset[topic];
    
    if (!dataset) {
        showToast('Topic not found', 'error');
        return;
    }
    
    // Save current state for undo
    saveState();
    
    // First, save the current slide content to prevent loss
    slides[currentSlideIndex].content = slideContent.innerHTML;
    
    // Set the title and content of the first slide
    const firstSlideContent = `
        <div id="SLDTitle" class="editable" contenteditable="true">${dataset.contents.slide_1.title}</div>
        <div class="editable" id="SLD-Body" contenteditable="true">${dataset.contents.slide_1.content}</div>
    `;
    
    // Update the first slide
    slides[0].content = firstSlideContent;
    
    // Set currentSlideIndex to the first slide
    currentSlideIndex = 0;
    
    // Create additional slides
    const numSlidesToCreate = Math.min(slideCount - 1, Object.keys(dataset.contents).length - 1);
    
    // Remove any existing slides beyond the first one
    if (slides.length > 1) {
        slides = slides.slice(0, 1);
    }
    
    // Add the new slides with content
    for (let i = 0; i < numSlidesToCreate; i++) {
        const slideIndex = i + 2; // Slide numbering starts from 1, and we've already set slide 1
        const slideKey = `slide_${slideIndex}`;
        
        if (dataset.contents[slideKey]) {
            // Create a new slide with the appropriate content
            const newSlide = {
                id: Date.now() + i, // Ensure unique ID
                content: `
                    <div class="editable" contenteditable="true">${dataset.contents[slideKey].title}</div>
                    <div class="editable" contenteditable="true">${dataset.contents[slideKey].content}</div>
                `
            };
            
            // Add to slides array
            slides.push(newSlide);
        }
    }
    
    // Re-render all slides
    renderSlides();
    
    // Close the AI panel
    togglePresentationAI();
    
    // Show success message
    showToast(`Created ${slides.length} slides on ${topic.charAt(0).toUpperCase() + topic.slice(1)}`, 'success');
}

// Show toast message (reusing existing function from main code)
function showToast(message, type = 'success') {
    // Check if toast element exists
    let toast = document.getElementById('toast');
    
    // If toast doesn't exist, create it
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        document.body.appendChild(toast);
        
        // Add styles if not already added
        if (!document.getElementById('toast-styles')) {
            const toastStyles = document.createElement('style');
            toastStyles.id = 'toast-styles';
            toastStyles.textContent = `
                #toast {
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: #333;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 4px;
                    z-index: 1001;
                    display: none;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                }
                #toast.success { background-color: #2ecc71; }
                #toast.error { background-color: #e74c3c; }
                #toast.info { background-color: #3498db; }
            `;
            document.head.appendChild(toastStyles);
        }
    }
    
    // Set message and display
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    // Hide after delay
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

// Initialize when the document is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Wait a short time to ensure the main page has initialized
    setTimeout(initializePresentationAI, 500);
});

// Initialize if document is already loaded
if (document.readyState === 'complete') {
    setTimeout(initializePresentationAI, 500);
}