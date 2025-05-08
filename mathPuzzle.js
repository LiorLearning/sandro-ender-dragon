// Math Puzzle System for Ender Dragon Game

// Class to handle math puzzles
class MathPuzzle {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.currentAnswer = null;
        this.onCorrectCallback = null;
        this.onWrongCallback = null;
        this.difficulty = 'easy'; // default difficulty
        this.createUI();
    }

    // Create the UI elements
    createUI() {
        // Container for the puzzle
        this.container = this.scene.add.container(0, 0)
            .setDepth(200)
            .setScrollFactor(0)
            .setVisible(false);

        // Background
        this.background = this.scene.add.rectangle(
            window.innerWidth / 2,
            window.innerHeight / 2,
            400,
            300,
            0x000000,
            0.8
        ).setOrigin(0.5);
        this.container.add(this.background);

        // Title
        this.title = this.scene.add.text(
            window.innerWidth / 2,
            window.innerHeight / 2 - 120,
            'MATH CHALLENGE',
            {
                fontSize: '28px',
                fontFamily: 'Arial',
                fill: '#ffff00',
                fontStyle: 'bold'
            }
        ).setOrigin(0.5);
        this.container.add(this.title);

        // Question
        this.questionText = this.scene.add.text(
            window.innerWidth / 2,
            window.innerHeight / 2 - 60,
            '',
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        this.container.add(this.questionText);

        // Input field background
        this.inputBackground = this.scene.add.rectangle(
            window.innerWidth / 2,
            window.innerHeight / 2,
            150,
            50,
            0x333333
        ).setOrigin(0.5);
        this.container.add(this.inputBackground);

        // Answer text
        this.answerText = this.scene.add.text(
            window.innerWidth / 2,
            window.innerHeight / 2,
            '',
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        this.container.add(this.answerText);

        // Submit button
        this.submitButton = this.scene.add.rectangle(
            window.innerWidth / 2,
            window.innerHeight / 2 + 70,
            150,
            50,
            0x00aa00
        ).setOrigin(0.5)
         .setInteractive();
        this.container.add(this.submitButton);

        // Submit text
        this.submitText = this.scene.add.text(
            window.innerWidth / 2,
            window.innerHeight / 2 + 70,
            'SUBMIT',
            {
                fontSize: '20px',
                fontFamily: 'Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        this.container.add(this.submitText);

        // Result text
        this.resultText = this.scene.add.text(
            window.innerWidth / 2,
            window.innerHeight / 2 + 130,
            '',
            {
                fontSize: '24px',
                fontFamily: 'Arial',
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        this.container.add(this.resultText);

        // Add event listener for submit button
        this.submitButton.on('pointerdown', () => this.checkAnswer());
        
        // Add hover effect to submit button
        this.submitButton.on('pointerover', () => {
            this.submitButton.fillColor = 0x00cc00;
        });
        this.submitButton.on('pointerout', () => {
            this.submitButton.fillColor = 0x00aa00;
        });

        // Set up keyboard input
        this.keys = [];
        for (let i = 0; i <= 9; i++) {
            this.keys.push(this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ZERO + i));
        }
        this.backspaceKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.BACKSPACE);
        this.enterKey = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    // Generate a basic math puzzle
    generatePuzzle() {
        // Generate 1-digit multiplication for easy difficulty
        const num1 = Phaser.Math.Between(1, 9);
        const num2 = Phaser.Math.Between(1, 9);
        
        this.currentAnswer = num1 * num2;
        this.questionText.setText(`${num1} × ${num2} = ?`);
        this.answerText.setText('');
        this.resultText.setText('');
    }

    // Show the puzzle
    show(onCorrect, onWrong) {
        this.isActive = true;
        this.container.setVisible(true);
        this.generatePuzzle();
        this.onCorrectCallback = onCorrect;
        this.onWrongCallback = onWrong;
        
        // Pause the game physics
        this.scene.physics.pause();
        
        // Enable keyboard input for this puzzle
        this.setUpKeyboardListeners(true);
    }

    // Hide the puzzle
    hide() {
        this.isActive = false;
        this.container.setVisible(false);
        
        // Resume game physics
        this.scene.physics.resume();
        
        // Disable keyboard input for this puzzle
        this.setUpKeyboardListeners(false);
    }

    // Set up keyboard listeners
    setUpKeyboardListeners(enable) {
        if (enable) {
            // Set up update callback to handle keyboard input
            this.keyboardEventHandler = (time, delta) => {
                // Handle number keys
                for (let i = 0; i <= 9; i++) {
                    if (Phaser.Input.Keyboard.JustDown(this.keys[i])) {
                        this.addNumber(i);
                    }
                }
                
                // Handle backspace
                if (Phaser.Input.Keyboard.JustDown(this.backspaceKey)) {
                    this.removeLastDigit();
                }
                
                // Handle enter
                if (Phaser.Input.Keyboard.JustDown(this.enterKey)) {
                    this.checkAnswer();
                }
            };
            
            this.scene.events.on('update', this.keyboardEventHandler);
        } else {
            // Remove the update callback
            if (this.keyboardEventHandler) {
                this.scene.events.off('update', this.keyboardEventHandler);
            }
        }
    }

    // Add a number to the answer
    addNumber(num) {
        if (this.answerText.text.length < 3) { // Limit to 3 digits
            this.answerText.setText(this.answerText.text + num);
        }
    }

    // Remove the last digit from the answer
    removeLastDigit() {
        if (this.answerText.text.length > 0) {
            this.answerText.setText(this.answerText.text.slice(0, -1));
        }
    }

    // Check if the answer is correct
    checkAnswer() {
        const userAnswer = parseInt(this.answerText.text);
        
        if (isNaN(userAnswer)) {
            this.resultText.setText('Please enter a number!');
            this.resultText.setFill('#ff9900');
            return;
        }
        
        if (userAnswer === this.currentAnswer) {
            // Correct answer
            this.resultText.setText('Correct!');
            this.resultText.setFill('#00ff00');
            
            // Hide after a short delay
            this.scene.time.delayedCall(1000, () => {
                this.hide();
                if (this.onCorrectCallback) {
                    this.onCorrectCallback();
                }
            });
        } else {
            // Wrong answer
            this.resultText.setText('Try again!');
            this.resultText.setFill('#ff0000');
            
            // Clear the answer field
            this.answerText.setText('');
            
            // Call the wrong answer callback
            if (this.onWrongCallback) {
                this.onWrongCallback();
            }
        }
    }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MathPuzzle };
} 