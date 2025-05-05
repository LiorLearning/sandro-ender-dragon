import { updateInventoryDisplay } from './ui.js';
import { createMinimap } from './minimap.js';

// Create game objects
function create() {
    // Set world bounds
    this.physics.world.setBounds(0, 0, window.worldWidth, window.innerHeight);
    
    // Add sky background - make it as wide as the world
    this.add.tileSprite(0, 0, window.worldWidth, window.innerHeight, 'sky')
        .setOrigin(0, 0)
        .setScrollFactor(0.3); // Parallax effect

    // Create the dragon at a random position in the world
    const randomXPosition = Phaser.Math.Between(100, window.worldWidth - 100);
    window.dragon = this.physics.add.sprite(randomXPosition, 100, 'dragon');
    window.dragon.setScale(0.2);
    window.dragon.setVelocityX(150);
    window.dragon.body.setAllowGravity(false);
    window.dragon.setCollideWorldBounds(false);
    window.dragon.health = 10; // Add health to the dragon
    window.dragon.maxHealth = 10; // Store max health for the health bar
    window.dragon.fireTimer = 0; // Timer for dragon's fire breathing
    window.dragon.setOrigin(0.5);
    window.dragon.invincible = true; // Make dragon invincible until all towers are destroyed
    console.log("Dragon created and set to invincible until all towers are destroyed");

    // DEBUG: Add visual indicator for dragon direction
    window.directionIndicator = this.add.text(window.dragon.x, window.dragon.y - 30, "→", { fontSize: '32px', fill: '#ff0' });
    
    // Create platforms group
    window.platforms = this.physics.add.staticGroup();
    
    // Create ground that spans the entire world width
    window.platforms.create(window.worldWidth/2, window.innerHeight-32, 'ground')
        .setScale(window.worldWidth/400, 1)
        .refreshBody();
    
    // Add floating platforms throughout the world (starting farther from the player)
    const platformPositions = [];
    for (let i = 0; i < 20; i++) {
        // Start platforms farther from player's initial position (which is at x=100)
        const x = (i === 0) ? 400 : window.worldWidth * (i / 20) + Math.random() * 300;
        const y = window.innerHeight * (0.3 + Math.random() * 0.5);
        const platform = window.platforms.create(x, y, 'ground')
            .setScale(0.2, 0.2)
            .refreshBody();
        platformPositions.push({ x, y, platform });
    }
    
    // Create 10 towers on random platforms
    this.towerGroup = this.physics.add.group();
    const numTowers = 10;
    window.totalTowers = numTowers;
    
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
        window.towers.push(tower);
    });

    // Create player
    window.player = this.physics.add.sprite(100, window.innerHeight - 400, 'player');
    window.player.setBounce(0.1);
    window.player.setCollideWorldBounds(true);
    window.player.setScale(0.1);
    
    // Set up collision between player and platforms
    this.physics.add.collider(window.player, window.platforms);

    // Projectiles group
    this.projectiles = this.physics.add.group();
    
    // Dragon fire group
    this.dragonFire = this.physics.add.group();
    
    // Add collision between projectiles and dragon
    this.physics.add.overlap(this.projectiles, window.dragon, hitDragon, null, this);
    
    // Add collision between player and dragon fire
    this.physics.add.overlap(window.player, this.dragonFire, hitByDragonFire, null, this);
    
    // Add collision between projectiles and towers
    this.physics.add.overlap(
        this.projectiles, 
        this.towerGroup, 
        hitTower, 
        (projectile, tower) => {
            // Only allow collision if both objects are active
            return projectile.active && tower.active;
        }, 
        this
    );
    
    // Set up camera to follow player
    this.cameras.main.setBounds(0, 0, window.worldWidth, window.innerHeight);
    this.cameras.main.startFollow(window.player, true, 0.1, 0.1);
    
    // UI elements - make them stick to the camera
    window.scoreText = this.add.text(16, 16, 'Score: 0', { 
        fontSize: '24px', 
        fill: '#fff',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Health text and bar
    window.healthText = this.add.text(16, 50, 'Health: 100', { 
        fontSize: '24px', 
        fill: '#fff',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Towers counter
    window.towersText = this.add.text(16, 84, `Towers: ${window.towers.filter(t => t.active).length}/${window.totalTowers}`, { 
        fontSize: '24px', 
        fill: '#ff0',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Create health bar that sticks to camera
    const barBackground = this.add.rectangle(200, 64, 200, 16, 0x000000).setScrollFactor(0);
    barBackground.setOrigin(0, 0.5);
    window.healthBar = this.add.rectangle(200, 64, 200, 16, 0xff0000).setScrollFactor(0);
    window.healthBar.setOrigin(0, 0.5);

    // Create minimap in the bottom left
    createMinimap.call(this);

    // Keyboard controls
    window.cursors = this.input.keyboard.createCursorKeys();
    
    // Attack key - Space bar
    window.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Teleport key - Shift
    window.teleportKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    
    // Inventory display
    window.inventoryText = this.add.text(16, 118, '', { 
        fontSize: '24px', 
        fill: '#00ffff',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Teleport cooldown timer display
    window.teleportTimerText = this.add.text(16, 152, '', { 
        fontSize: '24px', 
        fill: '#ff00ff',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Dragon health bar and text (initially hidden)
    window.dragonHealthText = this.add.text(16, 186, 'Dragon: 10/10', { 
        fontSize: '24px', 
        fill: '#ff5555',
        fontFamily: 'Arial'
    }).setScrollFactor(0).setVisible(false);
    
    const dragonBarBackground = this.add.rectangle(200, 186, 200, 16, 0x000000).setScrollFactor(0).setVisible(false);
    dragonBarBackground.setOrigin(0, 0.5);
    window.dragonHealthBar = this.add.rectangle(200, 186, 200, 16, 0xff5555).setScrollFactor(0).setVisible(false);
    window.dragonHealthBar.setOrigin(0, 0.5);
    
    // Store reference to dragon bar background for toggling visibility
    window.dragonHealthBar.background = dragonBarBackground;
    
    updateInventoryDisplay();
}

// Function to handle tower being hit by projectile
function hitTower(projectile, tower) {
    // Check if the projectile is an ender crystal
    const isEnderCrystal = projectile.getData('isEnderCrystal');
    
    // Immediately return if the projectile is not valid
    if (!isEnderCrystal || !projectile.active || !tower.active) {
        return;
    }
    
    // Get the scene
    const scene = projectile.scene;
    
    console.log("Tower hit! Destroying tower...");
    
    // Create destruction effect
    createTowerDestructionEffect(scene, tower.x, tower.y);
    
    // Completely deactivate tower
    tower.setActive(false);
    tower.setVisible(false);
    
    // Disable physics body
    if (tower.body) {
        if (typeof tower.body.enable !== 'undefined') {
            tower.body.enable = false;
        }
        // Force removal from physics world
        tower.body.checkCollision.none = true;
    }
    
    // Update the minimap marker
    const towerEntity = window.minimapEntities.find(
        entity => entity.type === 'tower' && entity.gameObject === tower
    );
    if (towerEntity) {
        towerEntity.marker.setVisible(false);
    }
    
    // Increase score
    window.score += 50;
    window.scoreText.setText('Score: ' + window.score);
    
    // Destroy the projectile
    projectile.destroy();
    
    // Check if all towers are destroyed
    const remainingTowers = window.towers.filter(t => t.active).length;
    window.towersText.setText(`Towers: ${remainingTowers}/${window.totalTowers}`);
    
    console.log(`Remaining towers: ${remainingTowers}. Dragon invincible: ${window.dragon.invincible}`);
    
    if (remainingTowers === 0) {
        console.log("All towers destroyed! Making dragon vulnerable!");
        window.dragon.invincible = false; // Make dragon vulnerable when all towers are destroyed
        
        // Show dragon health bar when it becomes vulnerable
        window.dragonHealthText.setVisible(true);
        window.dragonHealthBar.setVisible(true);
        window.dragonHealthBar.background.setVisible(true);
        
        // Update dragon health bar
        updateDragonHealthBar();
        
        // Add a visual effect or notification that dragon is now vulnerable
        const notification = scene.add.text(
            scene.cameras.main.width / 2, 
            scene.cameras.main.height / 3, 
            "DRAGON IS VULNERABLE!", 
            { fontSize: '36px', fill: '#ff0', fontFamily: 'Arial', backgroundColor: '#880000', padding: { x: 20, y: 10 } }
        )
        .setOrigin(0.5)
        .setScrollFactor(0);
        
        // Make the text pulse to attract attention
        scene.tweens.add({
            targets: notification,
            scale: 1.2,
            duration: 500,
            yoyo: true,
            repeat: 5,
            ease: 'Sine.easeInOut'
        });
        
        // Change dragon tint to indicate it's now vulnerable
        window.dragon.setTint(0xff7777);
        
        // Fade out the notification after 5 seconds (longer to ensure visibility)
        scene.tweens.add({
            targets: notification,
            alpha: 0,
            delay: 3000,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => notification.destroy()
        });
    }
}

// Function to create tower hit effect (smaller than destruction)
function createTowerHitEffect(scene, x, y) {
    // Create hit particles
    const particles = scene.add.particles('projectile');
    const emitter = particles.createEmitter({
        x: x,
        y: y,
        speed: { min: 30, max: 60 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.05, end: 0.01 },
        alpha: { start: 0.6, end: 0 },
        tint: [0xff8800, 0xff4400], // Orange tints
        blendMode: 'ADD',
        lifespan: 500,
        quantity: 15,
        maxParticles: 15
    });
    
    // Auto-destroy the particle emitter after it's done
    scene.time.delayedCall(500, () => {
        particles.destroy();
    });
}

// Function to create tower destruction effect
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
        quantity: 30,
        maxParticles: 30
    });
    
    // Auto-destroy the particle emitter after it's done
    scene.time.delayedCall(800, () => {
        particles.destroy();
    });
}

// Function to handle dragon being hit by projectile
function hitDragon(projectile, dragon) {
    // Determine if it's an ender crystal
    const isEnderCrystal = projectile.getData('isEnderCrystal');
    
    // Destroy the projectile
    projectile.destroy();
    
    // If dragon is invincible, show message and return
    console.log(`Hit dragon! Dragon invincible status: ${dragon.invincible}`);
    if (dragon.invincible) {
        // Create a floating text effect
        const invincibleText = this.add.text(
            dragon.x, 
            dragon.y - 50, 
            "INVINCIBLE!", 
            { fontSize: '24px', fill: '#ff0', fontFamily: 'Arial' }
        );
        
        console.log("Dragon is still invincible! Destroy all towers first!");
        
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
    
    // Increase score
    window.score += 10;
    window.scoreText.setText('Score: ' + window.score);
    
    // Update dragon health bar
    updateDragonHealthBar();
    
    // Special effects on hit
    createDragonHitEffect(this, dragon.x, dragon.y);
    
    // If dragon is defeated, player wins
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
        
        // Hide dragon health bar
        window.dragonHealthBar.setVisible(false);
        window.dragonHealthBar.background.setVisible(false);
        window.dragonHealthText.setVisible(false);
        
        // Add big score bonus for defeating dragon
        window.score += 1000;
        window.scoreText.setText('Score: ' + window.score);
        
        // Display victory screen
        displayVictory(this);
        
        // Don't respawn the dragon - game is won!
    }
}

// Create dragon hit effect
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
        lifespan: 1000,
        quantity: 30
    });
    
    // Auto-destroy after effect completes
    scene.time.delayedCall(1000, () => {
        particles.destroy();
    });
}

// Function for dragon to breathe fire
function dragonBreatheFire() {
    // Create fire projectile from dragon's position using graphics instead of sprite
    const fire = this.add.graphics();
    
    // Draw fire shape with more yellowish-red colors
    fire.fillStyle(0xffcc00, 1); // Yellow-orange outer color
    fire.fillStyle(0xff3300, 0.9); // More reddish inner color
    
    // Create a fire shape object to hold our graphics
    const fireObj = this.dragonFire.create(window.dragon.x, window.dragon.y + 20, null);
    fireObj.body.setAllowGravity(false);
    
    // Calculate direction toward player
    const dirX = window.player.x - window.dragon.x;
    const dirY = window.player.y - window.dragon.y;
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    
    // Normalize direction
    const normalizedX = dirX / length;
    const normalizedY = dirY / length;
    
    // Draw the flame shape - larger and more pronounced
    fire.beginPath();
    fire.moveTo(0, 0);
    fire.lineTo(-20 + normalizedX * 5, -10 + normalizedY * 5);
    fire.lineTo(0 + normalizedX * 40, 0 + normalizedY * 40);
    fire.lineTo(20 + normalizedX * 5, 10 + normalizedY * 5);
    fire.closePath();
    fire.fill();
    
    // Add particles for the fire effect with yellowish-red colors
    const particles = this.add.particles('projectile');
    const emitter = particles.createEmitter({
        speed: 30,
        scale: { start: 0.06, end: 0.02 },
        alpha: { start: 0.9, end: 0 },
        tint: [0xffcc00, 0xff8800, 0xff3300], // Yellow to red gradient
        blendMode: 'ADD',
        lifespan: 800,
        quantity: 2,
        frequency: 50
    });
    
    // Attach the fire graphics and particles to our game object
    fireObj.setData('graphics', fire);
    fireObj.setData('particles', particles);
    
    // Set velocity based on direction to player
    fireObj.setVelocity(
        normalizedX * 300,
        normalizedY * 300
    );
    
    // Add collision with platforms
    this.physics.add.collider(fireObj, window.platforms, (fire, platform) => {
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
    
    // Destroy fire after 5 seconds (longer lifetime)
    this.time.delayedCall(5000, () => {
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

// Helper function to create fire explosion effect when fire hits a platform
function createFireExplosion(scene, x, y) {
    // Create explosion particles
    const explosionParticles = scene.add.particles('projectile');
    const explosionEmitter = explosionParticles.createEmitter({
        x: x,
        y: y,
        speed: { min: 50, max: 100 },
        angle: { min: 0, max: 360 },
        scale: { start: 0.1, end: 0.01 },
        alpha: { start: 0.8, end: 0 },
        tint: [0xffcc00, 0xff8800, 0xff3300],
        blendMode: 'ADD',
        lifespan: 800,
        quantity: 20,
        maxParticles: 20
    });
    
    // Auto-destroy the particle emitter after it's done
    scene.time.delayedCall(800, () => {
        explosionParticles.destroy();
    });
}

// Function to handle player being hit by dragon fire
function hitByDragonFire(fire, player) {
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

// Function to handle player damage
function damagePlayer(amount) {
    window.playerHealth -= amount;
    if (window.playerHealth <= 0) {
        window.playerHealth = 0;
        displayGameOver();
    }
    window.healthText.setText(`Health: ${window.playerHealth}`);
}

// Function to display game over screen
function displayGameOver() {
    if (window.gameOver) return; // Prevent multiple calls
    
    window.gameOver = true;
    
    // Create semi-transparent overlay
    const overlay = game.scene.scenes[0].add.rectangle(
        0, 0,
        game.config.width, game.config.height,
        0x000000, 0.7
    ).setOrigin(0, 0)
     .setScrollFactor(0)
     .setDepth(100);
    
    // Game over text
    window.gameOverText = game.scene.scenes[0].add.text(
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
        `Final Score: ${window.score}`,
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
    if (window.player && window.player.body) {
        window.player.body.moves = false;
    }
}

// Function to restart the game
function restartGame() {
    // Reset game state
    window.gameOver = false;
    window.score = 0;
    window.playerHealth = 100;
    window.teleportCooldown = false;
    window.teleportCooldownTimer = 0;
    
    // Restart the current scene
    game.scene.scenes[0].scene.restart();
}

// Update dragon health bar
function updateDragonHealthBar() {
    if (window.dragon && window.dragonHealthBar && window.dragonHealthText) {
        // Update text
        window.dragonHealthText.setText(`Dragon: ${window.dragon.health}/${window.dragon.maxHealth}`);
        
        // Update bar width (200px is max width)
        const healthPercentage = Math.max(0, window.dragon.health / window.dragon.maxHealth);
        window.dragonHealthBar.width = healthPercentage * 200;
    }
}

// Function to display victory screen
function displayVictory(scene) {
    if (window.gameOver) return; // Prevent multiple calls
    
    window.gameOver = true; // Use gameOver to prevent further game updates
    
    // Create semi-transparent overlay with golden color
    const overlay = scene.add.rectangle(
        0, 0,
        scene.cameras.main.width, scene.cameras.main.height,
        0x000000, 0.7
    ).setOrigin(0, 0)
     .setScrollFactor(0)
     .setDepth(100);
    
    // Victory text
    const victoryText = scene.add.text(
        scene.cameras.main.width / 2,
        scene.cameras.main.height / 2 - 50,
        'VICTORY!',
        { 
            fontSize: '64px', 
            fontFamily: 'Arial', 
            fill: '#ffdd00',
            fontStyle: 'bold'
        }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setDepth(101);
    
    // Add a shine effect to the victory text
    scene.tweens.add({
        targets: victoryText,
        alpha: 0.7,
        duration: 500,
        yoyo: true,
        repeat: -1
    });
    
    // Final score with bonus
    const finalScoreText = scene.add.text(
        scene.cameras.main.width / 2,
        scene.cameras.main.height / 2 + 20,
        `Final Score: ${window.score}`,
        { 
            fontSize: '32px', 
            fontFamily: 'Arial', 
            fill: '#ffffff' 
        }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setDepth(101);
    
    // Victory message
    const messageText = scene.add.text(
        scene.cameras.main.width / 2,
        scene.cameras.main.height / 2 + 60,
        'You defeated the Ender Dragon!',
        { 
            fontSize: '28px', 
            fontFamily: 'Arial', 
            fill: '#ffdd00' 
        }
    ).setOrigin(0.5)
     .setScrollFactor(0)
     .setDepth(101);
    
    // Restart button
    const restartButton = scene.add.text(
        scene.cameras.main.width / 2,
        scene.cameras.main.height / 2 + 120,
        'Play Again',
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
    if (window.player && window.player.body) {
        window.player.body.moves = false;
    }
    
    // Create celebratory particles
    const particles = scene.add.particles('ender_crystal');
    particles.createEmitter({
        x: { min: 0, max: scene.cameras.main.width },
        y: -50,
        speed: { min: 100, max: 150 },
        angle: { min: 80, max: 100 },
        scale: { start: 0.1, end: 0.01 },
        alpha: { start: 1, end: 0 },
        lifespan: 4000,
        quantity: 1,
        frequency: 200,
        tint: [0xffff00, 0xff8800, 0xff00ff, 0x00ffff],
        blendMode: 'ADD'
    }).setScrollFactor(0).setDepth(102);
}

export { 
    create, 
    hitTower, hitDragon, hitByDragonFire, 
    dragonBreatheFire, 
    damagePlayer,
    displayGameOver, restartGame,
    updateDragonHealthBar,
    displayVictory,
    createTowerHitEffect
};