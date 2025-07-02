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
    private reactionError: number = 0;
    private errorDecay: number = 0.92;
    private currentKeyUp: boolean = false;
    private currentKeyDown: boolean = false;
    private movementStartTime: number = 0;
    private movementDuration: number = 0;
    private consecutiveHits: number = 0;
    private shouldDelayMovement: boolean = false;
    private delayAmount: number = 0;
    
    //Natural movement
    private currentStrategy: "positioning" | "intercepting" | "waiting" = "waiting";
    private targetPositionOffset: number = 0;
    private lastStrategyChange: number = 0;
    private anticipationDistance: number = 250;
    
    private isJittering: boolean = false;
    private jitterStartTime: number = 0;
    private jitterDirection: "up" | "down" | "none" = "none";
    private lastJitterChange: number = 0;
    private nervousness: number = 0;
    private lastBallDistance: number = 0;
    private hesitationTime: number = 0;
    private isHesitating: boolean = false;
    
    private ballStartTime: number = 0;
    private lastBallVX: number = 0;
    private lastBallX: number = 0;

    private lastMovementCheck: number = 0;
    private stuckCounter: number = 0;
    private lastPaddleY: number = 0;

    update(view: BotView) {
        const now = Date.now();
        const distanceToBot = view.fieldWidth - view.ballX;
        
        this.detectStuckState(view, now);
        
        // Detect ball reset or new serve
        if ((this.lastBallVX === 0 && view.ballVX !== 0) || 
            (Math.abs(view.ballX - this.lastBallX) > 50)) {
            this.ballStartTime = now;
            this.nervousness = 0;
            this.stuckCounter = 0;
            this.lastMovementCheck = now;
        }
        this.lastBallVX = view.ballVX;
        this.lastBallX = view.ballX;
        
        this.updateNervousness(view, distanceToBot);
        this.handleHumanBehaviors(now);
        
        // Calculate target position
        let baseTargetY: number;
        const paddleCenter = view.rightY + view.paddleHeight / 2;

        if (view.ballVX > 0) {
            baseTargetY = this.predictBallY(view);
            
            // Determine strategy based on ball distance
            if (distanceToBot > this.anticipationDistance) {
                // Ball is far
                if (this.currentStrategy !== "positioning" || now - this.lastStrategyChange > 1500) {
                    this.currentStrategy = "positioning";
                    this.lastStrategyChange = now;
                    this.targetPositionOffset = (Math.random() - 0.5) * (60 + this.nervousness * 20);
                }
                baseTargetY += this.targetPositionOffset;
                
                // Readjustments when positioning
                if (Math.random() < 0.15 && now - this.lastStrategyChange > 800) {
                    this.targetPositionOffset += (Math.random() - 0.5) * 30;
                    this.lastStrategyChange = now;
                }
                
            } else if (distanceToBot > 100) {
                // Ball is close
                if (this.currentStrategy !== "intercepting") {
                    this.currentStrategy = "intercepting";
                    this.lastStrategyChange = now;
                    this.targetPositionOffset *= 0.3;
                    
                    // Hesitation chance
                    if (Math.random() < 0.3) {
                        this.isHesitating = true;
                        this.hesitationTime = 100 + Math.random() * 200;
                    }
                }
                baseTargetY += this.targetPositionOffset;
                
                // Natural movements
                if (Math.random() < 0.08) {
                    this.targetPositionOffset += (Math.random() - 0.5) * 15;
                }
                
            } else {
                // Ball is very close
                this.currentStrategy = "intercepting";
                this.targetPositionOffset *= 0.8;
                
                // Natural movements
                if (distanceToBot < 60 && Math.random() < 0.2) {
                    const panicAdjustment = (Math.random() - 0.5) * 20;
                    baseTargetY += panicAdjustment;
                }
            }
            
            const shouldMiss = this.shouldMissThisBall(view);
            
            if (shouldMiss) {
                this.shouldDelayMovement = true;
                this.delayAmount = 150 + Math.random() * 200;
                
                const missError = (Math.random() - 0.5) * (40 + this.nervousness * 10);
                baseTargetY += missError;
                
                // Natural movement adjustments
                this.nervousness = Math.min(1.0, this.nervousness + 0.3);
            } else {
                this.shouldDelayMovement = false;
                this.delayAmount = 0;
                
                if (this.currentStrategy === "positioning") {
                    const ballSpeed = Math.sqrt(view.ballVX * view.ballVX + view.ballVY * view.ballVY);
                    const speedError = (ballSpeed - 4) * (2 + this.nervousness);
                    baseTargetY += speedError;
                }
            }
        } else {
            // Ball is going away
            const centerY = view.fieldHeight / 2;
            if (this.currentStrategy !== "waiting") {
                this.currentStrategy = "waiting";
                this.lastStrategyChange = now;

                this.targetPositionOffset = (Math.random() - 0.5) * (40 + this.nervousness * 20);
                this.nervousness *= 0.95;
            }
            
            // Return to center
            const returnSpeed = 0.15 + Math.random() * 0.1;
            baseTargetY = paddleCenter + (centerY - paddleCenter) * returnSpeed + this.targetPositionOffset;
            
            // Restless movements
            if (Math.random() < 0.05) {
                this.targetPositionOffset += (Math.random() - 0.5) * 25;
            }
            
            this.targetPositionOffset *= 0.98;
        }

        // Jittering and hesitation effects
        baseTargetY = this.applyHumanEffects(baseTargetY);

        // Apply reaction errors with nervousness
        if (Math.random() < (0.06 + this.nervousness * 0.04)) {
            const baseError = (Math.random() - 0.5) * (20 + this.nervousness * 15);
            const strategyMultiplier = this.currentStrategy === "positioning" ? 1.5 : 1.0;
            this.reactionError = baseError * strategyMultiplier;
        }
        
        this.reactionError *= this.errorDecay;
        const targetY = baseTargetY + this.reactionError;

        // Calculate movement with strategy-based tolerance
        const diff = targetY - paddleCenter;
        
        // Dynamic tolerance based on strategy and nervousness
        let tolerance: number;
        switch (this.currentStrategy) {
            case "positioning":
                tolerance = 50 + this.nervousness * 20;
                break;
            case "intercepting":
                tolerance = 25 + this.nervousness * 15;
                break;
            case "waiting":
                tolerance = 60 + this.nervousness * 10;
                break;
        }

        // If bot is stuck, reduce tolerance
        if (this.stuckCounter > 3) {
            tolerance = Math.max(5, tolerance * 0.3);
        }

        // Set movement decision and duration
        if (Math.abs(diff) > tolerance && !this.isHesitating) {
            const paddleSpeed = 6;
            const pixelsToMove = Math.abs(diff);
            
            // Calculate movement
            let efficiency = 0.9 - this.nervousness * 0.2;
            if (this.currentStrategy === "positioning") {
                efficiency = (0.7 + Math.random() * 0.3) - this.nervousness * 0.15;
            } else if (this.currentStrategy === "intercepting") {
                efficiency = 0.95 - this.nervousness * 0.1;
            }
            
            if (this.stuckCounter > 3) {
                efficiency = Math.min(1.0, efficiency * 1.5);
            }
            
            const framesNeeded = Math.ceil(pixelsToMove / paddleSpeed);
            let timeNeeded = framesNeeded * 16.67 * (1 / Math.max(0.3, efficiency));
            
            // Apply delay if miss
            if (this.shouldDelayMovement && this.stuckCounter <= 2) {
                timeNeeded += this.delayAmount;
                timeNeeded *= (1.3 + this.nervousness * 0.3);
            }
            
            timeNeeded = Math.min(950, timeNeeded);
            
            this.movementStartTime = now;
            this.movementDuration = timeNeeded;
            
            if (diff > 0) {
                this.currentKeyDown = true;
                this.currentKeyUp = false;
            } else {
                this.currentKeyUp = true;
                this.currentKeyDown = false;
            }
        } else {
            if (this.isHesitating && this.stuckCounter <= 2) {
                this.currentKeyUp = false;
                this.currentKeyDown = false;
                this.movementDuration = 0;
            } else if (this.currentStrategy === "intercepting" && Math.abs(diff) > 10) {
            } else {
                this.currentKeyUp = false;
                this.currentKeyDown = false;
                this.movementDuration = 0;
            }
        }
        
        this.lastBallDistance = distanceToBot;
        this.lastPaddleY = view.rightY;
    }

    private detectStuckState(view: BotView, now: number) {
        if (now - this.lastMovementCheck > 2000) {
            const paddleMovement = Math.abs(view.rightY - this.lastPaddleY);
            
            if (paddleMovement < 5 && view.ballVX > 0) {
                this.stuckCounter++;
                
                if (this.stuckCounter > 5) {
                    this.forceUnstuck(view, now);
                }
            } else if (paddleMovement > 10) {
                this.stuckCounter = Math.max(0, this.stuckCounter - 1);
            }
            
            this.lastMovementCheck = now;
        }
    }

    private forceUnstuck(view: BotView, now: number) {
        const centerY = view.fieldHeight / 2;
        const paddleCenter = view.rightY + view.paddleHeight / 2;
        
        let targetY: number;
        if (view.ballVX > 0) {
            targetY = this.predictBallY(view);
        } else {
            targetY = centerY;
        }
        
        const diff = targetY - paddleCenter;
        
        if (Math.abs(diff) > 5) {
            this.movementStartTime = now;
            this.movementDuration = 500;
            
            if (diff > 0) {
                this.currentKeyDown = true;
                this.currentKeyUp = false;
            } else {
                this.currentKeyUp = true;
                this.currentKeyDown = false;
            }
            
            this.stuckCounter = 0;
            this.isHesitating = false;
            this.shouldDelayMovement = false;
        }
    }

    private updateNervousness(view: BotView, distanceToBot: number) {
        const ballSpeed = Math.sqrt(view.ballVX * view.ballVX + view.ballVY * view.ballVY);
        
        if (view.ballVX > 0 && distanceToBot < 200) {
            const speedFactor = (ballSpeed - 3) / 5;
            const distanceFactor = (200 - distanceToBot) / 200;
            this.nervousness = Math.min(0.7, this.nervousness + (speedFactor + distanceFactor) * 0.015);
        } else {
            this.nervousness *= 0.985;
        }
        
        if (Math.abs(distanceToBot - this.lastBallDistance) > 20) {
            this.nervousness = Math.min(0.6, this.nervousness + 0.05);
        }
    }

    private handleHumanBehaviors(now: number) {
        if (this.nervousness > 0.3 && !this.isJittering && Math.random() < 0.1) {
            this.isJittering = true;
            this.jitterStartTime = now;
            this.jitterDirection = Math.random() < 0.5 ? "up" : "down";
            this.lastJitterChange = now;
        }
        
        if (this.isJittering) {
            if (now - this.jitterStartTime > 500 || this.nervousness < 0.2) {
                this.isJittering = false;
                this.jitterDirection = "none";
            } else {
                if (now - this.lastJitterChange > 100 + Math.random() * 200) {
                    this.jitterDirection = Math.random() < 0.5 ? "up" : "down";
                    this.lastJitterChange = now;
                }
            }
        }
        
        if (this.isHesitating) {
            this.hesitationTime -= 16.67;
            if (this.hesitationTime <= 0) {
                this.isHesitating = false;
            }
        }
    }

    private applyHumanEffects(targetY: number): number {
        let adjustedTargetY = targetY;
        
        if (this.isJittering) {
            const jitterAmount = 15 + this.nervousness * 10;
            if (this.jitterDirection === "up") {
                adjustedTargetY -= jitterAmount;
            } else if (this.jitterDirection === "down") {
                adjustedTargetY += jitterAmount;
            }
        }
        
        if (this.nervousness > 0.1 && Math.random() < this.nervousness * 0.3) {
            const microMovement = (Math.random() - 0.5) * this.nervousness * 20;
            adjustedTargetY += microMovement;
        }
        
        return adjustedTargetY;
    }

    private shouldMissThisBall(view: BotView): boolean {
        const now = Date.now();
        const timeSinceBallStart = now - this.ballStartTime;
        
        // Don't miss for the first 3 seconds after ball starts/resets
        if (timeSinceBallStart < 3000) {
            return false;
        }
        
        const startupFactor = Math.min(1.0, (timeSinceBallStart - 3000) / 2000);
        
        const distanceToBot = view.fieldWidth - view.ballX;
        const distanceFactor = Math.max(0, (300 - distanceToBot) / 300);
        
        const ballSpeed = Math.sqrt(view.ballVX * view.ballVX + view.ballVY * view.ballVY);
        const speedFactor = Math.max(0, (ballSpeed - 3) / 5);
        
        let strategyFactor = 0;
        if (this.currentStrategy === "positioning") {
            strategyFactor = 0.01 + this.nervousness * 0.015;
        } else if (this.currentStrategy === "intercepting") {
            strategyFactor = 0.03 + this.nervousness * 0.03;
        }
        
        const performanceFactor = Math.min(0.05, this.consecutiveHits * 0.01);
        
        const ballCenterY = view.ballY + view.ballHeight / 2;
        const paddleCenter = view.rightY + view.paddleHeight / 2;
        const positionDiff = Math.abs(ballCenterY - paddleCenter);
        const positionFactor = Math.min(0.15, positionDiff / 300);
        
        const nervousnessFactor = this.nervousness * 0.06;
        
        const recoveryFactor = Math.max(0, (this.consecutiveHits - 3) * -0.02);
        
        const totalMissProbability = Math.min(0.30,
            (distanceFactor * 0.08 +
            speedFactor * 0.06 +
            strategyFactor +
            performanceFactor + 
            positionFactor +
            nervousnessFactor +
            recoveryFactor +
            0.012) * startupFactor
        );
        
        return Math.random() < totalMissProbability;
    }

    recordHit() {
        this.consecutiveHits++;
        this.targetPositionOffset *= 0.5;
        this.nervousness = Math.max(0, this.nervousness - 0.25);
    }

    recordMiss() {
        this.consecutiveHits = Math.max(0, this.consecutiveHits - 1);
        this.targetPositionOffset = (Math.random() - 0.5) * 30;
        this.nervousness = Math.min(0.6, this.nervousness + 0.15);
    }

    getCurrentKeys(): { ArrowUp: boolean; ArrowDown: boolean } {
        const now = Date.now();
        
        if (this.isJittering && !this.isHesitating) {
            if (this.jitterDirection === "up") {
                return { ArrowUp: true, ArrowDown: false };
            } else if (this.jitterDirection === "down") {
                return { ArrowUp: false, ArrowDown: true };
            }
        }
        
        // Apply delay and strategy-based timing
        let effectiveStartTime = this.movementStartTime;
        if (this.shouldDelayMovement && this.stuckCounter <= 2) {
            effectiveStartTime += this.delayAmount;
        }
        
        let timingError = this.nervousness * 20;
        if (this.currentStrategy === "positioning") {
            timingError += Math.random() * 40;
        } else if (this.currentStrategy === "intercepting") {
            timingError += Math.random() * 15;
        }
        
        if (this.stuckCounter > 3) {
            timingError *= 0.3;
        }
        
        const timeInMovement = now - effectiveStartTime;
        const shouldMove = this.movementDuration > 0 && 
                          (timeInMovement + timingError) >= 0 && 
                          timeInMovement < this.movementDuration && 
                          (!this.isHesitating || this.stuckCounter > 2);
        
        if (shouldMove) {
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
        const { ballX, ballY, ballVX, ballVY, ballHeight, fieldWidth, fieldHeight } = view;
        
        if (ballVX <= 0) {
            return ballY + ballHeight / 2;
        }

        let x = ballX;
        let y = ballY;
        let vx = ballVX;
        let vy = ballVY;

        const paddleX = fieldWidth - 32 - 16;
        let steps = 0;
        const maxSteps = 150;

        while (x < paddleX && steps < maxSteps && vx > 0) {
            x += vx;
            y += vy;
            steps++;

            if (y <= 0) {
                y = 0;
                vy = Math.abs(vy);
            } else if (y >= fieldHeight - ballHeight) {
                y = fieldHeight - ballHeight;
                vy = -Math.abs(vy);
            }
        }

        // Add strategy-based prediction error with nervousness
        let predictionError = this.nervousness * 15;
        if (this.currentStrategy === "positioning") {
            predictionError += (Math.random() - 0.5) * (25 + this.nervousness * 10);
        } else {
            predictionError += (Math.random() - 0.5) * (10 + this.nervousness * 5);
        }
        
        const predictedCenter = y + ballHeight / 2 + predictionError;
        
        return Math.max(
            ballHeight / 2, 
            Math.min(fieldHeight - ballHeight / 2, predictedCenter)
        );
    }
}