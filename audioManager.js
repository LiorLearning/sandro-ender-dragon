class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.sounds = {};
        this.currentBGM = null;
    }

    addSounds() {
        this.sounds.bgm = this.scene.sound.add('bgm', { loop: true, volume: 0.5 });
        this.sounds.hit = this.scene.sound.add('hit', { volume: 0.7 });
        this.sounds.explosion = this.scene.sound.add('explosion', { volume: 0.8 });
    }

    playBGM() {
        if (this.currentBGM && this.currentBGM.isPlaying) {
            this.currentBGM.stop();
        }
        this.currentBGM = this.sounds.bgm;
        if (this.currentBGM) {
            this.currentBGM.play();
        } else {
            console.warn("BGM sound not found or not loaded.");
        }
    }

    stopBGM() {
        if (this.currentBGM && this.currentBGM.isPlaying) {
            this.currentBGM.stop();
        }
    }

    playHitSound() {
        if (this.sounds.hit) {
            this.sounds.hit.play();
        } else {
            console.warn("Hit sound not found or not loaded.");
        }
    }

    playExplosionSound() {
        if (this.sounds.explosion) {
            this.sounds.explosion.play();
        } else {
            console.warn("Explosion sound not found or not loaded.");
        }
    }
} 