package com.example.stickup.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.stickup.audio.SoundManager
import com.example.stickup.data.GamePreferences
import com.example.stickup.engine.GameConstants
import com.example.stickup.engine.GameEngine
import com.example.stickup.model.GameState
import kotlinx.coroutines.isActive

@Composable
fun StickUpGameScreen(
    sound: SoundManager,
    prefs: GamePreferences
) {
    val engine = remember { GameEngine(sound, prefs) }
    var showShop by remember { mutableStateOf(false) }
    var showPrivacyPolicy by remember { mutableStateOf(false) }
    var soundEnabled by remember { mutableStateOf(prefs.soundEnabled) }

    // High performance 60fps Game Loop
    LaunchedEffect(engine.state) {
        var lastTime = System.nanoTime()
        while (isActive) {
            withFrameNanos { now ->
                val dt = ((now - lastTime) / 1_000_000_000f).coerceIn(0f, 0.05f)
                lastTime = now
                if (engine.state == GameState.PLAYING) {
                    engine.update(dt)
                }
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF090D16))
            .pointerInput(Unit) {
                detectDragGestures(
                    onDragEnd = {
                        engine.player.vx = 0f
                    },
                    onDragCancel = {
                        engine.player.vx = 0f
                    }
                ) { change, dragAmount ->
                    change.consume()
                    if (engine.state == GameState.PLAYING) {
                        // Horizontal drag controls player movement speed
                        engine.player.vx = (dragAmount.x * 25f).coerceIn(-GameConstants.MOVE_SPEED, GameConstants.MOVE_SPEED)
                    }
                }
            }
            .pointerInput(Unit) {
                detectTapGestures(
                    onDoubleTap = {
                        if (engine.state == GameState.PLAYING) {
                            engine.shootArrow()
                        }
                    },
                    onTap = { offset ->
                        if (engine.state == GameState.PLAYING) {
                            // Tap left or right half of screen
                            val screenWidth = size.width
                            if (offset.x < screenWidth * 0.5f) {
                                engine.player.vx = -GameConstants.MOVE_SPEED
                            } else {
                                engine.player.vx = GameConstants.MOVE_SPEED
                            }
                        }
                    }
                )
            }
    ) {
        // Main Game Canvas
        GameCanvas(engine = engine)

        // Floating In-Game HUD (During Playing)
        if (engine.state == GameState.PLAYING || engine.state == GameState.PAUSED) {
            GameHUD(
                engine = engine,
                onPause = { engine.state = GameState.PAUSED },
                onShoot = { engine.shootArrow() }
            )

            // Dynamic Real-time Merchant Floating Action Prompt
            engine.activeNearMerchant?.let { merchant ->
                if (merchant.active && engine.diamondCount > 0) {
                    Box(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(bottom = 90.dp)
                    ) {
                        Button(
                            onClick = { engine.tradeWithMerchant(merchant) },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFB703)),
                            shape = RoundedCornerShape(24.dp),
                            elevation = ButtonDefaults.buttonElevation(defaultElevation = 8.dp)
                        ) {
                            Text(
                                text = "TRADE 💎 FOR ${merchant.pricePerDiamond} 🪙 EACH!",
                                color = Color.Black,
                                fontWeight = FontWeight.Black,
                                fontSize = 14.sp
                            )
                        }
                    }
                }
            }
        }

        // Main Menu / Splash Overlay
        if (engine.state == GameState.SPLASH || engine.state == GameState.MAIN_MENU) {
            MainMenuOverlay(
                highScore = prefs.highScore,
                bankedCoins = prefs.bankedCoins,
                soundEnabled = soundEnabled,
                onToggleSound = {
                    soundEnabled = !soundEnabled
                    prefs.soundEnabled = soundEnabled
                    sound.isEnabled = soundEnabled
                },
                onPlay = { engine.startNewGame() },
                onOpenShop = { showShop = true },
                onOpenPrivacy = { showPrivacyPolicy = true }
            )
        }

        // Game Over Dialog
        if (engine.state == GameState.GAME_OVER) {
            GameOverOverlay(
                heightMeters = engine.heightMeters,
                isNewHigh = engine.isNewHighScore,
                highScore = prefs.highScore,
                coinsEarned = engine.coinCount,
                savedDiamonds = engine.sessionSavedDiamonds,
                lostDiamonds = engine.sessionLostDiamonds,
                canRevive = !engine.hasRevived,
                onRevive = { engine.revive() },
                onRestart = { engine.startNewGame() },
                onShop = { showShop = true },
                onMenu = { engine.state = GameState.MAIN_MENU }
            )
        }

        // Paused Dialog
        if (engine.state == GameState.PAUSED) {
            PauseOverlay(
                onResume = { engine.state = GameState.PLAYING },
                onRestart = { engine.startNewGame() },
                onShop = { showShop = true },
                onMenu = { engine.state = GameState.MAIN_MENU }
            )
        }

        // Shop Dialog
        if (showShop) {
            ShopDialog(
                prefs = prefs,
                sound = sound,
                onDismiss = { showShop = false },
                onApplyCustomization = {
                    engine.applyEquippedCustomization()
                }
            )
        }

        // Privacy Policy Dialog
        if (showPrivacyPolicy) {
            PrivacyPolicyDialog(onDismiss = { showPrivacyPolicy = false })
        }
    }
}

@Composable
fun GameHUD(
    engine: GameEngine,
    onPause: () -> Unit,
    onShoot: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .statusBarsPadding()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Altitude & Best Score
            Column {
                Text(
                    text = "${engine.heightMeters} m",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White
                )
                Text(
                    text = "Best: ${engine.prefs.highScore} m",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color(0xFF94A3B8)
                )
            }

            // Diamonds and Coins
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Diamonds
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(Color(0xFF1E293B).copy(alpha = 0.85f), RoundedCornerShape(16.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text("💎", fontSize = 14.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        "${engine.diamondCount}",
                        color = Color(0xFF38BDF8),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                // Coins
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier
                        .background(Color(0xFF1E293B).copy(alpha = 0.85f), RoundedCornerShape(16.dp))
                        .padding(horizontal = 10.dp, vertical = 5.dp)
                ) {
                    Text("🪙", fontSize = 14.sp)
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        "${engine.coinCount}",
                        color = Color(0xFFFFB703),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }

                // Pause Button
                IconButton(
                    onClick = onPause,
                    modifier = Modifier
                        .size(36.dp)
                        .background(Color(0xFF1E293B).copy(alpha = 0.85f), CircleShape)
                ) {
                    Text("⏸", color = Color.White, fontSize = 16.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(8.dp))

        // Power-up status indicators
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            if (engine.player.hasJetpack) {
                PowerUpBadge("🚀 Jetpack", Color(0xFFFF9800), engine.player.jetpackTimer / engine.player.jetpackMax)
            }
            if (engine.player.hasShield) {
                PowerUpBadge("🛡️ Shield", Color(0xFF38BDF8), 1f)
            }
            if (engine.player.hasMagnet) {
                PowerUpBadge("🧲 Magnet", Color(0xFFA855F7), engine.player.magnetTimer / engine.player.magnetMax)
            }
            if (engine.player.hasMultiplier) {
                PowerUpBadge("✨ 2X Bonus", Color(0xFFFFB703), engine.player.multiplierTimer / engine.player.multiplierMax)
            }
        }
    }
}

@Composable
fun PowerUpBadge(label: String, color: Color, progress: Float) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier
            .background(color.copy(alpha = 0.25f), RoundedCornerShape(12.dp))
            .padding(horizontal = 8.dp, vertical = 4.dp)
    ) {
        Text(label, color = color, fontSize = 11.sp, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun MainMenuOverlay(
    highScore: Int,
    bankedCoins: Int,
    soundEnabled: Boolean,
    onToggleSound: () -> Unit,
    onPlay: () -> Unit,
    onOpenShop: () -> Unit,
    onOpenPrivacy: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xDF090D16)),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
            modifier = Modifier.padding(32.dp)
        ) {
            // App Title & Tagline
            Text(
                text = "STICKUP 2D",
                fontSize = 42.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFF38BDF8),
                letterSpacing = 2.sp
            )
            Text(
                text = "INFINITE SKY RUNNER",
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF94A3B8),
                letterSpacing = 4.sp
            )

            Spacer(modifier = Modifier.height(28.dp))

            // High score & Banked Coins card
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(0.85f)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("BEST RECORD", fontSize = 11.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
                        Text("$highScore m", fontSize = 20.sp, color = Color.White, fontWeight = FontWeight.Black)
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("VAULT COINS", fontSize = 11.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
                        Text("🪙 $bankedCoins", fontSize = 20.sp, color = Color(0xFFFFB703), fontWeight = FontWeight.Black)
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Play Button
            Button(
                onClick = onPlay,
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .height(58.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("PLAY GAME", fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.Black)
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Shop Button
            Button(
                onClick = onOpenShop,
                modifier = Modifier
                    .fillMaxWidth(0.85f)
                    .height(52.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(16.dp)
            ) {
                Text("🛍️ SHOP & UPGRADES", fontSize = 15.sp, fontWeight = FontWeight.Bold, color = Color.White)
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Sound Toggle & Privacy Policy
            Row(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                IconButton(onClick = onToggleSound) {
                    Text(if (soundEnabled) "🔊" else "🔇", fontSize = 22.sp)
                }

                Text(
                    text = "Privacy Policy",
                    color = Color(0xFF64748B),
                    fontSize = 13.sp,
                    modifier = Modifier.clickable { onOpenPrivacy() }
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "${GameConstants.STUDIO_NAME} • ${GameConstants.GAME_VERSION}",
                color = Color(0xFF475569),
                fontSize = 11.sp
            )
        }
    }
}

@Composable
fun GameOverOverlay(
    heightMeters: Int,
    isNewHigh: Boolean,
    highScore: Int,
    coinsEarned: Int,
    savedDiamonds: Int,
    lostDiamonds: Int,
    canRevive: Boolean,
    onRevive: () -> Unit,
    onRestart: () -> Unit,
    onShop: () -> Unit,
    onMenu: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xEE090D16)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.88f)
                .padding(16.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(24.dp)
            ) {
                Text(
                    text = "GAME OVER",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Black,
                    color = Color(0xFFEF4444)
                )

                if (isNewHigh) {
                    Text(
                        text = "🏆 NEW HIGH SCORE! 🏆",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFFFFB703),
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }

                Spacer(modifier = Modifier.height(20.dp))

                // Score Display
                Text("ALTITUDE REACHED", fontSize = 11.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
                Text("$heightMeters m", fontSize = 36.sp, fontWeight = FontWeight.Black, color = Color.White)
                Text("Best: $highScore m", fontSize = 13.sp, color = Color(0xFF64748B))

                Spacer(modifier = Modifier.height(16.dp))

                // Stats row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceAround
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("COINS", fontSize = 11.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
                        Text("+$coinsEarned 🪙", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFFFB703))
                    }
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("SAVED 💎", fontSize = 11.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
                        Text("+$savedDiamonds", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFF38BDF8))
                    }
                    if (lostDiamonds > 0) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("LOST 💎", fontSize = 11.sp, color = Color(0xFF94A3B8), fontWeight = FontWeight.Bold)
                            Text("-$lostDiamonds", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFEF4444))
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                if (canRevive) {
                    Button(
                        onClick = onRevive,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF22C55E)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("💚 REVIVE WITH SHIELD", fontWeight = FontWeight.Black, color = Color.White)
                    }
                    Spacer(modifier = Modifier.height(10.dp))
                }

                Button(
                    onClick = onRestart,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("PLAY AGAIN", fontWeight = FontWeight.Black, color = Color.Black)
                }

                Spacer(modifier = Modifier.height(10.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = onShop,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("SHOP", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                    Button(
                        onClick = onMenu,
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("MENU", color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@Composable
fun PauseOverlay(
    onResume: () -> Unit,
    onRestart: () -> Unit,
    onShop: () -> Unit,
    onMenu: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xCC090D16)),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.82f)
                .padding(16.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.padding(24.dp)
            ) {
                Text("GAME PAUSED", fontSize = 24.sp, fontWeight = FontWeight.Black, color = Color.White)

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = onResume,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("RESUME", fontWeight = FontWeight.Black, color = Color.Black)
                }

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = onRestart,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("RESTART", fontWeight = FontWeight.Bold, color = Color.White)
                }

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = onShop,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("SHOP", fontWeight = FontWeight.Bold, color = Color.White)
                }

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = onMenu,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("MAIN MENU", fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
        }
    }
}

@Composable
fun PrivacyPolicyDialog(onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
            modifier = Modifier.fillMaxWidth().padding(16.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text("Privacy Policy", fontSize = 20.sp, fontWeight = FontWeight.Black, color = Color.White)
                Spacer(modifier = Modifier.height(12.dp))
                Text(
                    "StickUp 2D respects your privacy. All gameplay progress, high scores, coins, and unlocks are stored locally on your device via Android SharedPreferences. No personal identifiable information (PII) is tracked, sold, or shared with third parties.",
                    fontSize = 13.sp,
                    color = Color(0xFF94A3B8),
                    lineHeight = 18.sp
                )
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = onDismiss,
                    modifier = Modifier.align(Alignment.End),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8)),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Close", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
