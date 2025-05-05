// World constants
const worldWidth = window.innerWidth * 10; // World is 10x wider than screen
const TELEPORT_COOLDOWN_TIME = 15000; // 15 seconds cooldown

// Import game functions
import preload from './preload.js';
import { create } from './create.js';
import update from './update.js';

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
            debug: true
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

// Make constants globally available
window.worldWidth = worldWidth;
window.TELEPORT_COOLDOWN_TIME = TELEPORT_COOLDOWN_TIME;
window.game = game;

// Global variables for game objects
window.player = null;
window.platforms = null;
window.cursors = null;
window.dragon = null;
window.towers = [];
window.minimap = null;
window.minimapEntities = [];
window.directionIndicator = null;
window.enemies = [];

// Game state variables
window.score = 0;
window.playerHealth = 100;
window.isAttacking = false;
window.attackCooldown = false;
window.dragonFireTimer = 0;
window.totalTowers = 0;
window.gameOver = false;
window.teleportCooldown = false;
window.teleportCooldownTimer = 0;

// Control keys
window.attackKey = null;
window.teleportKey = null;

// UI elements
window.scoreText = null;
window.healthText = null;
window.healthBar = null;
window.towersText = null;
window.gameOverText = null;
window.teleportTimerText = null;
window.inventoryText = null;