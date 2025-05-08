// Game configuration
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Initialize the game
const game = new Phaser.Game(config);

// Handle window resizing
window.addEventListener('resize', function() {
    game.scale.resize(window.innerWidth, window.innerHeight);
});

// Global variables
let player;
let platforms;
let cursors;
let score = 0;
let scoreText;
let attackKey;
let teleportKey;
let isAttacking = false;
let attackCooldown = false;
let playerHealth = 100;
let healthText;
let healthBar;
let healthBarBackground;
let dragonHealthText;
let dragonHealthBar;
let dragonHealthBarBackground;
let enemies = [];
let dragon;
let dragonFireTimer = 0;
let directionIndicator;
const worldWidth = window.innerWidth * 10; // World is 10x wider than screen
let towers = [];
let totalTowers = 0;
let towersText;
let gameOver = false;
let gameOverText;
let minimap; // Minimap container
let minimapEntities = []; // Array to store minimap entities
let teleportCooldown = false; // Cooldown for teleportation
let teleportCooldownTimer = 0; // Cooldown timer for teleportation (2 seconds)
const TELEPORT_COOLDOWN_TIME = 2000; // 2 seconds cooldown
let teleportTimerText; // Text to display teleport cooldown
let inventoryText; // Text to display inventory items
let mathPuzzle; // Math puzzle instance
let victoryScreen; // Victory screen instance

// Preload game assets
function preload() {
    // Load the math puzzle script
    this.load.script('mathPuzzle', './mathPuzzle.js');
    
    // Load the victory screen script
    this.load.script('victoryScreen', './victoryScreen.js');
    
    this.load.image('player', './assets/images/player.png');
    this.load.image('ground', './assets/images/platform.png');
    this.load.image('sky', './assets/images/background.png');
    this.load.image('projectile', './assets/images/ender_pearl.png');
    this.load.image('dragon', './assets/images/dragon.png');
    this.load.image('tower', './assets/images/tower.png');
    this.load.image('ender_crystal', './assets/images/ender_crystal.webp');
    this.load.image('ender_pearl', './assets/images/ender_pearl.png');
}

// Create game objects
function create() {
    // Set world bounds
    this.physics.world.setBounds(0, 0, worldWidth, window.innerHeight);
    
    // Add sky background - make it as wide as the world
    this.add.tileSprite(0, 0, worldWidth, window.innerHeight, 'sky')
        .setOrigin(0, 0)
        .setScrollFactor(0.3); // Parallax effect

    // Initialize math puzzle system
    mathPuzzle = new MathPuzzle(this);
    
    // Initialize victory screen
    victoryScreen = new VictoryScreen(this);

    // Create the dragon at a random position in the world
    const randomXPosition = Phaser.Math.Between(100, worldWidth - 100);
    dragon = this.physics.add.sprite(randomXPosition, 100, 'dragon');
    dragon.setScale(0.2);
    dragon.setVelocityX(150);
    dragon.body.setAllowGravity(false);
    dragon.setCollideWorldBounds(false);
    dragon.health = 10; // Add health to the dragon
    dragon.maxHealth = 10; // Maximum health of the dragon
    dragon.fireTimer = 0; // Timer for dragon's fire breathing
    dragon.setOrigin(0.5);
    dragon.invincible = true; // Make dragon invincible until all towers are destroyed
    
    // Print dragon status to console for debugging
    console.log('Dragon initialized with invincible =', dragon.invincible);

    // DEBUG: Add visual indicator for dragon direction
    directionIndicator = this.add.text(dragon.x, dragon.y - 30, "→", { fontSize: '32px', fill: '#ff0' });
    
    // Create platforms group
    platforms = this.physics.add.staticGroup();
    
    // Create ground that spans the entire world width
    platforms.create(worldWidth/2, window.innerHeight + 125, 'ground')
        .setScale(worldWidth/400, 1)
        .refreshBody();
    
    // Add floating platforms throughout the world
    const platformPositions = [];
    for (let i = 0; i < 20; i++) {
        const x = worldWidth * (i / 20) + 400 + Math.random() * 300;
        const y = window.innerHeight * (0.3 + Math.random() * 0.5);
        const platform = platforms.create(x, y, 'ground')
            .setScale(0.2, 0.2)
            .refreshBody();
        platformPositions.push({ x, y, platform });
    }
    
    // Create towers on random platforms (10 towers)
    this.towerGroup = this.physics.add.group();
    const numTowers = 2;
    totalTowers = numTowers;
    
    // Select random platforms to place towers on
    const selectedPlatforms = Phaser.Utils.Array.Shuffle(platformPositions).slice(0, numTowers);
    
    // Place towers on selected platforms
    selectedPlatforms.forEach(platformPos => {
        const tower = this.towerGroup.create(
            platformPos.x, 
            platformPos.y - 40, 
            'tower'
        );
        tower.setScale(0.15);
        tower.setOrigin(0.5, 1);
        tower.setImmovable(true);
        tower.body.setAllowGravity(false);
        towers.push(tower);
    });

    // Create player
    player = this.physics.add.sprite(100, window.innerHeight - 400, 'player');
    player.setBounce(0.1);
    player.setCollideWorldBounds(true);
    player.setScale(0.1);
    
    // Set up collision between player and platforms
    this.physics.add.collider(player, platforms);

    // Projectiles group
    this.projectiles = this.physics.add.group();
    
    // Dragon fire group
    this.dragonFire = this.physics.add.group();
    
    // Add collision between projectiles and dragon
    this.physics.add.overlap(this.projectiles, dragon, hitDragon, null, this);
    
    // Add collision between player and dragon fire
    this.physics.add.overlap(player, this.dragonFire, hitByDragonFire, null, this);
    
    // Add collision between projectiles and towers
    this.physics.add.overlap(this.projectiles, this.towerGroup, hitTower, null, this);
    
    // Set up camera to follow player
    this.cameras.main.setBounds(0, 0, worldWidth, window.innerHeight);
    this.cameras.main.startFollow(player, true, 0.1, 0.1);
    
    // UI elements - make them stick to the camera
    scoreText = this.add.text(16, 16, 'Score: 0', { 
        fontSize: '24px', 
        fill: '#fff',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Health text and bar for player
    healthText = this.add.text(16, 50, 'Player Health: 100', { 
        fontSize: '24px', 
        fill: '#fff',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Create improved player health bar that sticks to camera
    healthBarBackground = this.add.rectangle(200, 64, 200, 20, 0x222222).setScrollFactor(0);
    healthBarBackground.setStrokeStyle(2, 0xffffff);
    healthBarBackground.setOrigin(-0.2, 0.5);
    
    healthBar = this.add.rectangle(200, 64, 200, 20, 0x00ff00).setScrollFactor(0);
    healthBar.setOrigin(-0.2, 0.5);
    
    // Create dragon health UI elements
    dragonHealthText = this.add.text(this.cameras.main.width - 220, 16, 'Dragon Health: 10', { 
        fontSize: '24px', 
        fill: '#ff5555',
        fontFamily: 'Arial',
        fontWeight: 'bold'
    }).setScrollFactor(0);
    
    // Create dragon health bar that sticks to top of screen
    dragonHealthBarBackground = this.add.rectangle(this.cameras.main.width - 400, 40, 200, 20, 0x222222).setScrollFactor(0);
    dragonHealthBarBackground.setStrokeStyle(2, 0xffffff);
    dragonHealthBarBackground.setOrigin(0.2, 0.5);
    
    dragonHealthBar = this.add.rectangle(this.cameras.main.width - 400, 40, 200, 20, 0xff3333).setScrollFactor(0);
    dragonHealthBar.setOrigin(0.2, 0.5);
    
    // Show "INVINCIBLE" text if dragon is currently invincible
    if (dragon.invincible) {
        const invincibleLabel = this.add.text(this.cameras.main.width - 300, 70, "INVINCIBLE", { 
            fontSize: '18px', 
            fill: '#ffff00',
            fontFamily: 'Arial',
            fontStyle: 'italic'
        }).setScrollFactor(0);
        
        // Make it pulse to draw attention
        this.tweens.add({
            targets: invincibleLabel,
            alpha: 0.5,
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
    
    // Towers counter
    towersText = this.add.text(16, 118, `Towers: ${towers.filter(t => t.active).length}/${totalTowers}`, { 
        fontSize: '24px', 
        fill: '#ff0',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Create minimap in the bottom left
    createMinimap.call(this);
    
    // Keyboard controls
    cursors = this.input.keyboard.createCursorKeys();
    
    // Attack key - Space bar
    attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Teleport key - Shift
    teleportKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    
    // Inventory display
    inventoryText = this.add.text(16, 152, '', { 
        fontSize: '24px', 
        fill: '#00ffff',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Teleport cooldown timer display
    teleportTimerText = this.add.text(16, 186, '', { 
        fontSize: '24px', 
        fill: '#ff00ff',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    updateInventoryDisplay();
}

// Game loop
function update(time, delta) {
    // Don't update game logic if game is over
    if (gameOver) {
        return;
    }
    
    // Don't process player movement if math puzzle is active
    if (mathPuzzle && mathPuzzle.isActive) {
        return;
    }

    // Check if all towers are destroyed and make dragon vulnerable
    const activeTowers = towers.filter(t => t.active).length;
    if (activeTowers === 0 && dragon.invincible) {
        dragon.invincible = false;
        // Add a visual effect or notification that dragon is now vulnerable
        const notification = this.add.text(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 3, 
            "DRAGON IS VULNERABLE!", 
            { fontSize: '36px', fill: '#ff0', fontFamily: 'Arial' }
        )
        .setOrigin(0.5)
        .setScrollFactor(0);
        
        // Fade out the notification after 3 seconds
        this.tweens.add({
            targets: notification,
            alpha: 0,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
        
        // Update any "INVINCIBLE" text elements that might be showing
        this.children.list.forEach(child => {
            if (child.type === 'Text' && child.text === 'INVINCIBLE') {
                this.tweens.add({
                    targets: child,
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => child.destroy()
                });
            }
        });
    }
    
    // Player movement
    if (cursors.left.isDown) {
        player.setVelocityX(-300);
        player.setFlipX(true);
    }
    else if (cursors.right.isDown) {
        player.setVelocityX(300);
        player.setFlipX(false);
    }
    else {
        player.setVelocityX(0);
    }

    // Jump when up arrow is pressed and player is on the ground
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-550);
    }
    
    // Update health bar width based on health
    healthBar.width = (playerHealth / 100) * 200;
    
    // Update dragon health bar if dragon is active
    if (dragon && dragon.active) {
        dragonHealthBar.width = (dragon.health / dragon.maxHealth) * 200;
        dragonHealthText.setText(`Dragon Health: ${dragon.health}`);
        
        // Update dragon health bar color based on health percentage
        const healthPercent = dragon.health / dragon.maxHealth;
        if (healthPercent < 0.3) {
            dragonHealthBar.fillColor = 0xff0000; // Red when low health
        } else if (healthPercent < 0.6) {
            dragonHealthBar.fillColor = 0xff9900; // Orange when medium health
        } else {
            dragonHealthBar.fillColor = 0xff3333; // Normal color otherwise
        }
    }
    
    // Attack when space is pressed
    if (attackKey.isDown && !attackCooldown) {
        attack(this);
    }
    
    // Make dragon follow player - only process if dragon is visible and within a reasonable distance
    if (dragon.active && dragon.visible) {
        // Calculate direction from dragon to player
        const directionX = player.x - dragon.x;
        const directionY = player.y - dragon.y;
        
        // Calculate distance
        const distance = Math.sqrt(directionX * directionX + directionY * directionY);
        
        // Only process dragon AI if within reasonable distance
        if (distance < 800) {
            // Normalize direction
            const normalizedX = directionX / distance;
            const normalizedY = directionY / distance;
            
            // Set dragon velocity to move toward player
            const dragonSpeed = 180;
            dragon.setVelocity(
                normalizedX * dragonSpeed,
                normalizedY * dragonSpeed
            );
            
            // Update dragon's facing direction based on movement
            if (dragon.body.velocity.x > 0) {
                dragon.flipX = false;
                dragon.scaleX = Math.abs(dragon.scaleX);
                directionIndicator.setText("→");
            } else {
                dragon.flipX = true;
                dragon.scaleX = -Math.abs(dragon.scaleX);
                directionIndicator.setText("←");
            }
            
            // Update direction indicator position to follow dragon
            directionIndicator.x = dragon.x;
            directionIndicator.y = dragon.y - 30;
            
            // Dragon fire breathing logic - only if close enough to player
            if (distance < 500) {
                dragon.fireTimer += delta;
                // Breathe fire every 3 seconds
                if (dragon.fireTimer > 3000) {
                    dragonBreatheFire.call(this);
                    dragon.fireTimer = 0;
                }
            }
        }
    }
    
    // Update towers text - only if visible
    if (towersText.visible) {
        towersText.setText(`Towers: ${towers.filter(t => t.active).length}/${totalTowers}`);
    }
    
    // Update minimap - only update every 5 frames for performance
    if (time % 5 < 1) {
        updateMinimap.call(this);
    }

    // Update teleport cooldown timer
    if (teleportCooldown) {
        teleportCooldownTimer += delta;
        const remainingTime = Math.max(0, Math.ceil((TELEPORT_COOLDOWN_TIME - teleportCooldownTimer) / 1000));
        teleportTimerText.setText(`Teleport: ${remainingTime}s`);
        
        // Reset cooldown when time is up
        if (teleportCooldownTimer >= TELEPORT_COOLDOWN_TIME) {
            teleportCooldown = false;
            teleportCooldownTimer = 0;
            teleportTimerText.setText('');
        }
    }

    // Check for teleport key press
    if (teleportKey.isDown && !teleportCooldown) {
        teleportPlayer(this);
    }
}

// Function to update inventory display
function updateInventoryDisplay() {
    let inventoryItems = [
        "Ender Crystal (SPACE)", 
        "Ender Pearl (SHIFT)"
    ];
    
    inventoryText.setText(inventoryItems.join(' | '));
}

// Attack function - throws Ender Crystal
function attack(scene) {
    if (attackCooldown) {
        return; // Still in cooldown, don't attack
    }
    
    isAttacking = true;
    attackCooldown = true;
    
    // Create a projectile (ender crystal)
    const projectile = scene.projectiles.create(player.x, player.y, 'ender_crystal');
    projectile.setScale(0.2);
    projectile.body.setAllowGravity(false);
    
    // Ensure this data flag is properly set to true
    projectile.setData('isEnderCrystal', true);
    
    // Set projectile velocity based on player facing direction
    // Use player's flipX property to determine direction instead of velocity
    const direction = player.flipX ? -1 : 1;
    projectile.setVelocityX(direction * 600);
    projectile.setVelocityY(-150);
    
    // Add a glow effect with fewer particles
    const particles = scene.add.particles('ender_crystal');
    const emitter = particles.createEmitter({
        scale: { start: 0.1, end: 0.02 },
        alpha: { start: 0.5, end: 0 },
        speed: 20,
        lifespan: 500,
        blendMode: 'ADD',
        follow: projectile,
        frequency: 50,  // Emit less frequently
        quantity: 1     // Emit fewer particles
    });
    
    // Destroy projectile after 2 seconds instead of 3
    scene.time.delayedCall(2000, () => {
        if (projectile.active) {
            particles.destroy();
            projectile.destroy();
        }
    });
    
    // Reset attack cooldown after 500ms
    scene.time.delayedCall(500, () => {
        attackCooldown = false;
        isAttacking = false;
    });
}

// Teleport player function - uses Ender Pearl
function teleportPlayer(scene) {
    if (teleportCooldown) {
        // Show message that teleport is on cooldown
        const cooldownText = scene.add.text(
            player.x, 
            player.y - 50, 
            "Teleport on cooldown!", 
            { fontSize: '16px', fill: '#ff77ff', fontFamily: 'Arial' }
        ).setOrigin(0.5);
        
        // Make the text rise and fade out
        scene.tweens.add({
            targets: cooldownText,
            y: player.y - 100,
            alpha: 0,
            duration: 1000,
            onComplete: () => cooldownText.destroy()
        });
        
        return;
    }
    
    // Show math puzzle before teleporting
    mathPuzzle.show(
        // On correct answer
        () => {
            // Set cooldown
            teleportCooldown = true;
            teleportCooldownTimer = 0;
            teleportTimerText.setText(`Teleport: 2s`);
            
            // Create teleportation effect at current position
            createTeleportEffect(scene, player.x, player.y);
            
            // Find the nearest tower or dragon to teleport to
            const activeTowers = towers.filter(t => t.active);
            
            let targetX, targetY;
            
            if (activeTowers.length > 0) {
                // Find the nearest tower
                let nearestTower = activeTowers[0];
                let shortestDistance = Phaser.Math.Distance.Between(
                    player.x, player.y, nearestTower.x, nearestTower.y
                );
                
                activeTowers.forEach(tower => {
                    const distance = Phaser.Math.Distance.Between(
                        player.x, player.y, tower.x, tower.y
                    );
                    
                    if (distance < shortestDistance) {
                        shortestDistance = distance;
                        nearestTower = tower;
                    }
                });
                
                // Set teleport position near the tower
                targetX = nearestTower.x;
                targetY = nearestTower.y - 100; // Teleport above the tower
            } else {
                // If no towers left, teleport near the dragon
                targetX = dragon.x + Phaser.Math.Between(-100, 100);
                targetY = dragon.y + 100; // Teleport below the dragon
            }
            
            // Create flash effect
            const flash = scene.add.rectangle(0, 0, game.config.width*2, game.config.height*2, 0xaaaaff, 0.3)
                .setScrollFactor(0)
                .setDepth(100);
            
            // Flash and teleport
            scene.tweens.add({
                targets: flash,
                alpha: 0,
                duration: 200,
                onComplete: () => {
                    // Teleport player
                    player.x = targetX;
                    player.y = targetY;
                    
                    // Create teleport arrival effect
                    createTeleportEffect(scene, player.x, player.y);
                    
                    // Remove flash
                    flash.destroy();
                }
            });
        },
        // On wrong answer - small penalty
        () => {
            // Small score penalty for wrong answer
            score = Math.max(0, score - 5);
            scoreText.setText('Score: ' + score);
            
            // Show penalty message
            const penaltyText = scene.add.text(
                window.innerWidth / 2,
                window.innerHeight / 2 + 170,
                "-5 points",
                { fontSize: '20px', fill: '#ff5555', fontFamily: 'Arial' }
            ).setOrigin(0.5).setScrollFactor(0).setDepth(201);
            
            // Fade out the penalty message
            scene.tweens.add({
                targets: penaltyText,
                alpha: 0,
                duration: 1000,
                delay: 1000,
                onComplete: () => penaltyText.destroy()
            });
        }
    );
}

// Create teleport effect with fewer particles
function createTeleportEffect(scene, x, y) {
    // Create particles
    const particles = scene.add.particles('ender_pearl');
    const emitter = particles.createEmitter({
        x: x,
        y: y,
        speed: { min: 50, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.1, end: 0.01 },
        alpha: { start: 1, end: 0 },
        tint: [0xaa00ff, 0x00ffff, 0x00aaff],
        blendMode: 'ADD',
        lifespan: 800,
        quantity: 20,     // Reduced from 40
        maxParticles: 20  // Add max limit
    });
    
    // Auto-destroy after effect completes
    scene.time.delayedCall(800, () => {
        particles.destroy();
    });
}

// Function to damage player with improved UI feedback
function damagePlayer(amount) {
    playerHealth -= amount;
    if (playerHealth <= 0) {
        playerHealth = 0;
        displayGameOver();
    }
    healthText.setText(`Player Health: ${playerHealth}`);
    
    // Visual feedback on health bar
    if (playerHealth < 30) {
        healthBar.fillColor = 0xff0000; // Red when low health
    } else if (playerHealth < 60) {
        healthBar.fillColor = 0xff9900; // Orange when medium health
    } else {
        healthBar.fillColor = 0x00ff00; // Green when high health
    }
    
    // Add a pulse animation to the health bar when damaged
    const originalWidth = healthBar.width;
    const scene = healthBar.scene;
    scene.tweens.add({
        targets: healthBar,
        scaleX: 1.05,
        scaleY: 1.2,
        duration: 100,
        yoyo: true,
        onComplete: function() {
            healthBar.setScale(1);
        }
    });
}

// Function to display game over screen
function displayGameOver() {
    if (gameOver) return; // Prevent multiple calls
    
    gameOver = true;
    
    // Create semi-transparent overlay
    const overlay = game.scene.scenes[0].add.rectangle(
        0, 0,
        game.config.width, game.config.height,
        0x000000, 0.7
    ).setOrigin(0, 0)
     .setScrollFactor(0)
     .setDepth(100);
    
    // Game over text
    gameOverText = game.scene.scenes[0].add.text(
        game.config.width / 2,
        game.config.height / 2 - 50,
        'GAME OVER',
        { 
            fontSize: '64px', 
            fontFamily: 'Arial', 
            fill: '#ff0000',
            fontStyle: 'bold'
        }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setDepth(101);
    
    // Final score
    const finalScoreText = game.scene.scenes[0].add.text(
        game.config.width / 2,
        game.config.height / 2 + 20,
        `Final Score: ${score}`,
        { 
            fontSize: '32px', 
            fontFamily: 'Arial', 
            fill: '#ffffff' 
        }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setDepth(101);
    
    // Restart button
    const restartButton = game.scene.scenes[0].add.text(
        game.config.width / 2,
        game.config.height / 2 + 100,
        'Click to Restart',
        { 
            fontSize: '24px', 
            fontFamily: 'Arial', 
            fill: '#00ff00' 
        }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setDepth(101)
     .setInteractive({ useHandCursor: true });
    
    // Add hover effect
    restartButton.on('pointerover', () => {
        restartButton.setStyle({ fill: '#88ff88' });
    });
    
    restartButton.on('pointerout', () => {
        restartButton.setStyle({ fill: '#00ff00' });
    });
    
    // Add click event to restart the game
    restartButton.on('pointerdown', () => {
        restartGame();
    });
    
    // Disable player movement
    if (player && player.body) {
        player.body.moves = false;
    }
}

// Function to restart the game
function restartGame() {
    // Reset game state
    gameOver = false;
    score = 0;
    playerHealth = 100;
    teleportCooldown = false;
    teleportCooldownTimer = 0;
    
    // Resume physics if paused
    if (game.scene.scenes[0].physics.world.isPaused) {
        game.scene.scenes[0].physics.resume();
    }
    
    // Restart the current scene
    game.scene.scenes[0].scene.restart();
}

// Make restartGame available globally
window.restartGame = restartGame;

// Function to handle tower being hit by projectile
function hitTower(tower, projectile) {
    // Check if the projectile is an ender crystal
    const isEnderCrystal = projectile.getData('isEnderCrystal');
    
    // Destroy the projectile
    projectile.destroy();
    
    // Only proceed if it was an ender crystal
    if (!isEnderCrystal) {
        return;
    }
    
    // Show math puzzle before destroying the tower
    mathPuzzle.show(
        // On correct answer
        () => {
            // Destroy the tower with effects
            createTowerDestructionEffect(this, tower.x, tower.y);
            
            // Deactivate the tower
            tower.setActive(false);
            tower.setVisible(false);
            
            // Also update the minimap marker for this tower
            const towerEntity = minimapEntities.find(
                entity => entity.type === 'tower' && entity.gameObject === tower
            );
            if (towerEntity) {
                towerEntity.marker.setVisible(false);
            }
            
            // Increase score
            score += 50;
            scoreText.setText('Score: ' + score);
            
            // Check if all towers are destroyed
            const remainingTowers = towers.filter(t => t.active).length;
            if (remainingTowers === 0) {
                dragon.invincible = false; // Make dragon vulnerable when all towers are destroyed
                
                // Add a visual effect or notification that dragon is now vulnerable
                const notification = this.add.text(
                    this.cameras.main.width / 2, 
                    this.cameras.main.height / 3, 
                    "DRAGON IS VULNERABLE!", 
                    { fontSize: '36px', fill: '#ff0', fontFamily: 'Arial' }
                )
                .setOrigin(0.5)
                .setScrollFactor(0);
                
                // Fade out the notification after 3 seconds
                this.tweens.add({
                    targets: notification,
                    alpha: 0,
                    duration: 3000,
                    ease: 'Power2',
                    onComplete: () => notification.destroy()
                });
                
                // Update any "INVINCIBLE" text elements that might be showing
                this.children.list.forEach(child => {
                    if (child.type === 'Text' && child.text === 'INVINCIBLE') {
                        this.tweens.add({
                            targets: child,
                            alpha: 0,
                            duration: 1000,
                            onComplete: () => child.destroy()
                        });
                    }
                });
            }
        },
        // On wrong answer
        () => {
            // Tower remains intact
            const failText = this.add.text(
                tower.x,
                tower.y - 50,
                "Tower Protected!",
                { fontSize: '18px', fill: '#ff5555', fontFamily: 'Arial' }
            ).setOrigin(0.5);
            
            // Fade out the notification
            this.tweens.add({
                targets: failText,
                y: tower.y - 100,
                alpha: 0,
                duration: 1500,
                onComplete: () => failText.destroy()
            });
            
            // Small score penalty
            score = Math.max(0, score - 10);
            scoreText.setText('Score: ' + score);
        }
    );
}

// Function to create tower destruction effect with fewer particles
function createTowerDestructionEffect(scene, x, y) {
    // Create explosion particles
    const particles = scene.add.particles('projectile');
    const emitter = particles.createEmitter({
        x: x,
        y: y,
        speed: { min: 50, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.1, end: 0.01 },
        alpha: { start: 0.8, end: 0 },
        tint: [0x885500, 0x774400, 0x663300], // Brown tints
        blendMode: 'ADD',
        lifespan: 800,
        quantity: 15,      // Reduced from 30
        maxParticles: 15   // Add max limit
    });
    
    // Auto-destroy the particle emitter after it's done
    scene.time.delayedCall(800, () => {
        particles.destroy();
    });
}

// Function to handle dragon being hit by projectile
function hitDragon(dragon, projectile) {
    // Determine if it's an ender crystal
    const isEnderCrystal = projectile.getData('isEnderCrystal');
    
    // Debug information
    console.log('Hit dragon with projectile:', {
        isEnderCrystal: isEnderCrystal,
        dragonInvincible: dragon.invincible,
        activeTowers: towers.filter(t => t.active).length
    });
    
    // Destroy the projectile
    projectile.destroy();
    
    // If dragon is invincible, show message and return
    if (dragon.invincible) {
        // Create a floating text effect
        const invincibleText = this.add.text(
            dragon.x, 
            dragon.y - 50, 
            "INVINCIBLE!", 
            { fontSize: '24px', fill: '#ff0', fontFamily: 'Arial' }
        );
        
        // Make the text rise and fade out
        this.tweens.add({
            targets: invincibleText,
            y: dragon.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: () => invincibleText.destroy()
        });
        
        return;
    }
    
    // Only ender crystal can damage the dragon
    if (!isEnderCrystal) {
        // Show message that regular projectiles can't hurt dragon
        const ineffectiveText = this.add.text(
            dragon.x, 
            dragon.y - 50, 
            "NEED ENDER CRYSTAL!", 
            { fontSize: '24px', fill: '#ff8888', fontFamily: 'Arial' }
        );
        
        // Make the text rise and fade out
        this.tweens.add({
            targets: ineffectiveText,
            y: dragon.y - 100,
            alpha: 0,
            duration: 1500,
            onComplete: () => ineffectiveText.destroy()
        });
        
        return;
    }
    
    // Decrease dragon health
    dragon.health -= 1;
    
    // Flash the dragon red
    dragon.setTint(0xff0000);
    setTimeout(() => {
        dragon.clearTint();
    }, 200);
    
    // Update dragon health display with animation
    if (dragonHealthBar) {
        const scene = dragonHealthBar.scene;
        scene.tweens.add({
            targets: dragonHealthBar,
            scaleY: 1.3,
            duration: 100,
            yoyo: true,
            onComplete: function() {
                dragonHealthBar.setScale(1);
            }
        });
    }
    
    // Increase score
    score += 10;
    scoreText.setText('Score: ' + score);
    
    // Special effects on hit
    createDragonHitEffect(this, dragon.x, dragon.y);
    
    // Show damage number
    const damageText = this.add.text(
        dragon.x + Phaser.Math.Between(-20, 20), 
        dragon.y, 
        "-1", 
        { fontSize: '24px', fill: '#ff0000', fontFamily: 'Arial', fontWeight: 'bold' }
    );
    
    // Make damage text float up and fade out
    this.tweens.add({
        targets: damageText,
        y: dragon.y - 60,
        alpha: 0,
        duration: 1000,
        onComplete: () => damageText.destroy()
    });
    
    // If dragon is defeated, respawn it after a delay
    if (dragon.health <= 0) {
        // Create explosion effect
        const explosion = this.add.particles('ender_crystal');
        const emitter = explosion.createEmitter({
            x: dragon.x,
            y: dragon.y,
            speed: { min: 100, max: 200 },
            angle: { min: 0, max: 360 },
            scale: { start: 0.2, end: 0.02 },
            alpha: { start: 1, end: 0 },
            tint: [0xffff00, 0xff8800, 0xff0000],
            blendMode: 'ADD',
            lifespan: 1500,
            quantity: 50
        });
        
        // Auto-destroy after effect completes
        this.time.delayedCall(1500, () => {
            explosion.destroy();
        });
        
        // Hide the dragon
        dragon.setVisible(false);
        dragon.setActive(false);
        
        // Hide dragon health UI when dragon is defeated
        dragonHealthText.setVisible(false);
        dragonHealthBar.setVisible(false);
        dragonHealthBarBackground.setVisible(false);
        
        // Add big score bonus for defeating dragon
        score += 100;
        scoreText.setText('Score: ' + score);
        
        // Show victory screen
        victoryScreen.show(score);
        
        // Pause game physics while victory screen is showing
        this.physics.pause();
        
        // Respawn after 5 seconds and resume if player chooses to continue
        setTimeout(() => {
            // Only respawn if not already on game over screen
            if (!gameOver) {
                // Reset dragon position and health to a random location
                const randomXPosition = Phaser.Math.Between(100, worldWidth - 100);
                dragon.x = randomXPosition;
                dragon.y = 100;
                dragon.health = dragon.maxHealth;
                dragon.setVisible(true);
                dragon.setActive(true);
                
                // Make dragon health UI visible again
                dragonHealthText.setVisible(true);
                dragonHealthBar.setVisible(true);
                dragonHealthBarBackground.setVisible(true);
                dragonHealthBar.width = 200; // Reset health bar width
                dragonHealthBar.fillColor = 0xff3333; // Reset health bar color
                
                // If there are still towers, dragon is invincible
                dragon.invincible = towers.filter(t => t.active).length > 0;
                
                // Resume physics
                this.physics.resume();
            }
        }, 5000);
    }
}

// Create dragon hit effect with fewer particles
function createDragonHitEffect(scene, x, y) {
    // Create particles
    const particles = scene.add.particles('ender_crystal');
    const emitter = particles.createEmitter({
        x: x,
        y: y,
        speed: { min: 50, max: 150 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.15, end: 0.01 },
        alpha: { start: 0.8, end: 0 },
        tint: [0xffff00, 0xff8800],
        blendMode: 'ADD',
        lifespan: 800,     // Reduced from 1000
        quantity: 15,      // Reduced from 30
        maxParticles: 15   // Add max limit
    });
    
    // Auto-destroy after effect completes
    scene.time.delayedCall(800, () => {
        particles.destroy();
    });
}

// Function for dragon to breathe fire - optimized
function dragonBreatheFire() {
    // Create fire projectile from dragon's position using graphics instead of sprite
    const fire = this.add.graphics();
    
    // Draw fire shape with more yellowish-red colors
    fire.fillStyle(0xffcc00, 0.7); // Yellow-orange outer color with reduced alpha
    
    // Create a fire shape object to hold our graphics
    const fireObj = this.dragonFire.create(dragon.x, dragon.y + 20, null);
    fireObj.body.setAllowGravity(false);
    
    // Calculate direction toward player
    const dirX = player.x - dragon.x;
    const dirY = player.y - dragon.y;
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    
    // Normalize direction
    const normalizedX = dirX / length;
    const normalizedY = dirY / length;
    
    // Draw the flame shape - more optimized
    fire.beginPath();
    fire.moveTo(0, 0);
    fire.lineTo(-20 + normalizedX * 5, -10 + normalizedY * 5);
    fire.lineTo(0 + normalizedX * 40, 0 + normalizedY * 40);
    fire.lineTo(20 + normalizedX * 5, 10 + normalizedY * 5);
    fire.closePath();
    fire.fill();
    
    // Add particles for the fire effect with fewer particles
    const particles = this.add.particles('projectile');
    const emitter = particles.createEmitter({
        speed: 30,
        scale: { start: 0.06, end: 0.02 },
        alpha: { start: 0.7, end: 0 },  // Reduced alpha
        tint: [0xffcc00, 0xff3300],     // Fewer colors
        blendMode: 'ADD',
        lifespan: 600,                  // Reduced from 800
        quantity: 1,                    // Reduced from 2
        frequency: 100,                 // Reduced frequency (was 50)
        maxParticles: 10                // Add max limit
    });
    
    // Attach the fire graphics and particles to our game object
    fireObj.setData('graphics', fire);
    fireObj.setData('particles', particles);
    
    // Set velocity based on direction to player
    fireObj.setVelocity(
        normalizedX * 450,
        normalizedY * 450
    );
    
    // Add collision with platforms
    this.physics.add.collider(fireObj, platforms, (fire, platform) => {
        // When fire hits a platform, destroy it with a small explosion effect
        createFireExplosion(this, fire.x, fire.y);
        
        // Clean up fire
        this.events.off('update', fire.update, fire);
        fire.getData('graphics').destroy();
        fire.getData('particles').destroy();
        fire.destroy();
    });
    
    // Update the fire position as it moves
    fireObj.update = function() {
        // Update graphics position to match physics body
        fire.x = this.x;
        fire.y = this.y;
        // Update particle emitter position
        emitter.setPosition(this.x, this.y);
    };
    
    // Add update function to the scene
    this.events.on('update', fireObj.update, fireObj);
    
    // Destroy fire after 4 seconds (reduced from 5 seconds)
    this.time.delayedCall(4000, () => {
        if (fireObj && fireObj.active) {
            // Remove update listener
            this.events.off('update', fireObj.update, fireObj);
            // Destroy graphics and particles
            fire.destroy();
            particles.destroy();
            fireObj.destroy();
        }
    });
}

// Helper function to create fire explosion effect with fewer particles
function createFireExplosion(scene, x, y) {
    // Create explosion particles
    const explosionParticles = scene.add.particles('projectile');
    const explosionEmitter = explosionParticles.createEmitter({
        x: x,
        y: y,
        speed: { min: 50, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.1, end: 0.01 },
        alpha: { start: 0.7, end: 0 },    // Reduced alpha
        tint: [0xffcc00, 0xff3300],       // Fewer colors
        blendMode: 'ADD',
        lifespan: 600,                    // Reduced from 800
        quantity: 10,                     // Reduced from 20
        maxParticles: 10                  // Add max limit
    });
    
    // Auto-destroy the particle emitter after it's done
    scene.time.delayedCall(600, () => {
        explosionParticles.destroy();
    });
}

// Function to handle player being hit by dragon fire
function hitByDragonFire(player, fire) {
    // Get the graphics and particles from the fire object
    const fireGraphics = fire.getData('graphics');
    const fireParticles = fire.getData('particles');
    
    // Clean up fire effects
    if (fireGraphics) fireGraphics.destroy();
    if (fireParticles) fireParticles.destroy();
    
    // Remove the update listener
    this.events.off('update', fire.update, fire);
    
    // Destroy the fire object
    fire.destroy();
    
    // Damage player
    damagePlayer(10);
    
    // Flash player red
    player.setTint(0xff0000);
    this.time.delayedCall(200, () => {
        player.clearTint();
    });
}

// Function to create minimap
function createMinimap() {
    // Create a container for the minimap in the bottom left corner
    const minimapWidth = 200;
    const minimapHeight = 150;
    const padding = 10;
    
    // Background for minimap
    const minimapBackground = this.add.rectangle(
        padding, 
        window.innerHeight - minimapHeight - padding, 
        minimapWidth, 
        minimapHeight, 
        0x000000, 
        0.7
    ).setScrollFactor(0)
     .setOrigin(0, 0)
     .setDepth(90);
    
    // Create the minimap container
    minimap = this.add.container(
        padding + minimapWidth / 2, 
        window.innerHeight - minimapHeight - padding + minimapHeight / 2
    ).setScrollFactor(0)
     .setDepth(91);
    
    // Add border
    const minimapBorder = this.add.rectangle(
        0, 
        0, 
        minimapWidth, 
        minimapHeight, 
        0xffffff, 
        0
    ).setStrokeStyle(2, 0xffffff);
    
    minimap.add(minimapBorder);
    
    // Add labels
    const minimapLabel = this.add.text(
        0, 
        -minimapHeight/2 + 10, 
        "MINIMAP", 
        { 
            fontSize: '12px', 
            fontFamily: 'Arial', 
            fill: '#ffffff' 
        }
    ).setOrigin(0.5, 0);
    
    minimap.add(minimapLabel);
    
    // Create and add entities to the minimap
    
    // Player marker (white circle)
    const playerMarker = this.add.circle(0, 0, 4, 0xffffff);
    minimap.add(playerMarker);
    minimapEntities.push({ gameObject: player, marker: playerMarker, type: 'player' });
    
    // Dragon marker (red triangle)
    const dragonMarker = this.add.triangle(0, 0, 0, -5, 5, 5, -5, 5, 0xff0000);
    minimap.add(dragonMarker);
    minimapEntities.push({ gameObject: dragon, marker: dragonMarker, type: 'dragon' });
    
    // Tower markers (blue rectangles)
    towers.forEach(tower => {
        const towerMarker = this.add.rectangle(0, 0, 3, 5, 0x0000ff);
        minimap.add(towerMarker);
        minimapEntities.push({ gameObject: tower, marker: towerMarker, type: 'tower' });
    });
    
    // Update minimap on the first frame
    updateMinimap.call(this);
}

// Function to update minimap - optimized version
function updateMinimap() {
    if (!minimap) return;
    
    const minimapScale = 0.02; // Scale factor for converting world coordinates to minimap coordinates
    
    // Update only essential entities on the minimap (player, dragon)
    minimapEntities.forEach(entity => {
        if (entity.type !== 'player' && entity.type !== 'dragon' && 
            entity.type !== 'tower') {
            return; // Skip updating non-essential entities
        }
        
        if (!entity.gameObject.active) {
            // If game object is inactive, hide its marker
            entity.marker.setVisible(false);
            return;
        }
        
        // Only update visible entities
        if (entity.marker.visible) {
            // Calculate position on minimap
            const x = (entity.gameObject.x - this.cameras.main.worldView.x) * minimapScale;
            const y = (entity.gameObject.y - this.cameras.main.worldView.y) * minimapScale;
            
            // Clamp position to minimap boundaries
            const clampedX = Phaser.Math.Clamp(x, -90, 90);
            const clampedY = Phaser.Math.Clamp(y, -70, 70);
            
            entity.marker.setPosition(clampedX, clampedY);
        }
    });
}