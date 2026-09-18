package com.example.stickup.engine

object GameConstants {
    const val GAME_WIDTH = 450f
    const val GAME_HEIGHT = 800f

    // Physics
    const val GRAVITY = 1800f
    const val JUMP_VELOCITY = -1050f
    const val SPRING_VELOCITY = -2100f
    const val MOVE_SPEED = 340f
    const val MAX_FALL_SPEED = 1400f

    // Player
    const val PLAYER_WIDTH = 40f
    const val PLAYER_HEIGHT = 56f

    // Platforms
    const val PLATFORM_WIDTH = 90f
    const val PLATFORM_HEIGHT = 16f
    const val PLATFORM_MIN_GAP = 65f
    const val PLATFORM_MAX_GAP = 125f

    // Progression heights (meters)
    const val MOVING_PLATFORM_START = 45
    const val BREAKABLE_PLATFORM_START = 90
    const val FADING_PLATFORM_START = 180
    const val MERCHANT_MIN_METER = 30
    const val ENEMY_MIN_METER = 80

    // Spawn probabilities
    const val SPRING_SPAWN_CHANCE = 0.22f
    const val RELIC_SPAWN_CHANCE = 0.36f
    const val MERCHANT_SPAWN_CHANCE = 0.08f
    const val ENEMY_SPAWN_CHANCE = 0.10f

    // Powerups
    const val SHIELD_SPAWN_CHANCE = 0.055f
    const val JETPACK_SPAWN_CHANCE = 0.04f
    const val JETPACK_BASE_DURATION = 2.5f
    const val JETPACK_SPEED = 1500f

    const val MAGNET_SPAWN_CHANCE = 0.055f
    const val MAGNET_BASE_DURATION = 3.6f
    const val MAGNET_RADIUS = 240f

    const val MULTIPLIER_SPAWN_CHANCE = 0.05f
    const val MULTIPLIER_BASE_DURATION = 3.0f

    const val PIXELS_PER_METER = 35f
    const val CAMERA_OFFSET = 250f
    const val DEATH_RELIC_KEEP_RATE = 0.50f

    const val GAME_VERSION = "v2.0.0"
    const val STUDIO_NAME = "DazzomInteractive"
    const val COPYRIGHT_NOTICE = "© 2026 DazzomInteractive. All Rights Reserved."
}
