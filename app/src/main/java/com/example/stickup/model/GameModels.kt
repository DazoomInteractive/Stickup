package com.example.stickup.model

import androidx.compose.ui.graphics.Color
import com.example.stickup.engine.GameConstants
import kotlin.math.sin

enum class GameState {
    SPLASH,
    MAIN_MENU,
    PLAYING,
    PAUSED,
    GAME_OVER,
    SHOP
}

enum class PlatformType {
    STATIC,
    MOVING,
    BREAKABLE,
    FADING,
    SPRING
}

data class Platform(
    var x: Float,
    var y: Float,
    val width: Float = GameConstants.PLATFORM_WIDTH,
    val height: Float = GameConstants.PLATFORM_HEIGHT,
    val type: PlatformType = PlatformType.STATIC,
    var movingRange: Float = 120f,
    var movingSpeed: Float = 90f,
    var direction: Float = 1f,
    var originX: Float = x,
    var broken: Boolean = false,
    var breakTimer: Float = 0f,
    var fadePhase: Float = (0..6).random().toFloat(),
    var fadeAlpha: Float = 1f,
    var isSolid: Boolean = true,
    var dipOffset: Float = 0f,
    var dipVelocity: Float = 0f,
    var springCompressed: Float = 0f
) {
    fun update(dt: Float) {
        if (type == PlatformType.MOVING) {
            x += direction * movingSpeed * dt
            if (x < originX - movingRange / 2f) {
                x = originX - movingRange / 2f
                direction = 1f
            } else if (x > originX + movingRange / 2f) {
                x = originX + movingRange / 2f
                direction = -1f
            }
            if (x < 10f) { x = 10f; direction = 1f }
            if (x + width > GameConstants.GAME_WIDTH - 10f) { x = GameConstants.GAME_WIDTH - 10f - width; direction = -1f }
        }

        if (type == PlatformType.BREAKABLE && broken) {
            breakTimer += dt
        }

        if (type == PlatformType.FADING) {
            fadePhase += dt * 2.5f
            val s = sin(fadePhase)
            fadeAlpha = ((s + 1f) / 2f).coerceIn(0.15f, 1f)
            isSolid = fadeAlpha > 0.45f
        }

        // Spring dip recovery
        if (dipOffset > 0f || dipVelocity != 0f) {
            dipVelocity -= dipOffset * 80f * dt
            dipOffset += dipVelocity * dt
            if (dipOffset < 0f) {
                dipOffset = 0f
                dipVelocity = 0f
            }
        }

        if (springCompressed > 0f) {
            springCompressed = (springCompressed - dt * 4f).coerceAtLeast(0f)
        }
    }
}

data class Player(
    var x: Float,
    var y: Float,
    var vx: Float = 0f,
    var vy: Float = 0f,
    val width: Float = GameConstants.PLAYER_WIDTH,
    val height: Float = GameConstants.PLAYER_HEIGHT,
    var scaleX: Float = 1f,
    var scaleY: Float = 1f,
    var tilt: Float = 0f,
    var hasShield: Boolean = false,
    var shieldTimer: Float = 0f,
    var hasJetpack: Boolean = false,
    var jetpackTimer: Float = 0f,
    var jetpackMax: Float = GameConstants.JETPACK_BASE_DURATION,
    var hasMagnet: Boolean = false,
    var magnetTimer: Float = 0f,
    var magnetMax: Float = GameConstants.MAGNET_BASE_DURATION,
    var hasMultiplier: Boolean = false,
    var multiplierTimer: Float = 0f,
    var multiplierMax: Float = GameConstants.MULTIPLIER_BASE_DURATION,
    var skinColor: Color = Color(0xFF2B2B2B),
    var skinAccent: Color = Color(0xFF4A90D9),
    var hat: String? = null
) {
    val centerX: Float get() = x + width / 2f
    val centerY: Float get() = y + height / 2f
    val feetY: Float get() = y + height

    fun bounce(spring: Boolean = false) {
        vy = if (spring) GameConstants.SPRING_VELOCITY else GameConstants.JUMP_VELOCITY
        scaleX = 1.35f
        scaleY = 0.65f
    }

    fun update(dt: Float) {
        if (hasJetpack) {
            jetpackTimer -= dt
            vy = -GameConstants.JETPACK_SPEED
            if (jetpackTimer <= 0f) {
                hasJetpack = false
                vy = -400f
            }
        } else {
            vy = (vy + GameConstants.GRAVITY * dt).coerceAtMost(GameConstants.MAX_FALL_SPEED)
        }

        x += vx * dt
        y += vy * dt

        // Wrap around screen edges
        if (x + width < 0f) {
            x = GameConstants.GAME_WIDTH
        } else if (x > GameConstants.GAME_WIDTH) {
            x = -width
        }

        // Tilt based on horizontal velocity
        val targetTilt = (vx / GameConstants.MOVE_SPEED) * 0.25f
        tilt += (targetTilt - tilt) * (12f * dt).coerceAtMost(1f)

        // Elastic scale recovery
        scaleX += (1f - scaleX) * (14f * dt).coerceAtMost(1f)
        scaleY += (1f - scaleY) * (14f * dt).coerceAtMost(1f)

        // Power-up timers
        if (hasShield) {
            shieldTimer -= dt
            if (shieldTimer <= 0f) hasShield = false
        }
        if (hasMagnet) {
            magnetTimer -= dt
            if (magnetTimer <= 0f) hasMagnet = false
        }
        if (hasMultiplier) {
            multiplierTimer -= dt
            if (multiplierTimer <= 0f) hasMultiplier = false
        }
    }
}

data class Merchant(
    val platform: Platform,
    var x: Float = platform.x + platform.width / 2f,
    var y: Float = platform.y - 28f,
    val pricePerDiamond: Int = listOf(15, 30, 55, 90, 160).random(),
    var timeLeft: Float = 16f,
    var active: Boolean = true,
    var animTimer: Float = 0f
) {
    fun update(dt: Float) {
        animTimer += dt * 4f
        timeLeft -= dt
        if (timeLeft <= 0f) active = false
        x = platform.x + platform.width / 2f
        y = platform.y - 28f
    }
}

enum class EnemyType { SLIME, GOBLIN, ARCHER }

data class Enemy(
    val platform: Platform,
    var x: Float = platform.x + platform.width / 2f,
    var y: Float = platform.y - 16f,
    val width: Float = 32f,
    val height: Float = 30f,
    var vx: Float = 55f,
    var facing: Float = 1f,
    val type: EnemyType = if (Math.random() < 0.5) EnemyType.SLIME else EnemyType.GOBLIN,
    var active: Boolean = true,
    var animTimer: Float = 0f,
    var shootCooldown: Float = (2..4).random().toFloat()
) {
    fun update(dt: Float) {
        if (!active) return
        animTimer += dt * 6f
        shootCooldown -= dt

        x += vx * dt
        val minX = platform.x + width / 2f
        val maxX = platform.x + platform.width - width / 2f

        if (x < minX) {
            x = minX
            vx = vx.coerceAtLeast(0f).let { if (it == 0f) 55f else it }
            facing = 1f
        } else if (x > maxX) {
            x = maxX
            vx = -vx.coerceAtLeast(0f).let { if (it == 0f) -55f else -it }
            facing = -1f
        }
        y = platform.y - 16f
    }
}

data class Arrow(
    var x: Float,
    var y: Float,
    val vx: Float,
    var active: Boolean = true
) {
    fun update(dt: Float) {
        x += vx * dt
        if (x < -80f || x > GameConstants.GAME_WIDTH + 80f) {
            active = false
        }
    }
}

data class Diamond(
    var x: Float,
    var y: Float,
    var active: Boolean = true,
    var animTimer: Float = (0..6).random().toFloat()
) {
    fun update(dt: Float) {
        animTimer += dt * 3f
    }
}

data class Coin(
    var x: Float,
    var y: Float,
    var active: Boolean = true,
    var animTimer: Float = 0f
) {
    fun update(dt: Float) {
        animTimer += dt * 4f
    }
}

enum class PowerUpType { SHIELD, JETPACK, MAGNET, MULTIPLIER }

data class PowerUp(
    val type: PowerUpType,
    var x: Float,
    var y: Float,
    var active: Boolean = true,
    var animTimer: Float = 0f
) {
    fun update(dt: Float) {
        animTimer += dt * 4f
    }
}

data class Particle(
    var x: Float,
    var y: Float,
    var vx: Float,
    var vy: Float,
    var life: Float,
    val maxLife: Float,
    val size: Float,
    val color: Color
)

data class FloatingText(
    var x: Float,
    var y: Float,
    var vy: Float = -40f,
    var life: Float = 1.2f,
    val maxLife: Float = 1.2f,
    val text: String,
    val color: Color
)

// Shop Models
data class UpgradeItem(
    val id: String,
    val name: String,
    val icon: String,
    val level: Int,
    val maxLevel: Int = 10,
    val cost: Int,
    val desc: String
)

data class SkinItem(
    val id: String,
    val name: String,
    val icon: String,
    val cost: Int,
    val color: Color,
    val accent: Color,
    val hat: String? = null
)

data class TrailItem(
    val id: String,
    val name: String,
    val icon: String,
    val cost: Int,
    val color: Color
)

data class BackgroundItem(
    val id: String,
    val name: String,
    val icon: String,
    val cost: Int,
    val topColor: Color,
    val botColor: Color
)
