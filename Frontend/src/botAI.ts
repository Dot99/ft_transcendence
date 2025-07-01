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
    private errorDecay: number = 0.95;
    private lastDecisionTime: number = 0;
    private currentKeyUp: boolean = false;
    private currentKeyDown: boolean = false;
    private lastUpdateTime: number = 0;
    private movementStartTime: number = 0;
    private movementDuration: number = 0;

    update(view: BotView, keys: KeyState) {
        const now = Date.now();
        this.lastUpdateTime = now;
        
        // Calculate target position
        let targetY: number;
        const ballCenterY = view.ballY + view.ballHeight / 2;
        const paddleCenter = view.rightY + view.paddleHeight / 2;

        // Improved ball tracking logic
        if (view.ballVX > 0) {
            // Ball is coming toward us - predict where it will be
            targetY = this.predictBallY(view);
        } else {
            // Ball is going away - stay in defensive position
            const centerY = view.fieldHeight / 2;
            // Gradually move toward center but don't abandon current position too quickly
            targetY = paddleCenter + (centerY - paddleCenter) * 0.3;
        }

        // Add reaction error for realism (smaller and less frequent)
        if (Math.random() < 0.05) {
            this.reactionError = (Math.random() - 0.5) * 20;
        }
        this.reactionError *= this.errorDecay;
        targetY += this.reactionError;

        // Calculate movement needed
        const diff = targetY - paddleCenter;
        const tolerance = 30; // Larger tolerance to reduce jitter

        // Set movement decision and duration
        if (Math.abs(diff) > tolerance) {
            // Calculate how long to move (based on distance and paddle speed)
            const paddleSpeed = 6; // From play.ts
            const pixelsToMove = Math.abs(diff);
            const framesNeeded = Math.ceil(pixelsToMove / paddleSpeed);
            const timeNeeded = Math.min(950, framesNeeded * 16.67); // 60fps = 16.67ms per frame
            
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

    // Method to get current key states (called by play.ts between AI updates)
    getCurrentKeys(): { ArrowUp: boolean; ArrowDown: boolean } {
        const now = Date.now();
        
        // Check if we should still be moving based on our last decision
        if (this.movementDuration > 0 && (now - this.movementStartTime) < this.movementDuration) {
            return {
                ArrowUp: this.currentKeyUp,
                ArrowDown: this.currentKeyDown
            };
        }
        
        // Movement duration expired - stop
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

        const paddleX = fieldWidth - 32 - 16; // Paddle position
        let steps = 0;
        const maxSteps = 200;

        // Simulate ball movement until it reaches paddle area
        while (x < paddleX && steps < maxSteps && vx > 0) {
            x += vx;
            y += vy;
            steps++;

            // Handle top/bottom bounces
            if (y <= 0) {
                y = 0;
                vy = Math.abs(vy);
            } else if (y >= fieldHeight - ballHeight) {
                y = fieldHeight - ballHeight;
                vy = -Math.abs(vy);
            }
        }

        // Return predicted Y position (center of ball)
        return Math.max(
            ballHeight / 2, 
            Math.min(fieldHeight - ballHeight / 2, y + ballHeight / 2)
        );
    }
}