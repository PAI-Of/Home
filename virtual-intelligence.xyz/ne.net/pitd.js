/**
 * PI-TD Game Engine
 * A lightweight 2D game engine with built-in movement, input handling, and image management
 * 
 * @version 1.0.0
 */

// --- Core Game Setup and Rendering ---

/**
 * @function createGame (width, height, containerId)
 * Creates a new game instance with a canvas of specified dimensions
 * @param {number} width - Canvas width in pixels 
 * @param {number} height - Canvas height in pixels
 * @param {string} containerId - Optional ID of container element (creates one if not provided)
 * @returns {Object} Game object with canvas, context, and core methods
 */
function createGame(width, height, containerId = null) {
    // Create canvas element
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.style.border = "1px solid black";
    
    // Get 2D rendering context
    const ctx = canvas.getContext("2d");
    
    // Append canvas to specified container or body
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.appendChild(canvas);
        } else {
            console.warn(`Container with ID '${containerId}' not found. Appending to body.`);
            document.body.appendChild(canvas);
        }
    } else {
        document.body.appendChild(canvas);
    }
    
    // Initialize game state
    const gameState = {
        canvas,
        ctx,
        entities: [],
        keysPressed: {},
        mouseX: 0,
        mouseY: 0,
        mousePressed: false,
        lastFrameTime: 0,
        deltaTime: 0,
        running: false
    };
    
    // Setup input event listeners
    setupEventListeners(gameState);
    
    console.log(`Game canvas created: ${width}x${height}`);
    
    // Return game object with public methods
    return {
        canvas,
        ctx,
        start: () => startGameLoop(gameState),
        stop: () => stopGameLoop(gameState),
        addEntity: (entity) => addEntity(gameState, entity),
        removeEntity: (entityId) => removeEntity(gameState, entityId),
        onKey: (key, callback) => registerKeyHandler(gameState, key, callback),
        onClick: (callback) => registerClickHandler(gameState, callback),
        onMouseMove: (callback) => registerMouseMoveHandler(gameState, callback),
        getMousePosition: () => ({ x: gameState.mouseX, y: gameState.mouseY }),
        isKeyPressed: (key) => isKeyPressed(gameState, key),
        isMousePressed: () => gameState.mousePressed,
        clearScreen: () => clearScreen(gameState),
        getEntities: () => getEntities(gameState),
        getDeltaTime: () => gameState.deltaTime
    };
}

/**
 * Sets up event listeners for keyboard and mouse input
 * @param {Object} gameState - The game state object
 */
function setupEventListeners(gameState) {
    const { canvas } = gameState;
    
    // Keyboard events
    window.addEventListener('keydown', (e) => {
        gameState.keysPressed[e.key.toLowerCase()] = true;
    });
    
    window.addEventListener('keyup', (e) => {
        gameState.keysPressed[e.key.toLowerCase()] = false;
    });
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
        gameState.mousePressed = true;
        updateMousePosition(gameState, e);
    });
    
    canvas.addEventListener('mouseup', (e) => {
        gameState.mousePressed = false;
        updateMousePosition(gameState, e);
    });
    
    canvas.addEventListener('mousemove', (e) => {
        updateMousePosition(gameState, e);
    });
    
    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

/**
 * Updates mouse position in game state
 * @param {Object} gameState - The game state object
 * @param {MouseEvent} e - Mouse event
 */
function updateMousePosition(gameState, e) {
    const { canvas } = gameState;
    const rect = canvas.getBoundingClientRect();
    
    gameState.mouseX = e.clientX - rect.left;
    gameState.mouseY = e.clientY - rect.top;
}

// --- Game Loop ---

/**
 * Starts the main game loop
 * @param {Object} gameState - The game state object
 */
function startGameLoop(gameState) {
    if (gameState.running) return;
    
    gameState.running = true;
    gameState.lastFrameTime = performance.now();
    
    requestAnimationFrame((timestamp) => gameLoop(gameState, timestamp));
    console.log("Game loop started");
}

/**
 * Stops the game loop
 * @param {Object} gameState - The game state object
 */
function stopGameLoop(gameState) {
    gameState.running = false;
    console.log("Game loop stopped");
}

/**
 * Main game loop function
 * @param {Object} gameState - The game state object
 * @param {number} timestamp - Current timestamp from requestAnimationFrame
 */
function gameLoop(gameState, timestamp) {
    if (!gameState.running) return;
    
    // Calculate delta time
    gameState.deltaTime = (timestamp - gameState.lastFrameTime) / 1000; // Convert to seconds
    gameState.lastFrameTime = timestamp;
    
    // Clear the canvas
    clearScreen(gameState);
    
    // Update and render all entities
    updateAndRenderEntities(gameState);
    
    // Continue the loop
    requestAnimationFrame((nextTimestamp) => gameLoop(gameState, nextTimestamp));
}

/**
 * Clears the screen
 * @param {Object} gameState - The game state object
 */
function clearScreen(gameState) {
    const { ctx, canvas } = gameState;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// --- Entity Management ---

/**
 * Updates and renders all entities
 * @param {Object} gameState - The game state object
 */
function updateAndRenderEntities(gameState) {
    const { entities, ctx, deltaTime } = gameState;
    
    entities.forEach(entity => {
        // Call entity's update method if it exists
        if (entity.update) {
            entity.update(deltaTime);
        }
        
        // Call entity's render method if it exists
        if (entity.render) {
            entity.render(ctx);
        } else if (entity.image) {
            // Default rendering for image entities
            ctx.drawImage(entity.image, entity.x, entity.y);
        }
    });
}

/**
 * Adds an entity to the game
 * @param {Object} gameState - The game state object
 * @param {Object} entity - The entity to add
 * @returns {Object} The added entity
 */
function addEntity(gameState, entity) {
    // Generate a unique ID if not provided
    if (!entity.id) {
        entity.id = "entity_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    }
    
    gameState.entities.push(entity);
    return entity;
}

/**
 * Removes an entity from the game
 * @param {Object} gameState - The game state object
 * @param {string} entityId - ID of the entity to remove
 * @returns {boolean} Whether the entity was found and removed
 */
function removeEntity(gameState, entityId) {
    const initialLength = gameState.entities.length;
    gameState.entities = gameState.entities.filter(entity => entity.id !== entityId);
    
    return gameState.entities.length < initialLength;
}

/**
 * Gets all entities in the game
 * @param {Object} gameState - The game state object
 * @returns {Array} Array of all entities
 */
function getEntities(gameState) {
    return [...gameState.entities];
}

// --- Input Handling ---

/**
 * Registers a keyboard handler for a specific key
 * @param {Object} gameState - The game state object
 * @param {string} key - The key to listen for
 * @param {Function} callback - Function to call when key is pressed
 */
function registerKeyHandler(gameState, key, callback) {
    const keyLower = key.toLowerCase();
    
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === keyLower) {
            callback();
        }
    });
}

/**
 * Checks if a key is currently pressed
 * @param {Object} gameState - The game state object
 * @param {string} key - The key to check
 * @returns {boolean} Whether the key is pressed
 */
function isKeyPressed(gameState, key) {
    return !!gameState.keysPressed[key.toLowerCase()];
}

/**
 * Registers a click handler
 * @param {Object} gameState - The game state object
 * @param {Function} callback - Function to call when canvas is clicked
 */
function registerClickHandler(gameState, callback) {
    gameState.canvas.addEventListener('click', (e) => {
        updateMousePosition(gameState, e);
        callback(gameState.mouseX, gameState.mouseY, e);
    });
}

/**
 * Registers a mouse move handler
 * @param {Object} gameState - The game state object
 * @param {Function} callback - Function to call when mouse moves over canvas
 */
function registerMouseMoveHandler(gameState, callback) {
    gameState.canvas.addEventListener('mousemove', (e) => {
        updateMousePosition(gameState, e);
        callback(gameState.mouseX, gameState.mouseY, e);
    });
}

// --- Asset Management ---

/**
 * Loads an image from a URL
 * @param {string} src - Image URL/path
 * @returns {Promise<HTMLImageElement>} Promise resolving to the loaded image
 */
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
        img.src = src;
    });
}

/**
 * Creates a sprite from a loaded image
 * @param {HTMLImageElement} image - The loaded image
 * @param {number} x - Initial x position
 * @param {number} y - Initial y position
 * @param {number} [width] - Optional width (uses image width if not specified)
 * @param {number} [height] - Optional height (uses image height if not specified)
 * @returns {Object} Sprite object
 */
function createSprite(image, x, y, width = null, height = null) {
    return {
        image,
        x,
        y,
        width: width || image.width,
        height: height || image.height,
        visible: true,
        update: function(deltaTime) {
            // Default update method can be overridden
        },
        render: function(ctx) {
            if (this.visible) {
                ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
            }
        }
    };
}

// --- Movement & Physics ---

/**
 * Moves an entity along the specified axis
 * @param {Object} entity - The entity to move
 * @param {string} axis - Axis to move along ('x' or 'y')
 * @param {number} distance - Distance to move (negative values move left/up)
 */
function move(entity, axis, distance) {
    if (axis.toLowerCase() === 'x') {
        entity.x += distance;
    } else if (axis.toLowerCase() === 'y') {
        entity.y += distance;
    }
}

/**
 * Checks for collision between two entities using simple box collision
 * @param {Object} entityA - First entity with x, y, width, height properties
 * @param {Object} entityB - Second entity with x, y, width, height properties
 * @returns {boolean} Whether the entities are colliding
 */
function checkCollision(entityA, entityB) {
    return (
        entityA.x < entityB.x + entityB.width &&
        entityA.x + entityA.width > entityB.x &&
        entityA.y < entityB.y + entityB.height &&
        entityA.y + entityA.height > entityB.y
    );
}

// --- Export Module ---

// Export all functions for use in browser or module environment
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
    module.exports = {
        createGame,
        loadImage,
        createSprite,
        move,
        checkCollision
    };
} else {
    // In browser, add to window object
    window.PITD = {
        createGame,
        loadImage,
        createSprite,
        move,
        checkCollision
    };
}