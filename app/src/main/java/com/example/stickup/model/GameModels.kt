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
    var arrowAmmo: Int = 0,
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

enum class EnemyType { SLIME, GOBLIN, ARCHER, ZOMBIE }

data class Enemy(
    var platform: Platform,
    var x: Float = platform.x + platform.width / 2f,
    var y: Float = platform.y - 16f,
    val width: Float = 32f,
    val height: Float = 30f,
    var vx: Float = 55f,
    var facing: Float = 1f,
    val type: EnemyType = when {
        Math.random() < 0.32 -> EnemyType.ZOMBIE
        Math.random() < 0.64 -> EnemyType.ARCHER
        Math.random() < 0.82 -> EnemyType.SLIME
        else -> EnemyType.GOBLIN
    },
    var active: Boolean = true,
    var animTimer: Float = 0f,
    var shootCooldown: Float = (2..4).random().toFloat(),
    var stunTimer: Float = 0f,
    var dizzyAngle: Float = 0f,
    var isJumping: Boolean = false,
    var vy: Float = 0f,
    var chaseJumpsRemaining: Int = (1..4).random(),
    var maxChaseJumps: Int = (1..4).random(),
    var jumpCooldown: Float = 1.0f,
    var bowBroken: Boolean = false,
    var isAiming: Boolean = false,
    var aimAngle: Float = 0f
) {
    fun update(dt: Float, playerX: Float = 0f, playerY: Float = 0f, platforms: List<Platform> = emptyList()) {
        if (!active) return

        if (stunTimer > 0f) {
            stunTimer -= dt
            dizzyAngle += dt * 8f
            isAiming = false
            if (!isJumping) {
                y = platform.y - 16f
            }
            return
        }

        animTimer += dt * 6f
        shootCooldown -= dt

        // Archer Elf 360-degree Aiming
        if (type == EnemyType.ARCHER && !bowBroken) {
            val dx = playerX - x
            val dy = playerY - y
            val dist = kotlin.math.hypot(dx, dy)
            val isStraightDown = dy > 30f && kotlin.math.abs(dx) < 36f

            if (dist < 420f && !isStraightDown) {
                aimAngle = kotlin.math.atan2(dy, dx)
                facing = if (dx >= 0f) 1f else -1f
                if (shootCooldown <= 0.45f) {
                    isAiming = true
                }
            } else {
                isAiming = false
            }
        }

        // Platform Jumping & Chase (Zombie & Archer Elf)
        val canJumpChase = (type == EnemyType.ZOMBIE || type == EnemyType.ARCHER) && platforms.isNotEmpty()
        if (canJumpChase) {
            val dx = playerX - x
            val dy = playerY - y
            val distY = kotlin.math.abs(dy)
            val distX = kotlin.math.abs(dx)

            if (isJumping) {
                vy += 850f * dt
                x += vx * dt
                y += vy * dt

                if (vy > 0f) {
                    for (plat in platforms) {
                        if (plat.broken) continue
                        val feetY = y + 15f
                        val prevFeetY = feetY - vy * dt
                        if (feetY >= plat.y && prevFeetY <= plat.y + 16f) {
                            if (x >= plat.x - 10f && x <= plat.x + plat.width + 10f) {
                                platform = plat
                                y = plat.y - 16f
                                vy = 0f
                                isJumping = false
                                jumpCooldown = 1.0f
                                break
                            }
                        }
                    }
                }

                if (y > platform.y + 260f) {
                    y = platform.y - 16f
                    vy = 0f
                    isJumping = false
                    chaseJumpsRemaining = 0
                }
                return
            }

            y = platform.y - 16f
            val canChase = chaseJumpsRemaining > 0 && distY < 340f && distX < 280f

            if (canChase) {
                facing = if (dx > 0f) 1f else -1f
                vx = facing * (if (type == EnemyType.ARCHER) 48f else 55f)
                jumpCooldown -= dt

                val needsJump = distY > 35f
                if (jumpCooldown <= 0f && needsJump) {
                    var targetPlat: Platform? = null
                    var bestDist = 9999f

                    for (plat in platforms) {
                        if (plat == platform || plat.broken) continue
                        val pdy = plat.y - y
                        val sameDir = (dy < 0f && pdy < -30f && pdy > -180f) || (dy > 0f && pdy > 30f && pdy < 180f)
                        if (sameDir) {
                            val pdx = (plat.x + plat.width / 2f) - x
                            val d = kotlin.math.hypot(pdx, pdy)
                            if (d < bestDist && d < 260f) {
                                bestDist = d
                                targetPlat = plat
                            }
                        }
                    }

                    if (targetPlat != null) {
                        isJumping = true
                        chaseJumpsRemaining--
                        val targetX = targetPlat.x + targetPlat.width / 2f
                        vy = if (dy < 0f) -480f else -240f
                        vx = ((targetX - x) / 0.5f).coerceIn(-130f, 130f)
                        return
                    }
                }
            } else {
                if (kotlin.math.abs(vx) > 42f) {
                    vx = facing * 42f
                }
                if (distY > 400f && chaseJumpsRemaining < maxChaseJumps) {
                    chaseJumpsRemaining = maxChaseJumps
                }
            }
        }

        x += vx * dt
        val minX = platform.x + width / 2f
        val maxX = platform.x + platform.width - width / 2f

        if (x < minX) {
            x = minX
            vx = kotlin.math.abs(vx)
            facing = 1f
        } else if (x > maxX) {
            x = maxX
            vx = -kotlin.math.abs(vx)
            facing = -1f
        }
        y = platform.y - 16f
    }
}

data class Arrow(
    var x: Float,
    var y: Float,
    val vx: Float,
    val vy: Float = 0f,
    val angle: Float = kotlin.math.atan2(vy, vx),
    var active: Boolean = true,
    val isPlayerArrow: Boolean = false
) {
    fun update(dt: Float) {
        x += vx * dt
        y += vy * dt
        if (x < -120f || x > GameConstants.GAME_WIDTH + 120f) {
            active = false
        }
    }
}

data class FallingHazard(
    var x: Float,
    var y: Float,
    val radius: Float = 18f,
    val vy: Float = 520f,
    var warningTimer: Float = 1.0f,
    var active: Boolean = true,
    var rotation: Float = 0f
) {
    fun update(dt: Float, cameraY: Float) {
        if (warningTimer > 0f) {
            warningTimer -= dt
            y = cameraY - 40f
            return
        }
        rotation += dt * 6.5f
        y += vy * dt
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
