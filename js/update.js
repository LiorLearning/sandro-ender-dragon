import { attack, teleportPlayer } from './playerActions.js';
import { dragonBreatheFire, updateDragonHealthBar } from './create.js';
import { updateMinimap } from './minimap.js';

// Game loop
function update(time, delta) {
    // Don't update game logic if game is over
    if (window.gameOver) {
        return;
    }
    
    // Player movement
    if (window.cursors.left.isDown) {
        window.player.setVelocityX(-160);
        window.player.setFlipX(true);
    }
    else if (window.cursors.right.isDown) {
        window.player.setVelocityX(160);
        window.player.setFlipX(false);
    }
    else {
        window.player.setVelocityX(0);
    }

    // Jump when up arrow is pressed and player is on the ground
    if (window.cursors.up.isDown && window.player.body.touching.down) {
        window.player.setVelocityY(-500);
    }
    
    // Update health bar width based on health
    window.healthBar.width = (window.playerHealth / 100) * 200;
    
    // Update dragon health bar if it's visible
    if (window.dragonHealthBar && window.dragonHealthBar.visible) {
        updateDragonHealthBar();
    }
    
    // Attack when space is pressed
    if (window.attackKey.isDown && !window.attackCooldown) {
        attack(this);
    }
    
    // Make dragon follow player
    // Calculate direction from dragon to player
    const directionX = window.player.x - window.dragon.x;
    const directionY = window.player.y - window.dragon.y;
    
    // Calculate distance
    const distance = Math.sqrt(directionX * directionX + directionY * directionY);
    
    // Normalize direction
    const normalizedX = directionX / distance;
    const normalizedY = directionY / distance;
    
    // Set dragon velocity to move toward player
    const dragonSpeed = 120;
    window.dragon.setVelocity(
        normalizedX * dragonSpeed,
        normalizedY * dragonSpeed
    );
    
    // Update dragon's facing direction based on movement
    if (window.dragon.body.velocity.x > 0) {
        window.dragon.flipX = false;
        window.dragon.scaleX = Math.abs(window.dragon.scaleX);
        window.directionIndicator.setText("→");
    } else {
        window.dragon.flipX = true;
        window.dragon.scaleX = -Math.abs(window.dragon.scaleX);
        window.directionIndicator.setText("←");
    }
    
    // Update direction indicator position to follow dragon
    window.directionIndicator.x = window.dragon.x;
    window.directionIndicator.y = window.dragon.y - 30;
    
    // Dragon fire breathing logic
    if (window.dragon.active && window.dragon.visible) {
        window.dragon.fireTimer += delta;
        // Breathe fire every 3 seconds
        if (window.dragon.fireTimer > 3000) {
            dragonBreatheFire.call(this);
            window.dragon.fireTimer = 0;
        }
    }
    
    // Update towers text and check dragon vulnerability
    const remainingTowers = window.towers.filter(t => t.active).length;
    window.towersText.setText(`Towers: ${remainingTowers}/${window.totalTowers}`);
    
    // Double-check: Make dragon vulnerable if no towers remain
    if (remainingTowers === 0 && window.dragon.invincible) {
        console.log("Update check: No towers remaining! Making dragon vulnerable.");
        window.dragon.invincible = false;
        window.dragonHealthText.setVisible(true);
        window.dragonHealthBar.setVisible(true);
        window.dragonHealthBar.background.setVisible(true);
        updateDragonHealthBar();
    }
    
    // Update minimap
    updateMinimap.call(this);

    // Update teleport cooldown timer
    if (window.teleportCooldown) {
        window.teleportCooldownTimer += delta;
        const remainingTime = Math.max(0, Math.ceil((window.TELEPORT_COOLDOWN_TIME - window.teleportCooldownTimer) / 1000));
        window.teleportTimerText.setText(`Teleport: ${remainingTime}s`);
        
        // Reset cooldown when time is up
        if (window.teleportCooldownTimer >= window.TELEPORT_COOLDOWN_TIME) {
            window.teleportCooldown = false;
            window.teleportCooldownTimer = 0;
            window.teleportTimerText.setText('');
        }
    }

    // Check for teleport key press
    if (window.teleportKey.isDown && !window.teleportCooldown) {
        teleportPlayer(this);
    }
}

export default update;