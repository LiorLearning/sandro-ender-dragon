// All variables accessed through window global

// Attack function - throws Ender Crystal
function attack(scene) {
    if (window.attackCooldown) {
        return; // Still in cooldown, don't attack
    }
    
    window.isAttacking = true;
    window.attackCooldown = true;
    
    // Create a projectile (ender crystal)
    const projectile = scene.projectiles.create(window.player.x, window.player.y, 'ender_crystal');
    projectile.setScale(0.2); // Increased to 0.2
    projectile.body.setAllowGravity(false);
    projectile.setData('isEnderCrystal', true);
    console.log("Created projectile with isEnderCrystal flag:", projectile.getData('isEnderCrystal'));
    
    // Set projectile velocity based on player facing direction
    const direction = window.player.flipX ? -1 : 1; // Use player's facing direction instead of velocity
    projectile.setVelocityX(direction * 400);
    projectile.setVelocityY(-100); // Slight upward trajectory
    
    // Add a glow effect
    const particles = scene.add.particles('ender_crystal');
    const emitter = particles.createEmitter({
        scale: { start: 0.05, end: 0.01 },
        alpha: { start: 0.5, end: 0 },
        speed: 20,
        lifespan: 500,
        blendMode: 'ADD',
        follow: projectile
    });
    
    // Destroy projectile after 3 seconds if it doesn't hit anything
    scene.time.delayedCall(3000, () => {
        if (projectile.active) {
            particles.destroy();
            projectile.destroy();
        }
    });
    
    // Reset attack cooldown after 500ms
    scene.time.delayedCall(500, () => {
        window.attackCooldown = false;
        window.isAttacking = false;
    });
}

// Teleport player function - uses Ender Pearl
function teleportPlayer(scene) {
    if (window.teleportCooldown) {
        // Show message that teleport is on cooldown
        const cooldownText = scene.add.text(
            window.player.x, 
            window.player.y - 50, 
            "Teleport on cooldown!", 
            { fontSize: '16px', fill: '#ff77ff', fontFamily: 'Arial' }
        ).setOrigin(0.5);
        
        // Make the text rise and fade out
        scene.tweens.add({
            targets: cooldownText,
            y: window.player.y - 100,
            alpha: 0,
            duration: 1000,
            onComplete: () => cooldownText.destroy()
        });
        
        return;
    }
    
    // Set cooldown
    window.teleportCooldown = true;
    window.teleportCooldownTimer = 0;
    window.teleportTimerText.setText(`Teleport: 15s`);
    
    // Create teleportation effect at current position
    createTeleportEffect(scene, window.player.x, window.player.y);
    
    // Find the nearest tower or dragon to teleport to
    const activeTowers = window.towers.filter(t => t.active);
    
    let targetX, targetY;
    
    if (activeTowers.length > 0) {
        // Find the nearest tower
        let nearestTower = activeTowers[0];
        let shortestDistance = Phaser.Math.Distance.Between(
            window.player.x, window.player.y, nearestTower.x, nearestTower.y
        );
        
        activeTowers.forEach(tower => {
            const distance = Phaser.Math.Distance.Between(
                window.player.x, window.player.y, tower.x, tower.y
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
        targetX = window.dragon.x + Phaser.Math.Between(-100, 100);
        targetY = window.dragon.y + 100; // Teleport below the dragon
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
            window.player.x = targetX;
            window.player.y = targetY;
            
            // Create teleport arrival effect
            createTeleportEffect(scene, window.player.x, window.player.y);
            
            // Remove flash
            flash.destroy();
        }
    });
}

// Create teleport effect
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
        quantity: 40
    });
    
    // Auto-destroy after effect completes
    scene.time.delayedCall(800, () => {
        particles.destroy();
    });
}

export { attack, teleportPlayer, createTeleportEffect };