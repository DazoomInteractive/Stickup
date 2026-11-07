package com.example.stickup.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.rotate
import androidx.compose.ui.graphics.drawscope.scale
import com.example.stickup.engine.GameConstants
import com.example.stickup.engine.GameEngine
import com.example.stickup.model.*
import kotlin.math.sin

@Composable
fun GameCanvas(
    engine: GameEngine,
    modifier: Modifier = Modifier
) {
    val bgId = engine.prefs.selectedBackground
    val (topBg, botBg) = when (bgId) {
        "dawn_sunrise" -> Pair(Color(0xFFFF7E5F), Color(0xFFFFECCC))
        "sunset_twilight" -> Pair(Color(0xFF4A154B), Color(0xFFF80759))
        "emerald_forest" -> Pair(Color(0xFF0F382C), Color(0xFF6EE7B7))
        "midnight_city" -> Pair(Color(0xFF020617), Color(0xFF1E293B))
        "synthwave_80s" -> Pair(Color(0xFF2E0249), Color(0xFFA91079))
        "cosmic_space" -> Pair(Color(0xFF000000), Color(0xFF4C1D95))
        else -> Pair(Color(0xFF87CEEB), Color(0xFFE0F7FA))
    }

    Canvas(modifier = modifier.fillMaxSize()) {
        val scaleFactor = size.width / GameConstants.GAME_WIDTH
        val cameraY = engine.cameraY

        // 1. Background Sky
        drawRect(
            brush = Brush.verticalGradient(
                colors = listOf(topBg, botBg)
            ),
            size = size
        )

        // Draw soft ambient cloud shapes
        drawCircle(
            color = Color.White.copy(alpha = 0.25f),
            radius = 80f * scaleFactor,
            center = Offset(size.width * 0.25f, ((100f - cameraY * 0.15f) % size.height + size.height) % size.height)
        )
        drawCircle(
            color = Color.White.copy(alpha = 0.2f),
            radius = 120f * scaleFactor,
            center = Offset(size.width * 0.75f, ((340f - cameraY * 0.2f) % size.height + size.height) % size.height)
        )

        // 2. Draw Platforms
        for (plat in engine.platforms) {
            val screenX = plat.x * scaleFactor
            val screenY = (plat.y - cameraY + plat.dipOffset) * scaleFactor
            val w = plat.width * scaleFactor
            val h = plat.height * scaleFactor

            val platColor = when (plat.type) {
                PlatformType.MOVING -> Color(0xFF42A5F5)
                PlatformType.BREAKABLE -> Color(0xFF8D6E63)
                PlatformType.FADING -> Color(0xFFCE93D8).copy(alpha = plat.fadeAlpha)
                PlatformType.SPRING -> Color(0xFF66BB6A)
                PlatformType.STATIC -> Color(0xFF4CAF50)
            }

            drawRoundRect(
                color = platColor,
                topLeft = Offset(screenX, screenY),
                size = Size(w, h),
                cornerRadius = CornerRadius(6f * scaleFactor, 6f * scaleFactor)
            )
            // Top highlight
            drawRoundRect(
                color = Color.White.copy(alpha = 0.35f * (if (plat.type == PlatformType.FADING) plat.fadeAlpha else 1f)),
                topLeft = Offset(screenX + 2f * scaleFactor, screenY + 1f * scaleFactor),
                size = Size(w - 4f * scaleFactor, 3f * scaleFactor),
                cornerRadius = CornerRadius(2f * scaleFactor, 2f * scaleFactor)
            )

            // Draw Spring on top of platform
            if (plat.type == PlatformType.SPRING) {
                val springX = screenX + w / 2f
                val springY = screenY
                val springHeight = (14f - plat.springCompressed * 8f) * scaleFactor
                drawRoundRect(
                    color = Color(0xFFFFC107),
                    topLeft = Offset(springX - 8f * scaleFactor, springY - springHeight),
                    size = Size(16f * scaleFactor, springHeight),
                    cornerRadius = CornerRadius(3f * scaleFactor, 3f * scaleFactor)
                )
                // Spring cap
                drawRoundRect(
                    color = Color(0xFFFF9800),
                    topLeft = Offset(springX - 11f * scaleFactor, springY - springHeight - 3f * scaleFactor),
                    size = Size(22f * scaleFactor, 4f * scaleFactor),
                    cornerRadius = CornerRadius(2f * scaleFactor, 2f * scaleFactor)
                )
            }
        }

        // 3. Draw Merchants
        for (m in engine.merchants) {
            val screenX = m.x * scaleFactor
            val screenY = (m.y - cameraY) * scaleFactor
            drawMerchant(screenX, screenY, scaleFactor, m.pricePerDiamond, m.animTimer)
        }

        // 4. Draw Enemies
        for (enemy in engine.enemies) {
            val screenX = enemy.x * scaleFactor
            val screenY = (enemy.y - cameraY) * scaleFactor
            drawEnemy(screenX, screenY, scaleFactor, enemy)
        }

        // 5. Draw Arrows (Enemy and Player)
        for (arrow in engine.arrows) {
            val screenX = arrow.x * scaleFactor
            val screenY = (arrow.y - cameraY) * scaleFactor
            val angleDeg = arrow.angle * 57.2958f
            rotate(angleDeg, Offset(screenX, screenY)) {
                val shaftColor = if (arrow.isPlayerArrow) Color(0xFF0284C7) else Color(0xFF78350F)
                val tipColor = if (arrow.isPlayerArrow) Color(0xFF38BDF8) else Color(0xFFCBD5E1)
                drawLine(
                    color = shaftColor,
                    start = Offset(screenX - 12f * scaleFactor, screenY),
                    end = Offset(screenX + 12f * scaleFactor, screenY),
                    strokeWidth = 3f * scaleFactor
                )
                drawCircle(
                    color = tipColor,
                    radius = 4f * scaleFactor,
                    center = Offset(screenX + 12f * scaleFactor, screenY)
                )
            }
        }

        // 5b. Draw Falling Hazards (Rocks & Warning Beams)
        for (h in engine.hazards) {
            val screenX = h.x * scaleFactor
            val screenY = (h.y - cameraY) * scaleFactor

            if (h.warningTimer > 0f) {
                // Danger Column Guideline
                drawLine(
                    color = Color(0x66EF4444),
                    start = Offset(screenX, 60f * scaleFactor),
                    end = Offset(screenX, size.height),
                    strokeWidth = 2f * scaleFactor
                )
                // Warning circle marker
                drawCircle(
                    color = Color(0xFFEF4444),
                    radius = 14f * scaleFactor,
                    center = Offset(screenX, 55f * scaleFactor)
                )
                drawCircle(
                    color = Color.White,
                    radius = 11f * scaleFactor,
                    center = Offset(screenX, 55f * scaleFactor),
                    style = Stroke(width = 2f * scaleFactor)
                )
            } else {
                // Plunging Rock
                rotate(h.rotation * 57.2958f, Offset(screenX, screenY)) {
                    drawCircle(
                        color = Color(0xFFFF5722).copy(alpha = 0.5f),
                        radius = h.radius * 1.4f * scaleFactor,
                        center = Offset(screenX, screenY - 8f * scaleFactor)
                    )
                    drawCircle(
                        color = Color(0xFF334155),
                        radius = h.radius * scaleFactor,
                        center = Offset(screenX, screenY)
                    )
                    drawCircle(
                        color = Color(0xFFFF9800),
                        radius = 4f * scaleFactor,
                        center = Offset(screenX + 2f * scaleFactor, screenY + 2f * scaleFactor)
                    )
                }
            }
        }

        // 6. Draw Diamonds (Relics)
        for (dia in engine.diamonds) {
            val screenX = dia.x * scaleFactor
            val screenY = (dia.y - cameraY + sin(dia.animTimer) * 3f) * scaleFactor
            drawDiamond(screenX, screenY, scaleFactor)
        }

        // 7. Draw Powerups
        for (pu in engine.powerUps) {
            val screenX = pu.x * scaleFactor
            val screenY = (pu.y - cameraY + sin(pu.animTimer) * 4f) * scaleFactor
            drawPowerUp(screenX, screenY, scaleFactor, pu.type)
        }

        // 8. Draw Player Stickman
        val playerScreenX = (engine.player.x + engine.player.width / 2f) * scaleFactor
        val playerScreenY = (engine.player.y + engine.player.height / 2f - cameraY) * scaleFactor

        drawPlayer(
            playerScreenX,
            playerScreenY,
            scaleFactor,
            engine.player
        )

        // 9. Draw Particles
        for (p in engine.particles) {
            val alpha = (p.life / p.maxLife).coerceIn(0f, 1f)
            val px = p.x * scaleFactor
            val py = (p.y - cameraY) * scaleFactor
            drawCircle(
                color = p.color.copy(alpha = alpha),
                radius = p.size * scaleFactor,
                center = Offset(px, py)
            )
        }

        // 10. Draw Rising Lava at bottom
        val lavaScreenY = (engine.lavaY - cameraY) * scaleFactor
        if (lavaScreenY < size.height + 50f) {
            drawRect(
                brush = Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFFFF5722),
                        Color(0xFFD32F2F),
                        Color(0xFF4A0E17)
                    ),
                    startY = lavaScreenY,
                    endY = size.height
                ),
                topLeft = Offset(0f, lavaScreenY),
                size = Size(size.width, size.height - lavaScreenY + 50f)
            )
            // Hot crest bubbles
            drawRoundRect(
                color = Color(0xFFFFEB3B).copy(alpha = 0.8f),
                topLeft = Offset(0f, lavaScreenY - 4f * scaleFactor),
                size = Size(size.width, 8f * scaleFactor)
            )
        }
    }
}

private fun DrawScope.drawDiamond(x: Float, y: Float, scale: Float) {
    val r = 12f * scale
    val path = Path().apply {
        moveTo(x, y - r)
        lineTo(x + r, y)
        lineTo(x, y + r)
        lineTo(x - r, y)
        close()
    }
    drawPath(path, color = Color(0xFF38BDF8))
    // Inner crystal facet
    val facet = Path().apply {
        moveTo(x, y - r)
        lineTo(x + r * 0.4f, y)
        lineTo(x, y + r)
        close()
    }
    drawPath(facet, color = Color(0xFFBAE6FD).copy(alpha = 0.8f))
}

private fun DrawScope.drawPowerUp(x: Float, y: Float, scale: Float, type: PowerUpType) {
    val r = 14f * scale
    val color = when (type) {
        PowerUpType.SHIELD -> Color(0xFF38BDF8)
        PowerUpType.JETPACK -> Color(0xFFFF9800)
        PowerUpType.MAGNET -> Color(0xFFA855F7)
        PowerUpType.MULTIPLIER -> Color(0xFFFFB703)
    }
    drawCircle(color = color.copy(alpha = 0.25f), radius = r * 1.3f, center = Offset(x, y))
    drawCircle(color = color, radius = r, center = Offset(x, y))
    drawCircle(color = Color.White.copy(alpha = 0.8f), radius = r * 0.4f, center = Offset(x - r * 0.3f, y - r * 0.3f))
}

private fun DrawScope.drawMerchant(x: Float, y: Float, scale: Float, price: Int, anim: Float) {
    val bob = sin(anim) * 2f * scale
    // Merchant Robe & Hat
    drawCircle(color = Color(0xFF451A03), radius = 10f * scale, center = Offset(x, y - 10f * scale + bob))
    drawRoundRect(
        color = Color(0xFF78350F),
        topLeft = Offset(x - 9f * scale, y + bob),
        size = Size(18f * scale, 20f * scale),
        cornerRadius = CornerRadius(4f * scale, 4f * scale)
    )
    // Merchant Gold Turban
    drawCircle(color = Color(0xFFF59E0B), radius = 6f * scale, center = Offset(x, y - 16f * scale + bob))
    // Trade Badge Indicator
    drawCircle(color = Color(0xFFFFD54F), radius = 10f * scale, center = Offset(x + 14f * scale, y - 16f * scale + bob))
}

private fun DrawScope.drawEnemy(x: Float, y: Float, scale: Float, enemy: Enemy) {
    val squish = sin(enemy.animTimer) * 2f * scale
    val w = 15f * scale
    val h = 13f * scale

    if (enemy.type == EnemyType.ARCHER) {
        val isStunned = enemy.stunTimer > 0f
        val facing = enemy.facing

        // Hooded tunic / cloak (Forest green)
        drawRoundRect(
            color = Color(0xFF166534),
            topLeft = Offset(x - 9f * scale, y - 5f * scale + squish),
            size = Size(18f * scale, 19f * scale),
            cornerRadius = CornerRadius(4f * scale, 4f * scale)
        )
        // Belt with golden buckle
        drawRect(
            color = Color(0xFF78350F),
            topLeft = Offset(x - 9f * scale, y + 4f * scale + squish),
            size = Size(18f * scale, 3.5f * scale)
        )
        drawCircle(color = Color(0xFFFBBF24), radius = 2f * scale, center = Offset(x, y + 5.5f * scale + squish))

        // Elf Head with fair skin
        drawCircle(
            color = Color(0xFFFEF08A),
            radius = 10f * scale,
            center = Offset(x, y - 11f * scale + squish)
        )
        // Green Hood top
        drawArc(
            color = Color(0xFF15803D),
            startAngle = 180f,
            sweepAngle = 180f,
            useCenter = true,
            topLeft = Offset(x - 11f * scale, y - 22f * scale + squish),
            size = Size(22f * scale, 18f * scale)
        )

        // Pointed elf ear
        val earX = if (facing > 0) x - 10f * scale else x + 10f * scale
        drawOval(
            color = Color(0xFFFEF08A),
            topLeft = Offset(earX - 2.5f * scale, y - 14f * scale + squish),
            size = Size(5f * scale, 9f * scale)
        )

        // Eyes
        val eyeDir = facing * 2.5f * scale
        if (isStunned) {
            // Dizzy X eyes
            drawLine(
                color = Color(0xFF991B1B),
                start = Offset(x - 5f * scale + eyeDir, y - 13f * scale + squish),
                end = Offset(x - 2f * scale + eyeDir, y - 9f * scale + squish),
                strokeWidth = 1.8f * scale
            )
            drawLine(
                color = Color(0xFF991B1B),
                start = Offset(x - 2f * scale + eyeDir, y - 13f * scale + squish),
                end = Offset(x - 5f * scale + eyeDir, y - 9f * scale + squish),
                strokeWidth = 1.8f * scale
            )
            drawLine(
                color = Color(0xFF991B1B),
                start = Offset(x + 2f * scale + eyeDir, y - 13f * scale + squish),
                end = Offset(x + 5f * scale + eyeDir, y - 9f * scale + squish),
                strokeWidth = 1.8f * scale
            )
            drawLine(
                color = Color(0xFF991B1B),
                start = Offset(x + 5f * scale + eyeDir, y - 13f * scale + squish),
                end = Offset(x + 2f * scale + eyeDir, y - 9f * scale + squish),
                strokeWidth = 1.8f * scale
            )

            // Orbiting dizzy stars
            for (i in 0..2) {
                val angle = (enemy.dizzyAngle * 3f + (i * Math.PI.toFloat() * 2f) / 3f)
                val starX = x + kotlin.math.cos(angle) * 16f * scale
                val starY = y - 25f * scale + kotlin.math.sin(angle) * 5f * scale
                drawCircle(color = Color(0xFFFDE047), radius = 3f * scale, center = Offset(starX, starY))
                drawCircle(color = Color.White, radius = 1.2f * scale, center = Offset(starX, starY))
            }
        } else {
            // Keen elven archer eyes
            drawCircle(color = Color.White, radius = 3f * scale, center = Offset(x - 3.5f * scale + eyeDir, y - 11f * scale + squish))
            drawCircle(color = Color.White, radius = 3f * scale, center = Offset(x + 3.5f * scale + eyeDir, y - 11f * scale + squish))
            drawCircle(color = Color(0xFF047857), radius = 1.6f * scale, center = Offset(x - 3.5f * scale + eyeDir * 1.2f, y - 11f * scale + squish))
            drawCircle(color = Color(0xFF047857), radius = 1.6f * scale, center = Offset(x + 3.5f * scale + eyeDir * 1.2f, y - 11f * scale + squish))
        }

        // Recurve Bow & Arrow Aiming
        if (enemy.bowBroken) {
            // Broken splintered bow on ground/side
            drawLine(
                color = Color(0xFF78350F),
                start = Offset(x + facing * 8f * scale, y + 2f * scale),
                end = Offset(x + facing * 14f * scale, y + 10f * scale),
                strokeWidth = 2.5f * scale
            )
            drawLine(
                color = Color(0xFF78350F),
                start = Offset(x + facing * 12f * scale, y + 12f * scale),
                end = Offset(x + facing * 18f * scale, y + 8f * scale),
                strokeWidth = 2f * scale
            )
        } else {
            // Wooden bow
            val bowDist = 12f * scale
            val bowAngleDeg = if (enemy.isAiming) enemy.aimAngle * 57.2958f else (if (facing > 0) 0f else 180f)
            rotate(bowAngleDeg, Offset(x, y - 5f * scale + squish)) {
                // Curved bow arc
                drawArc(
                    color = Color(0xFFB45309),
                    startAngle = -60f,
                    sweepAngle = 120f,
                    useCenter = false,
                    topLeft = Offset(x + bowDist - 6f * scale, y - 14f * scale + squish),
                    size = Size(12f * scale, 18f * scale),
                    style = Stroke(width = 2.5f * scale)
                )
                // Bowstring
                drawLine(
                    color = Color(0xFFF1F5F9),
                    start = Offset(x + bowDist, y - 14f * scale + squish),
                    end = Offset(x + bowDist, y + 4f * scale + squish),
                    strokeWidth = 1f * scale
                )
                // Drawn arrow if aiming
                if (enemy.isAiming) {
                    drawLine(
                        color = Color(0xFFF59E0B),
                        start = Offset(x + 2f * scale, y - 5f * scale + squish),
                        end = Offset(x + bowDist + 8f * scale, y - 5f * scale + squish),
                        strokeWidth = 2f * scale
                    )
                    // Arrowhead
                    drawCircle(color = Color(0xFFEF4444), radius = 2f * scale, center = Offset(x + bowDist + 8f * scale, y - 5f * scale + squish))
                }
            }
        }
    } else if (enemy.type == EnemyType.ZOMBIE) {
        val isStunned = enemy.stunTimer > 0f
        val eyeDir = enemy.facing * 2.5f * scale

        // Tattered clothes
        drawRoundRect(
            color = Color(0xFF4C1D95),
            topLeft = Offset(x - 10f * scale, y - 4f * scale + squish),
            size = Size(20f * scale, 18f * scale),
            cornerRadius = CornerRadius(4f * scale, 4f * scale)
        )

        // Rotten green zombie head
        drawCircle(
            color = Color(0xFF16A34A),
            radius = 11f * scale,
            center = Offset(x, y - 10f * scale + squish)
        )

        // Brain scar / stitch
        drawLine(
            color = Color(0xFF14532D),
            start = Offset(x - 5f * scale, y - 17f * scale + squish),
            end = Offset(x + 2f * scale, y - 19f * scale + squish),
            strokeWidth = 1.5f * scale
        )

        // Outstretched zombie arms
        val armX = if (enemy.facing > 0) x else x - 16f * scale
        drawRoundRect(
            color = Color(0xFF15803D),
            topLeft = Offset(armX, y - 2f * scale + squish),
            size = Size(16f * scale, 5f * scale),
            cornerRadius = CornerRadius(2f * scale, 2f * scale)
        )

        if (isStunned) {
            // Dizzy X eyes
            drawLine(
                color = Color(0xFFFEF08A),
                start = Offset(x - 6f * scale + eyeDir, y - 13f * scale + squish),
                end = Offset(x - 2f * scale + eyeDir, y - 9f * scale + squish),
                strokeWidth = 1.8f * scale
            )
            drawLine(
                color = Color(0xFFFEF08A),
                start = Offset(x - 2f * scale + eyeDir, y - 13f * scale + squish),
                end = Offset(x - 6f * scale + eyeDir, y - 9f * scale + squish),
                strokeWidth = 1.8f * scale
            )
            drawLine(
                color = Color(0xFFFEF08A),
                start = Offset(x + 2f * scale + eyeDir, y - 13f * scale + squish),
                end = Offset(x + 6f * scale + eyeDir, y - 9f * scale + squish),
                strokeWidth = 1.8f * scale
            )
            drawLine(
                color = Color(0xFFFEF08A),
                start = Offset(x + 6f * scale + eyeDir, y - 13f * scale + squish),
                end = Offset(x + 2f * scale + eyeDir, y - 9f * scale + squish),
                strokeWidth = 1.8f * scale
            )

            // Orbiting dizzy stars
            for (i in 0..2) {
                val angle = (enemy.dizzyAngle * 3f + (i * Math.PI.toFloat() * 2f) / 3f)
                val starX = x + kotlin.math.cos(angle) * 16f * scale
                val starY = y - 24f * scale + kotlin.math.sin(angle) * 5f * scale
                drawCircle(color = Color(0xFFFDE047), radius = 3f * scale, center = Offset(starX, starY))
                drawCircle(color = Color.White, radius = 1.2f * scale, center = Offset(starX, starY))
            }
        } else {
            // Glowing red undead eyes
            drawCircle(color = Color.White, radius = 3.5f * scale, center = Offset(x - 4f * scale + eyeDir, y - 10f * scale + squish))
            drawCircle(color = Color.White, radius = 3.5f * scale, center = Offset(x + 4f * scale + eyeDir, y - 10f * scale + squish))
            drawCircle(color = Color(0xFFDC2626), radius = 1.8f * scale, center = Offset(x - 4f * scale + eyeDir * 1.3f, y - 10f * scale + squish))
            drawCircle(color = Color(0xFFDC2626), radius = 1.8f * scale, center = Offset(x + 4f * scale + eyeDir * 1.3f, y - 10f * scale + squish))
        }
    } else if (enemy.type == EnemyType.SLIME) {
        // Cute Purple Slime
        drawOval(
            color = Color(0xFFA855F7),
            topLeft = Offset(x - w, y - h + squish),
            size = Size(w * 2f, h * 2f - squish)
        )
        // Slime eyes
        val eyeDir = enemy.facing * 3f * scale
        drawCircle(color = Color.White, radius = 3.5f * scale, center = Offset(x - 4f * scale + eyeDir, y - 2f * scale))
        drawCircle(color = Color.White, radius = 3.5f * scale, center = Offset(x + 4f * scale + eyeDir, y - 2f * scale))
        drawCircle(color = Color.Black, radius = 2f * scale, center = Offset(x - 4f * scale + eyeDir, y - 2f * scale))
        drawCircle(color = Color.Black, radius = 2f * scale, center = Offset(x + 4f * scale + eyeDir, y - 2f * scale))
    } else {
        // Goblin with horns
        drawOval(
            color = Color(0xFF15803D),
            topLeft = Offset(x - w, y - h),
            size = Size(w * 2f, h * 2f)
        )
        // Horns
        drawCircle(color = Color(0xFFCA8A04), radius = 3f * scale, center = Offset(x - 8f * scale, y - 12f * scale))
        drawCircle(color = Color(0xFFCA8A04), radius = 3f * scale, center = Offset(x + 8f * scale, y - 12f * scale))
    }
}

private fun DrawScope.drawPlayer(x: Float, y: Float, scale: Float, player: Player) {
    scale(player.scaleX, player.scaleY, Offset(x, y)) {
        rotate(player.tilt * 57.3f, Offset(x, y)) {
            val headRadius = 8f * scale
            val bodyHeight = 22f * scale
            val limbWidth = 3.5f * scale
            val color = player.skinColor

            // 1. Jetpack on back
            if (player.hasJetpack) {
                drawRoundRect(
                    color = Color(0xFF94A3B8),
                    topLeft = Offset(x - 14f * scale, y - 6f * scale),
                    size = Size(8f * scale, 18f * scale),
                    cornerRadius = CornerRadius(2f * scale, 2f * scale)
                )
                // Jet flames
                drawOval(
                    color = Color(0xFFFF5722),
                    topLeft = Offset(x - 13f * scale, y + 12f * scale),
                    size = Size(6f * scale, 14f * scale)
                )
                drawOval(
                    color = Color(0xFFFFEB3B),
                    topLeft = Offset(x - 12f * scale, y + 12f * scale),
                    size = Size(4f * scale, 8f * scale)
                )
            }

            // 2. Stickman Head
            drawCircle(color = color, radius = headRadius, center = Offset(x, y - bodyHeight / 2f - headRadius))

            // 3. Stickman Body Spine
            drawLine(
                color = color,
                start = Offset(x, y - bodyHeight / 2f),
                end = Offset(x, y + bodyHeight / 2f),
                strokeWidth = limbWidth,
                cap = StrokeCap.Round
            )

            // 4. Arms
            val armSpread = if (player.vy < 0) -8f * scale else 6f * scale
            drawLine(
                color = color,
                start = Offset(x - 12f * scale, y - bodyHeight / 4f + armSpread),
                end = Offset(x, y - bodyHeight / 4f),
                strokeWidth = limbWidth,
                cap = StrokeCap.Round
            )
            drawLine(
                color = color,
                start = Offset(x, y - bodyHeight / 4f),
                end = Offset(x + 12f * scale, y - bodyHeight / 4f + armSpread),
                strokeWidth = limbWidth,
                cap = StrokeCap.Round
            )

            // 5. Legs
            val legSpread = if (player.vy < 0) 10f * scale else 6f * scale
            drawLine(
                color = color,
                start = Offset(x, y + bodyHeight / 2f),
                end = Offset(x - legSpread, y + bodyHeight / 2f + 16f * scale),
                strokeWidth = limbWidth,
                cap = StrokeCap.Round
            )
            drawLine(
                color = color,
                start = Offset(x, y + bodyHeight / 2f),
                end = Offset(x + legSpread, y + bodyHeight / 2f + 16f * scale),
                strokeWidth = limbWidth,
                cap = StrokeCap.Round
            )

            // 6. Hat / Accessories
            when (player.hat) {
                "crown" -> {
                    val crownPath = Path().apply {
                        moveTo(x - 8f * scale, y - bodyHeight / 2f - headRadius - 2f * scale)
                        lineTo(x - 9f * scale, y - bodyHeight / 2f - headRadius - 10f * scale)
                        lineTo(x - 4f * scale, y - bodyHeight / 2f - headRadius - 5f * scale)
                        lineTo(x, y - bodyHeight / 2f - headRadius - 12f * scale)
                        lineTo(x + 4f * scale, y - bodyHeight / 2f - headRadius - 5f * scale)
                        lineTo(x + 9f * scale, y - bodyHeight / 2f - headRadius - 10f * scale)
                        lineTo(x + 8f * scale, y - bodyHeight / 2f - headRadius - 2f * scale)
                        close()
                    }
                    drawPath(crownPath, color = Color(0xFFFFD54F))
                }
                "ninja_bandana" -> {
                    drawRect(
                        color = Color(0xFFEF4444),
                        topLeft = Offset(x - 8f * scale, y - bodyHeight / 2f - headRadius - 2f * scale),
                        size = Size(16f * scale, 4f * scale)
                    )
                    drawLine(
                        color = Color(0xFFEF4444),
                        start = Offset(x + 8f * scale, y - bodyHeight / 2f - headRadius),
                        end = Offset(x + 18f * scale, y - bodyHeight / 2f - headRadius + 4f * scale),
                        strokeWidth = 3f * scale
                    )
                }
                "halo" -> {
                    drawOval(
                        color = Color(0xFFFFEB3B),
                        topLeft = Offset(x - 11f * scale, y - bodyHeight / 2f - headRadius - 12f * scale),
                        size = Size(22f * scale, 6f * scale),
                        style = Stroke(width = 2.5f * scale)
                    )
                }
            }

            // 7. Shield Bubble
            if (player.hasShield) {
                drawCircle(
                    color = Color(0xFF38BDF8).copy(alpha = 0.25f),
                    radius = 32f * scale,
                    center = Offset(x, y)
                )
                drawCircle(
                    color = Color(0xFF38BDF8),
                    radius = 32f * scale,
                    center = Offset(x, y),
                    style = Stroke(width = 2.5f * scale)
                )
            }

            // 8. Magnet Wave
            if (player.hasMagnet) {
                drawCircle(
                    color = Color(0xFFA855F7).copy(alpha = 0.18f),
                    radius = 42f * scale,
                    center = Offset(x, y),
                    style = Stroke(width = 2f * scale)
                )
            }
        }
    }
}
