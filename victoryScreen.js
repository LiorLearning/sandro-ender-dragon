/**
 * Victory Screen for Ender Dragon Game
 * Shows a victory screen with final score and animations when the player defeats the dragon.
 */

// Check if VictoryScreen is already defined before declaring
if (typeof VictoryScreen === 'undefined') {
    class VictoryScreen {
        constructor(scene) {
            this.scene = scene;
            this.isActive = false;
            this.container = null;
        }

        /**
         * Show the victory screen with the player's final score
         * @param {number} finalScore - The player's final score
         */
        show(finalScore) {
            if (this.isActive) return;
            this.isActive = true;

            // Create a container for all victory screen elements
            this.container = this.scene.add.container(0, 0);
            this.container.setDepth(200);

            // Semi-transparent overlay
            const overlay = this.scene.add.rectangle(
                0, 0,
                this.scene.cameras.main.width,
                this.scene.cameras.main.height,
                0x000000, 0.7
            ).setOrigin(0, 0)
             .setScrollFactor(0);
            
            this.container.add(overlay);

            // Victory title with glow effect
            const victoryTitle = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 3,
                'VICTORY!',
                {
                    fontSize: '72px',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    fill: '#ffff00',
                    stroke: '#ff8800',
                    strokeThickness: 8,
                    shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, stroke: true, fill: true }
                }
            ).setOrigin(0.5)
             .setScrollFactor(0);
            
            this.container.add(victoryTitle);

            // Dragon defeated message
            const dragonDefeatedText = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 - 20,
                'The Ender Dragon Has Been Defeated!',
                {
                    fontSize: '32px',
                    fontFamily: 'Arial',
                    fill: '#ffffff'
                }
            ).setOrigin(0.5)
             .setScrollFactor(0);
            
            this.container.add(dragonDefeatedText);

            // Final score text
            const finalScoreText = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 + 40,
                `Final Score: ${finalScore}`,
                {
                    fontSize: '48px',
                    fontFamily: 'Arial',
                    fill: '#00ffff'
                }
            ).setOrigin(0.5)
             .setScrollFactor(0);
            
            this.container.add(finalScoreText);

            // Restart button
            const restartButton = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 + 120,
                'Play Again',
                {
                    fontSize: '36px',
                    fontFamily: 'Arial',
                    fill: '#00ff00',
                    backgroundColor: '#333333',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5)
             .setScrollFactor(0)
             .setInteractive({ useHandCursor: true });
            
            // Button hover effects
            restartButton.on('pointerover', () => {
                restartButton.setStyle({ fill: '#88ff88' });
            });
            
            restartButton.on('pointerout', () => {
                restartButton.setStyle({ fill: '#00ff00' });
            });
            
            // Restart the game when clicked
            restartButton.on('pointerdown', () => {
                this.hide();
                // Call the game's restart function
                if (typeof window.restartGame === 'function') {
                    window.restartGame();
                } else {
                    // Fallback if global function isn't available
                    this.scene.scene.restart();
                }
            });
            
            this.container.add(restartButton);

            // Main menu button
            const menuButton = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                this.scene.cameras.main.height / 2 + 190,
                'Main Menu',
                {
                    fontSize: '28px',
                    fontFamily: 'Arial',
                    fill: '#ffffff',
                    backgroundColor: '#333333',
                    padding: { x: 15, y: 8 }
                }
            ).setOrigin(0.5)
             .setScrollFactor(0)
             .setInteractive({ useHandCursor: true });
            
            // Button hover effects
            menuButton.on('pointerover', () => {
                menuButton.setStyle({ fill: '#aaaaaa' });
            });
            
            menuButton.on('pointerout', () => {
                menuButton.setStyle({ fill: '#ffffff' });
            });
            
            // Return to main menu when clicked (if applicable)
            menuButton.on('pointerdown', () => {
                this.hide();
                // Reload page to return to menu
                window.location.reload();
            });
            
            this.container.add(menuButton);

            // Add particles for celebration effect
            this.createCelebrationParticles();

            // Add entry animations for elements
            this.animateElements(victoryTitle, dragonDefeatedText, finalScoreText, restartButton, menuButton);
        }

        /**
         * Create particle effects for the victory celebration
         */
        createCelebrationParticles() {
            // Create multiple particle emitters for a festive look
            const colors = [0xffff00, 0x00ffff, 0xff00ff, 0x00ff00, 0xff0000];
            
            colors.forEach((color, index) => {
                const x = this.scene.cameras.main.width * (index + 1) / (colors.length + 1);
                
                const particles = this.scene.add.particles('ender_crystal');
                const emitter = particles.createEmitter({
                    x: x,
                    y: 0,
                    speed: { min: 200, max: 400 },
                    angle: { min: 80, max: 100 },
                    scale: { start: 0.1, end: 0.01 },
                    alpha: { start: 1, end: 0 },
                    lifespan: 3000,
                    quantity: 1,
                    frequency: 200,
                    tint: color
                });
                
                this.container.add(particles);
            });
        }

        /**
         * Animate the victory screen elements
         */
        animateElements(title, message, score, restartBtn, menuBtn) {
            // Animate title scaling in
            this.scene.tweens.add({
                targets: title,
                scale: { from: 0, to: 1 },
                duration: 1000,
                ease: 'Bounce.Out'
            });

            // Fade in other elements sequentially
            const elements = [message, score, restartBtn, menuBtn];
            elements.forEach((element, index) => {
                element.alpha = 0;
                this.scene.tweens.add({
                    targets: element,
                    alpha: 1,
                    duration: 500,
                    delay: 1000 + index * 200,
                    ease: 'Power2'
                });
            });
        }

        /**
         * Hide and clean up the victory screen
         */
        hide() {
            if (!this.isActive) return;
            
            this.isActive = false;
            this.container.destroy();
            this.container = null;
        }
    }

    // Make VictoryScreen available globally
    window.VictoryScreen = VictoryScreen;
} 