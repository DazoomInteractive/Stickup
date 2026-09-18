package com.example.stickup.engine

import androidx.compose.ui.graphics.Color
import com.example.stickup.audio.SoundManager
import com.example.stickup.data.GamePreferences
import com.example.stickup.model.*
import kotlin.math.abs
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.random.Random

class GameEngine(
    val sound: SoundManager,
    val prefs: GamePreferences
) {
    var state: GameState = GameState.SPLASH
    var player: Player = Player((GameConstants.GAME_WIDTH - GameConstants.PLAYER_WIDTH) / 2f, GameConstants.GAME_HEIGHT - 200f)

    val platforms = mutableListOf<Platform>()
    val merchants = mutableListOf<Merchant>()
    val enemies = mutableListOf<Enemy>()
    val arrows = mutableListOf<Arrow>()
    val diamonds = mutableListOf<Diamond>()
    val coins = mutableListOf<Coin>()
    val powerUps = mutableListOf<PowerUp>()
    val particles = mutableListOf<Particle>()
    val floatingTexts = mutableListOf<FloatingText>()

    var cameraY = 0f
    var heightMeters = 0
    var diamondCount = 0
    var coinCount = 0
    var sessionSavedDiamonds = 0
    var sessionLostDiamonds = 0
    var hasRevived = false
    var isNewHighScore = false

    var highestY = 0f
    private var highestPlatformY = 0f
    var lavaY = GameConstants.GAME_HEIGHT + 350f
    var activeNearMerchant: Merchant? = null

    init {
        applyEquippedCustomization()
    }

    fun applyEquippedCustomization() {
        val skinId = prefs.selectedSkin
        val (color, accent, hat) = when (skinId) {
            "blue_runner" -> Triple(Color(0xFF1D4ED8), Color(0xFF60A5FA), null)
            "crimson_bandit" -> Triple(Color(0xFF991B1B), Color(0xFFF87171), null)
            "forest_ranger" -> Triple(Color(0xFF065F46), Color(0xFF34D399), null)
            "ninja" -> Triple(Color(0xFF1E1B4B), Color(0xFFEF4444), "ninja_bandana")
            "viking" -> Triple(Color(0xFF334155), Color(0xFFE2E8F0), "viking_horns")
            "cyber_neon" -> Triple(Color(0xFF06B6D4), Color(0xFFF43F5E), "visor")
            "royal_knight" -> Triple(Color(0xFF475569), Color(0xFF38BDF8), "knight_helmet")
            "deep_diver" -> Triple(Color(0xFF0E7490), Color(0xFF67E8F9), "diver_goggles")
            "astronaut" -> Triple(Color(0xFFF8FAFC), Color(0xFF38BDF8), "astronaut_dome")
            "pharaoh" -> Triple(Color(0xFF854D0E), Color(0xFFFACC15), "pharaoh_nemes")
            "gold_king" -> Triple(Color(0xFFF59E0B), Color(0xFFFEF08A), "crown")
            "cosmic_god" -> Triple(Color(0xFF312E81), Color(0xFFE0E7FF), "halo")
            else -> Triple(Color(0xFF2B2B2B), Color(0xFF4A90D9), null)
        }
        player.skinColor = color
        player.skinAccent = accent
        player.hat = hat
    }

    fun startNewGame() {
        applyEquippedCustomization()
        player.x = (GameConstants.GAME_WIDTH - GameConstants.PLAYER_WIDTH) / 2f
        player.y = GameConstants.GAME_HEIGHT - 200f
        player.vx = 0f
        player.vy = GameConstants.JUMP_VELOCITY
        player.hasShield = false
        player.hasJetpack = false
        player.hasMagnet = false
        player.hasMultiplier = false

        platforms.clear()
        merchants.clear()
        enemies.clear()
        arrows.clear()
        diamonds.clear()
        coins.clear()
        powerUps.clear()
        particles.clear()
        floatingTexts.clear()

        cameraY = 0f
        heightMeters = 0
        diamondCount = 0
        coinCount = 0
        sessionSavedDiamonds = 0
        sessionLostDiamonds = 0
        hasRevived = false
        isNewHighScore = false
        highestY = player.y
        lavaY = GameConstants.GAME_HEIGHT + 350f
        activeNearMerchant = null

        // Initial ground platform
        val startPlat = Platform(
            x = (GameConstants.GAME_WIDTH - 120f) / 2f,
            y = GameConstants.GAME_HEIGHT - 120f,
            width = 120f,
            type = PlatformType.STATIC
        )
        platforms.add(startPlat)
        highestPlatformY = startPlat.y

        // Generate initial batch of platforms upwards
        generatePlatformsUpTo(player.y - 1200f)

        state = GameState.PLAYING
        sound.playJump()
    }

    fun update(dt: Float) {
        if (state != GameState.PLAYING) return

        player.update(dt)

        // Trail particles
        if (player.vy < -100f || player.hasJetpack) {
            spawnTrailParticle(player.centerX, player.feetY)
        }

        // Camera smoothly follows player upwards
        val targetCamY = player.y - (GameConstants.GAME_HEIGHT - GameConstants.CAMERA_OFFSET)
        if (targetCamY < cameraY) {
            cameraY += (targetCamY - cameraY) * (8f * dt).coerceAtMost(1f)
        }

        // Calculate altitude in meters
        if (player.y < highestY) {
            highestY = player.y
            val meters = ((GameConstants.GAME_HEIGHT - 200f - highestY) / GameConstants.PIXELS_PER_METER).toInt().coerceAtLeast(0)
            if (meters > heightMeters) {
                heightMeters = meters
                if (heightMeters > prefs.highScore) {
                    prefs.highScore = heightMeters
                    isNewHighScore = true
                }
            }
        }

        // Update Platforms
        for (plat in platforms) {
            plat.update(dt)

            // Platform collision (only when falling downwards)
            if (player.vy > 0f && !player.hasJetpack) {
                val pFeet = player.feetY
                val prevFeet = pFeet - player.vy * dt
                if (pFeet >= plat.y && prevFeet <= plat.y + 12f) {
                    if (player.centerX >= plat.x - 12f && player.centerX <= plat.x + plat.width + 12f) {
                        if (plat.isSolid && (!plat.broken || plat.breakTimer == 0f)) {
                            // Bounce!
                            val isSpring = plat.type == PlatformType.SPRING
                            player.bounce(isSpring)
                            plat.dipOffset = if (isSpring) 12f else 6f
                            plat.dipVelocity = 140f
                            if (isSpring) {
                                plat.springCompressed = 1f
                                sound.playSpring()
                                spawnSpringParticles(plat.x + plat.width / 2f, plat.y)
                            } else {
                                sound.playJump()
                                spawnDustParticles(player.centerX, plat.y)
                            }

                            if (plat.type == PlatformType.BREAKABLE) {
                                plat.broken = true
                                spawnBreakParticles(plat.x + plat.width / 2f, plat.y)
                            }
                        }
                    }
                }
            }
        }

        // Clean up broken/fallen platforms
        platforms.removeAll { it.y > cameraY + GameConstants.GAME_HEIGHT + 150f || (it.type == PlatformType.BREAKABLE && it.breakTimer > 0.4f) }

        // Generate platforms infinitely as player ascends
        generatePlatformsUpTo(cameraY - 400f)

        // Update Merchants
        var foundNearMerchant: Merchant? = null
        for (merchant in merchants) {
            merchant.update(dt)
            if (merchant.active) {
                val dist = hypot(player.centerX - merchant.x, player.centerY - merchant.y)
                if (dist < 80f) {
                    foundNearMerchant = merchant
                }
            }
        }
        activeNearMerchant = foundNearMerchant
        merchants.removeAll { !it.active || it.y > cameraY + GameConstants.GAME_HEIGHT + 150f }

        // Update Enemies
        for (enemy in enemies) {
            enemy.update(dt)
            if (!enemy.active) continue

            // Check stomp from above
            if (player.vy > 0f && player.feetY >= enemy.y - 10f && player.feetY <= enemy.y + 20f) {
                if (abs(player.centerX - enemy.x) < (enemy.width / 2f + player.width / 2f)) {
                    // Stomp success!
                    enemy.active = false
                    player.bounce(true)
                    val stompCoins = if (player.hasMultiplier) 10 else 5
                    coinCount += stompCoins
                    sound.playStomp()
                    spawnFloatingText(enemy.x, enemy.y, "+$stompCoins 🪙", Color(0xFFFFB703))
                    spawnExplosionParticles(enemy.x, enemy.y, Color(0xFFA855F7))
                    continue
                }
            }

            // Touching enemy body
            val dist = hypot(player.centerX - enemy.x, player.centerY - enemy.y)
            if (dist < 32f) {
                if (player.hasShield) {
                    player.hasShield = false
                    enemy.active = false
                    sound.playPowerUp()
                    spawnExplosionParticles(enemy.x, enemy.y, Color(0xFF38BDF8))
                    spawnFloatingText(player.centerX, player.y, "SHIELD POP!", Color(0xFF38BDF8))
                } else if (!player.hasJetpack) {
                    gameOver("Hit by monster!")
                    return
                }
            }

            // Archer enemy shoots arrows
            if (enemy.type == EnemyType.ARCHER && enemy.shootCooldown <= 0f) {
                enemy.shootCooldown = 3.5f
                arrows.add(Arrow(enemy.x, enemy.y, enemy.facing * 280f))
                sound.playShoot()
            }
        }
        enemies.removeAll { !it.active || it.y > cameraY + GameConstants.GAME_HEIGHT + 150f }

        // Update Arrows
        for (arrow in arrows) {
            arrow.update(dt)
            if (!arrow.active) continue

            val dist = hypot(player.centerX - arrow.x, player.centerY - arrow.y)
            if (dist < 24f) {
                if (player.hasShield) {
                    player.hasShield = false
                    arrow.active = false
                    sound.playPowerUp()
                    spawnFloatingText(player.centerX, player.y, "BLOCKED!", Color(0xFF38BDF8))
                } else if (!player.hasJetpack) {
                    gameOver("Shot by arrow!")
                    return
                }
            }
        }
        arrows.removeAll { !it.active }

        // Update Diamonds (Relics)
        val magnetRange = if (player.hasMagnet) {
            GameConstants.MAGNET_RADIUS + prefs.getUpgradeLevel("magnet") * 15f
        } else 35f

        for (dia in diamonds) {
            dia.update(dt)
            if (!dia.active) continue

            val dist = hypot(player.centerX - dia.x, player.centerY - dia.y)
            if (player.hasMagnet && dist < magnetRange) {
                // Pull toward player
                val angle = Math.atan2((player.centerY - dia.y).toDouble(), (player.centerX - dia.x).toDouble())
                dia.x += (Math.cos(angle) * 450.0 * dt).toFloat()
                dia.y += (Math.sin(angle) * 450.0 * dt).toFloat()
            }

            if (dist < 32f) {
                dia.active = false
                diamondCount++
                sound.playDiamond()
                spawnSparkleParticles(dia.x, dia.y, Color(0xFF38BDF8))
                spawnFloatingText(dia.x, dia.y, "+1 💎", Color(0xFF38BDF8))
            }
        }
        diamonds.removeAll { !it.active || it.y > cameraY + GameConstants.GAME_HEIGHT + 150f }

        // Update Powerups
        for (pu in powerUps) {
            pu.update(dt)
            if (!pu.active) continue

            val dist = hypot(player.centerX - pu.x, player.centerY - pu.y)
            if (dist < 36f) {
                pu.active = false
                sound.playPowerUp()
                when (pu.type) {
                    PowerUpType.SHIELD -> {
                        player.hasShield = true
                        player.shieldTimer = 10f + prefs.getUpgradeLevel("shield") * 1.5f
                        spawnFloatingText(pu.x, pu.y, "SHIELD!", Color(0xFF38BDF8))
                    }
                    PowerUpType.JETPACK -> {
                        player.hasJetpack = true
                        val dur = GameConstants.JETPACK_BASE_DURATION + prefs.getUpgradeLevel("jetpack") * 0.25f
                        player.jetpackTimer = dur
                        player.jetpackMax = dur
                        spawnFloatingText(pu.x, pu.y, "JETPACK!", Color(0xFFFF9800))
                    }
                    PowerUpType.MAGNET -> {
                        player.hasMagnet = true
                        val dur = GameConstants.MAGNET_BASE_DURATION + prefs.getUpgradeLevel("magnet") * 0.3f
                        player.magnetTimer = dur
                        player.magnetMax = dur
                        spawnFloatingText(pu.x, pu.y, "MAGNET!", Color(0xFFA855F7))
                    }
                    PowerUpType.MULTIPLIER -> {
                        player.hasMultiplier = true
                        val dur = GameConstants.MULTIPLIER_BASE_DURATION + prefs.getUpgradeLevel("coin_multiplier") * 0.25f
                        player.multiplierTimer = dur
                        player.multiplierMax = dur
                        spawnFloatingText(pu.x, pu.y, "2X BONUS!", Color(0xFFFFB703))
                    }
                }
            }
        }
        powerUps.removeAll { !it.active || it.y > cameraY + GameConstants.GAME_HEIGHT + 150f }

        // Update Lava
        val lavaSpeed = if (heightMeters < 25) 25f else (75f + min(60f, (heightMeters - 25) * 0.2f))
        lavaY -= lavaSpeed * dt
        val maxLagY = cameraY + GameConstants.GAME_HEIGHT + 220f
        if (lavaY > maxLagY) lavaY = maxLagY

        if (player.feetY >= lavaY + 10f) {
            gameOver("Burned by lava!")
            return
        }

        // Falling off screen bottom
        if (player.y > cameraY + GameConstants.GAME_HEIGHT + 60f) {
            gameOver("Fell into the abyss!")
            return
        }

        // Update Particles
        for (p in particles) {
            p.x += p.vx * dt
            p.y += p.vy * dt
            p.life -= dt
        }
        particles.removeAll { it.life <= 0f }

        // Update Floating Text
        for (ft in floatingTexts) {
            ft.y += ft.vy * dt
            ft.life -= dt
        }
        floatingTexts.removeAll { it.life <= 0f }
    }

    fun tradeWithMerchant(merchant: Merchant) {
        if (!merchant.active || diamondCount <= 0) return
        val baseMultiplier = if (player.hasMultiplier) 2 else 1
        val coinsEarned = diamondCount * merchant.pricePerDiamond * baseMultiplier
        coinCount += coinsEarned
        sessionSavedDiamonds += diamondCount

        sound.playTrade()
        spawnFloatingText(merchant.x, merchant.y - 20f, "+$coinsEarned 🪙!", Color(0xFFFFB703))
        spawnSparkleParticles(merchant.x, merchant.y, Color(0xFFFFB703))

        diamondCount = 0
        merchant.active = false
        activeNearMerchant = null
    }

    fun shootArrow() {
        if (state != GameState.PLAYING) return
        // Fire arrow in player facing direction or upwards
        val dir = if (player.vx >= 0f) 1f else -1f
        arrows.add(Arrow(player.centerX, player.centerY, dir * 320f))
        sound.playShoot()
        spawnFloatingText(player.centerX, player.centerY - 20f, "SWOOSH!", Color.White)
    }

    fun gameOver(reason: String) {
        state = GameState.GAME_OVER
        sound.playGameOver()

        // 50% Diamonds kept penalty
        sessionSavedDiamonds += (diamondCount * GameConstants.DEATH_RELIC_KEEP_RATE).toInt()
        sessionLostDiamonds = diamondCount - (diamondCount * GameConstants.DEATH_RELIC_KEEP_RATE).toInt()

        // Bank coins permanently
        prefs.bankedCoins += coinCount
    }

    fun revive() {
        if (hasRevived) return
        hasRevived = true
        state = GameState.PLAYING
        player.y = cameraY + GameConstants.GAME_HEIGHT / 2f
        player.vy = GameConstants.JUMP_VELOCITY * 1.2f
        player.hasShield = true
        player.shieldTimer = 5f
        lavaY = cameraY + GameConstants.GAME_HEIGHT + 200f
        sound.playPowerUp()
        spawnFloatingText(player.centerX, player.y, "REVIVED!", Color(0xFF22C55E))
    }

    private fun generatePlatformsUpTo(targetWorldY: Float) {
        while (highestPlatformY > targetWorldY) {
            val gap = Random.nextFloat() * (GameConstants.PLATFORM_MAX_GAP - GameConstants.PLATFORM_MIN_GAP) + GameConstants.PLATFORM_MIN_GAP
            highestPlatformY -= gap
            val platX = Random.nextFloat() * (GameConstants.GAME_WIDTH - GameConstants.PLATFORM_WIDTH - 20f) + 10f

            // Determine platform type based on altitude
            val currentMeters = ((GameConstants.GAME_HEIGHT - 200f - highestPlatformY) / GameConstants.PIXELS_PER_METER).toInt()
            val roll = Random.nextFloat()

            val type = when {
                currentMeters >= GameConstants.FADING_PLATFORM_START && roll < 0.20f -> PlatformType.FADING
                currentMeters >= GameConstants.BREAKABLE_PLATFORM_START && roll < 0.35f -> PlatformType.BREAKABLE
                currentMeters >= GameConstants.MOVING_PLATFORM_START && roll < 0.55f -> PlatformType.MOVING
                Random.nextFloat() < GameConstants.SPRING_SPAWN_CHANCE -> PlatformType.SPRING
                else -> PlatformType.STATIC
            }

            val platform = Platform(platX, highestPlatformY, type = type)
            platforms.add(platform)

            // Spawn Merchant?
            if (type == PlatformType.STATIC && currentMeters >= GameConstants.MERCHANT_MIN_METER && Random.nextFloat() < GameConstants.MERCHANT_SPAWN_CHANCE) {
                merchants.add(Merchant(platform))
            }

            // Spawn Enemy?
            if (type != PlatformType.BREAKABLE && currentMeters >= GameConstants.ENEMY_MIN_METER && Random.nextFloat() < GameConstants.ENEMY_SPAWN_CHANCE) {
                enemies.add(Enemy(platform))
            }

            // Spawn Diamond?
            if (Random.nextFloat() < GameConstants.RELIC_SPAWN_CHANCE) {
                diamonds.add(Diamond(platform.x + platform.width / 2f, platform.y - 20f))
            }

            // Spawn Powerup?
            val puRoll = Random.nextFloat()
            if (puRoll < GameConstants.SHIELD_SPAWN_CHANCE) {
                powerUps.add(PowerUp(PowerUpType.SHIELD, platform.x + platform.width / 2f, platform.y - 22f))
            } else if (puRoll < GameConstants.SHIELD_SPAWN_CHANCE + GameConstants.JETPACK_SPAWN_CHANCE) {
                powerUps.add(PowerUp(PowerUpType.JETPACK, platform.x + platform.width / 2f, platform.y - 22f))
            } else if (puRoll < GameConstants.SHIELD_SPAWN_CHANCE + GameConstants.JETPACK_SPAWN_CHANCE + GameConstants.MAGNET_SPAWN_CHANCE) {
                powerUps.add(PowerUp(PowerUpType.MAGNET, platform.x + platform.width / 2f, platform.y - 22f))
            } else if (puRoll < GameConstants.SHIELD_SPAWN_CHANCE + GameConstants.JETPACK_SPAWN_CHANCE + GameConstants.MAGNET_SPAWN_CHANCE + GameConstants.MULTIPLIER_SPAWN_CHANCE) {
                powerUps.add(PowerUp(PowerUpType.MULTIPLIER, platform.x + platform.width / 2f, platform.y - 22f))
            }
        }
    }

    private fun spawnDustParticles(x: Float, y: Float) {
        repeat(6) {
            particles.add(
                Particle(
                    x = x + (Random.nextFloat() - 0.5f) * 20f,
                    y = y,
                    vx = (Random.nextFloat() - 0.5f) * 60f,
                    vy = -Random.nextFloat() * 40f,
                    life = 0.35f,
                    maxLife = 0.35f,
                    size = Random.nextFloat() * 4f + 2f,
                    color = Color(0xFFCBD5E1)
                )
            )
        }
    }

    private fun spawnSpringParticles(x: Float, y: Float) {
        repeat(8) {
            particles.add(
                Particle(
                    x = x,
                    y = y,
                    vx = (Random.nextFloat() - 0.5f) * 90f,
                    vy = -Random.nextFloat() * 80f,
                    life = 0.4f,
                    maxLife = 0.4f,
                    size = Random.nextFloat() * 5f + 3f,
                    color = Color(0xFF22C55E)
                )
            )
        }
    }

    private fun spawnBreakParticles(x: Float, y: Float) {
        repeat(10) {
            particles.add(
                Particle(
                    x = x + (Random.nextFloat() - 0.5f) * 40f,
                    y = y,
                    vx = (Random.nextFloat() - 0.5f) * 120f,
                    vy = (Random.nextFloat() - 0.5f) * 80f,
                    life = 0.5f,
                    maxLife = 0.5f,
                    size = Random.nextFloat() * 6f + 3f,
                    color = Color(0xFF78350F)
                )
            )
        }
    }

    private fun spawnSparkleParticles(x: Float, y: Float, color: Color) {
        repeat(8) {
            particles.add(
                Particle(
                    x = x,
                    y = y,
                    vx = (Random.nextFloat() - 0.5f) * 100f,
                    vy = (Random.nextFloat() - 0.5f) * 100f,
                    life = 0.45f,
                    maxLife = 0.45f,
                    size = Random.nextFloat() * 5f + 2f,
                    color = color
                )
            )
        }
    }

    private fun spawnExplosionParticles(x: Float, y: Float, color: Color) {
        repeat(14) {
            particles.add(
                Particle(
                    x = x,
                    y = y,
                    vx = (Random.nextFloat() - 0.5f) * 180f,
                    vy = (Random.nextFloat() - 0.5f) * 180f,
                    life = 0.6f,
                    maxLife = 0.6f,
                    size = Random.nextFloat() * 7f + 3f,
                    color = color
                )
            )
        }
    }

    private fun spawnTrailParticle(x: Float, y: Float) {
        val trailId = prefs.selectedTrail
        val color = when (trailId) {
            "mint" -> Color(0xFF34D399)
            "gold_spark" -> Color(0xFFFBBF24)
            "bubbles" -> Color(0xFF38BDF8)
            "sakura" -> Color(0xFFF472B6)
            "fire" -> Color(0xFFF97316)
            "lightning" -> Color(0xFFEAB308)
            "neon_cyan" -> Color(0xFF06B6D4)
            "void" -> Color(0xFFA855F7)
            "crimson" -> Color(0xFFEF4444)
            "rainbow" -> listOf(Color(0xFFEF4444), Color(0xFFF59E0B), Color(0xFF10B981), Color(0xFF3B82F6), Color(0xFFA855F7)).random()
            else -> Color.White.copy(alpha = 0.7f)
        }

        particles.add(
            Particle(
                x = x + (Random.nextFloat() - 0.5f) * 10f,
                y = y,
                vx = (Random.nextFloat() - 0.5f) * 25f,
                vy = if (player.hasJetpack) 150f else 40f,
                life = 0.35f,
                maxLife = 0.35f,
                size = if (player.hasJetpack) 7f else 4f,
                color = color
            )
        )
    }

    fun spawnFloatingText(x: Float, y: Float, text: String, color: Color) {
        floatingTexts.add(FloatingText(x = x, y = y, text = text, color = color))
    }
}
