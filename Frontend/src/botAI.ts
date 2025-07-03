export type KeyState = { [key: string]: boolean };

export interface BotView {
    ballX: number;
    ballY: number;
    ballVX: number;
    ballVY: number;
    ballWidth: number;
    ballHeight: number;
    rightY: number;
    paddleHeight: number;
    fieldWidth: number;
    fieldHeight: number;
}

export class BotAI {
    private lastDirection: "up" | "down" | "none" = "none";
    private targetY: number = 0;
    private reactionError: number = 0;
    private lastBallX: number = 0;
    private errorDecay: number = 0.92; // Slower error decay
    private lastDecisionTime: number = 0;
    private currentKeyUp: boolean = false;
    private currentKeyDown: boolean = false;
    private lastUpdateTime: number = 0;
    private movementStartTime: number = 0;
    private movementDuration: number = 0;
    private consecutiveHits: number = 0; // Track performance for dynamic difficulty

    update(view: BotView, keys: KeyState) {
        const now = Date.now();
        this.lastUpdateTime = now;
        
        // Calculate target position
        let targetY: number;
        const ballCenterY = view.ballY + view.ballHeight / 2;
        const paddleCenter = view.rightY + view.paddleHeight / 2;

        // Improved ball tracking logic with more realistic limitations
        if (view.ballVX > 0) {
            // Ball is coming toward us - predict where it will be
            targetY = this.predictBallY(view);
            
            // Add speed-based difficulty - faster balls are harder to track
            const ballSpeed = Math.sqrt(view.ballVX * view.ballVX + view.ballVY * view.ballVY);
            const speedError = (ballSpeed - 4) * 8; // Increase error with faster balls
            
            // Distance-based error - closer balls are harder to react to
            const distanceToBot = view.fieldWidth - view.ballX;
            const distanceError = Math.max(0, (200 - distanceToBot) * 0.3);
            
            targetY += speedError + distanceError;
        } else {
            // Ball is going away - stay in defensive position with some laziness
            const centerY = view.fieldHeight / 2;
            // Move more slowly toward center (more realistic)
            targetY = paddleCenter + (centerY - paddleCenter) * 0.2;
        }

        // Enhanced reaction error system
        if (Math.random() < 0.15) { // More frequent errors
            // Larger errors when ball is fast or when bot has been playing well
            const baseError = (Math.random() - 0.5) * 40;
            const difficultyMultiplier = 1 + (this.consecutiveHits * 0.1); // Gets worse as it succeeds
            this.reactionError = baseError * difficultyMultiplier;
        }
        
        // Occasional major mistakes (simulates human lapses)
        if (Math.random() < 0.03) {
            this.reactionError += (Math.random() - 0.5) * 80;
        }
        
        this.reactionError *= this.errorDecay;
        targetY += this.reactionError;

        // Calculate movement needed
        const diff = targetY - paddleCenter;
        
        // Dynamic tolerance based on ball speed and position
        const ballSpeed = Math.sqrt(view.ballVX * view.ballVX + view.ballVY * view.ballVY);
        const baseTolerance = 40; // Increased base tolerance
        const speedTolerance = (ballSpeed - 4) * 5; // More tolerance for faster balls
        const tolerance = baseTolerance + speedTolerance;

        // Set movement decision and duration
        if (Math.abs(diff) > tolerance) {
            // Calculate movement with some imperfection
            const paddleSpeed = 6;
            const pixelsToMove = Math.abs(diff);
            
            // Add movement inefficiency - sometimes moves too long or too short
            const efficiency = 0.8 + Math.random() * 0.4; // 80-120% efficiency
            const framesNeeded = Math.ceil(pixelsToMove / paddleSpeed);
            const timeNeeded = Math.min(900, framesNeeded * 16.67 * efficiency);
            
            this.movementStartTime = now;
            this.movementDuration = timeNeeded;
            
            if (diff > 0) {
                this.currentKeyDown = true;
                this.currentKeyUp = false;
                this.lastDirection = "down";
            } else {
                this.currentKeyUp = true;
                this.currentKeyDown = false;
                this.lastDirection = "up";
            }
        } else {
            // Close enough - stop moving
            this.currentKeyUp = false;
            this.currentKeyDown = false;
            this.lastDirection = "none";
            this.movementDuration = 0;
        }

        this.lastDecisionTime = now;
    }

    // Call this when bot successfully hits the ball
    recordHit() {
        this.consecutiveHits++;
    }

    // Call this when bot misses the ball
    recordMiss() {
        this.consecutiveHits = Math.max(0, this.consecutiveHits - 2); // Reset performance counter
    }

    // Method to get current key states (called by play.ts between AI updates)
    getCurrentKeys(): { ArrowUp: boolean; ArrowDown: boolean } {
        const now = Date.now();
        
        // Add some timing imperfection
        const timingError = Math.random() * 50; // Up to 50ms timing error
        
        if (this.movementDuration > 0 && (now - this.movementStartTime) < (this.movementDuration + timingError)) {
            return {
                ArrowUp: this.currentKeyUp,
                ArrowDown: this.currentKeyDown
            };
        }
        
        return {
            ArrowUp: false,
            ArrowDown: false
        };
    }

    private predictBallY(view: BotView): number {
        const { ballX, ballY, ballVX, ballVY, ballWidth, ballHeight, fieldWidth, fieldHeight } = view;
        
        if (ballVX <= 0) {
            return ballY + ballHeight / 2;
        }

        let x = ballX;
        let y = ballY;
        let vx = ballVX;
        let vy = ballVY;

        const paddleX = fieldWidth - 32 - 16;
        let steps = 0;
        const maxSteps = 150; // Reduced prediction accuracy

        // Simulate ball movement with some prediction errors
        while (x < paddleX && steps < maxSteps && vx > 0) {
            x += vx;
            y += vy;
            steps++;

            // Handle bounces with slight physics errors
            if (y <= 0) {
                y = 0;
                vy = Math.abs(vy) * (0.98 + Math.random() * 0.04); // Slight bounce variation
            } else if (y >= fieldHeight - ballHeight) {
                y = fieldHeight - ballHeight;
                vy = -Math.abs(vy) * (0.98 + Math.random() * 0.04);
            }
        }

        // Add prediction uncertainty that increases with distance
        const distanceFromBot = paddleX - ballX;
        const predictionError = (distanceFromBot / 100) * (Math.random() - 0.5) * 30;
        
        const predictedCenter = y + ballHeight / 2 + predictionError;
        
        return Math.max(
            ballHeight / 2, 
            Math.min(fieldHeight - ballHeight / 2, predictedCenter)
        );
    }
}