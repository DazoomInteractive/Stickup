package com.example.stickup.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.stickup.audio.SoundManager
import com.example.stickup.data.GamePreferences
import com.example.stickup.model.*

@Composable
fun ShopDialog(
    prefs: GamePreferences,
    sound: SoundManager,
    onDismiss: () -> Unit,
    onApplyCustomization: () -> Unit
) {
    var activeTab by remember { mutableStateOf(0) } // 0: Upgrades, 1: Skins, 2: Trails, 3: Backgrounds
    var bankedCoins by remember { mutableStateOf(prefs.bankedCoins) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A))
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Top Bar with Banked Coins and Close button
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "SHOP",
                        fontSize = 22.sp,
                        fontWeight = FontWeight.Black,
                        color = Color.White
                    )

                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .background(Color(0xFF1E293B), RoundedCornerShape(20.dp))
                            .padding(horizontal = 12.dp, vertical = 6.dp)
                    ) {
                        Text(text = "🪙 $bankedCoins", color = Color(0xFFFFB703), fontWeight = FontWeight.Bold)
                    }

                    IconButton(onClick = onDismiss) {
                        Text(text = "✕", color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Tabs
                TabRow(
                    selectedTabIndex = activeTab,
                    containerColor = Color(0xFF1E293B),
                    contentColor = Color.White,
                    modifier = Modifier.clip(RoundedCornerShape(12.dp))
                ) {
                    Tab(selected = activeTab == 0, onClick = { activeTab = 0 }) {
                        Text("Upgrades", modifier = Modifier.padding(vertical = 10.dp), fontSize = 12.sp)
                    }
                    Tab(selected = activeTab == 1, onClick = { activeTab = 1 }) {
                        Text("Skins", modifier = Modifier.padding(vertical = 10.dp), fontSize = 12.sp)
                    }
                    Tab(selected = activeTab == 2, onClick = { activeTab = 2 }) {
                        Text("Trails", modifier = Modifier.padding(vertical = 10.dp), fontSize = 12.sp)
                    }
                    Tab(selected = activeTab == 3, onClick = { activeTab = 3 }) {
                        Text("Skies", modifier = Modifier.padding(vertical = 10.dp), fontSize = 12.sp)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Tab Content
                when (activeTab) {
                    0 -> UpgradesTab(prefs, sound, bankedCoins) { newCoins -> bankedCoins = newCoins }
                    1 -> SkinsTab(prefs, sound, bankedCoins, { newCoins -> bankedCoins = newCoins }, onApplyCustomization)
                    2 -> TrailsTab(prefs, sound, bankedCoins, { newCoins -> bankedCoins = newCoins }, onApplyCustomization)
                    3 -> BackgroundsTab(prefs, sound, bankedCoins, { newCoins -> bankedCoins = newCoins }, onApplyCustomization)
                }
            }
        }
    }
}

@Composable
fun UpgradesTab(
    prefs: GamePreferences,
    sound: SoundManager,
    coins: Int,
    onCoinsUpdated: (Int) -> Unit
) {
    val upgrades = listOf(
        UpgradeItem("jetpack", "Jetpack", "🚀", prefs.getUpgradeLevel("jetpack"), 10, (prefs.getUpgradeLevel("jetpack") + 1) * 35, "+0.25s duration per level"),
        UpgradeItem("magnet", "Magnet", "🧲", prefs.getUpgradeLevel("magnet"), 10, (prefs.getUpgradeLevel("magnet") + 1) * 30, "+0.3s duration & +15px radius"),
        UpgradeItem("shield", "Shield", "🛡️", prefs.getUpgradeLevel("shield"), 10, (prefs.getUpgradeLevel("shield") + 1) * 25, "+1.5s active time"),
        UpgradeItem("coin_multiplier", "2X Multiplier", "✨", prefs.getUpgradeLevel("coin_multiplier"), 10, (prefs.getUpgradeLevel("coin_multiplier") + 1) * 40, "+0.25s 2X boost")
    )

    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(upgrades) { item ->
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(item.icon, fontSize = 28.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(item.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Text("Level ${item.level}/10 • ${item.desc}", color = Color(0xFF94A3B8), fontSize = 11.sp)
                        }
                    }

                    if (item.level >= item.maxLevel) {
                        Text("MAX", color = Color(0xFF22C55E), fontWeight = FontWeight.Black, fontSize = 14.sp)
                    } else {
                        Button(
                            onClick = {
                                if (coins >= item.cost) {
                                    val newCoins = coins - item.cost
                                    prefs.bankedCoins = newCoins
                                    prefs.setUpgradeLevel(item.id, item.level + 1)
                                    onCoinsUpdated(newCoins)
                                    sound.playCoin()
                                }
                            },
                            enabled = coins >= item.cost,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF38BDF8)),
                            shape = RoundedCornerShape(8.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Text("${item.cost} 🪙", fontSize = 13.sp, color = Color.Black, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun SkinsTab(
    prefs: GamePreferences,
    sound: SoundManager,
    coins: Int,
    onCoinsUpdated: (Int) -> Unit,
    onApply: () -> Unit
) {
    val skins = listOf(
        SkinItem("classic", "Classic Jumper", "🏃", 0, Color(0xFF2B2B2B), Color(0xFF4A90D9)),
        SkinItem("blue_runner", "Blue Runner", "👟", 50, Color(0xFF1D4ED8), Color(0xFF60A5FA)),
        SkinItem("crimson_bandit", "Crimson Bandit", "🧣", 100, Color(0xFF991B1B), Color(0xFFF87171)),
        SkinItem("forest_ranger", "Forest Ranger", "🌲", 150, Color(0xFF065F46), Color(0xFF34D399)),
        SkinItem("ninja", "Shadow Ninja", "🥷", 220, Color(0xFF1E1B4B), Color(0xFFEF4444), "ninja_bandana"),
        SkinItem("viking", "Viking Warrior", "🪓", 400, Color(0xFF334155), Color(0xFFE2E8F0), "viking_horns"),
        SkinItem("cyber_neon", "Cyber Neon", "🤖", 550, Color(0xFF06B6D4), Color(0xFFF43F5E), "visor"),
        SkinItem("royal_knight", "Royal Knight", "🛡️", 1000, Color(0xFF475569), Color(0xFF38BDF8), "knight_helmet"),
        SkinItem("astronaut", "Astronaut", "🧑‍🚀", 1500, Color(0xFFF8FAFC), Color(0xFF38BDF8), "astronaut_dome"),
        SkinItem("pharaoh", "Sun Pharaoh", "🏺", 1800, Color(0xFF854D0E), Color(0xFFFACC15), "pharaoh_nemes"),
        SkinItem("gold_king", "Gold King", "👑", 2500, Color(0xFFF59E0B), Color(0xFFFEF08A), "crown"),
        SkinItem("cosmic_god", "Cosmic Entity", "🌌", 5000, Color(0xFF312E81), Color(0xFFE0E7FF), "halo")
    )

    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(skins) { skin ->
            val isUnlocked = prefs.isSkinUnlocked(skin.id)
            val isEquipped = prefs.selectedSkin == skin.id

            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(skin.color, CircleShape)
                                .border(2.dp, skin.accent, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(skin.icon, fontSize = 18.sp)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(skin.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }

                    if (isEquipped) {
                        Text("EQUIPPED", color = Color(0xFF38BDF8), fontWeight = FontWeight.Black, fontSize = 12.sp)
                    } else if (isUnlocked) {
                        Button(
                            onClick = {
                                prefs.selectedSkin = skin.id
                                onApply()
                                sound.playClick()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("EQUIP", color = Color.White, fontSize = 12.sp)
                        }
                    } else {
                        Button(
                            onClick = {
                                if (coins >= skin.cost) {
                                    val newCoins = coins - skin.cost
                                    prefs.bankedCoins = newCoins
                                    prefs.unlockSkin(skin.id)
                                    prefs.selectedSkin = skin.id
                                    onCoinsUpdated(newCoins)
                                    onApply()
                                    sound.playTrade()
                                }
                            },
                            enabled = coins >= skin.cost,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFB703)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("${skin.cost} 🪙", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TrailsTab(
    prefs: GamePreferences,
    sound: SoundManager,
    coins: Int,
    onCoinsUpdated: (Int) -> Unit,
    onApply: () -> Unit
) {
    val trails = listOf(
        TrailItem("none", "Default White", "⚪", 0, Color(0xFF94A3B8)),
        TrailItem("mint", "Mint Breeze", "🍃", 40, Color(0xFF34D399)),
        TrailItem("gold_spark", "Golden Spark", "🪙", 90, Color(0xFFFBBF24)),
        TrailItem("bubbles", "Bubble Pop", "🫧", 150, Color(0xFF38BDF8)),
        TrailItem("sakura", "Sakura Petals", "🌸", 220, Color(0xFFF472B6)),
        TrailItem("fire", "Fire Blast", "🔥", 320, Color(0xFFF97316)),
        TrailItem("lightning", "Electric Volt", "⚡", 450, Color(0xFFEAB308)),
        TrailItem("neon_cyan", "Neon Cyan", "💠", 600, Color(0xFF06B6D4)),
        TrailItem("void", "Purple Void", "🔮", 800, Color(0xFFA855F7)),
        TrailItem("rainbow", "Rainbow Wave", "🌈", 1500, Color(0xFFEC4899))
    )

    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(trails) { trail ->
            val isUnlocked = prefs.isTrailUnlocked(trail.id)
            val isEquipped = prefs.selectedTrail == trail.id

            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Box(
                            modifier = Modifier
                                .size(32.dp)
                                .background(trail.color, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(trail.icon, fontSize = 16.sp)
                        }
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(trail.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }

                    if (isEquipped) {
                        Text("EQUIPPED", color = Color(0xFF38BDF8), fontWeight = FontWeight.Black, fontSize = 12.sp)
                    } else if (isUnlocked) {
                        Button(
                            onClick = {
                                prefs.selectedTrail = trail.id
                                onApply()
                                sound.playClick()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("EQUIP", color = Color.White, fontSize = 12.sp)
                        }
                    } else {
                        Button(
                            onClick = {
                                if (coins >= trail.cost) {
                                    val newCoins = coins - trail.cost
                                    prefs.bankedCoins = newCoins
                                    prefs.unlockTrail(trail.id)
                                    prefs.selectedTrail = trail.id
                                    onCoinsUpdated(newCoins)
                                    onApply()
                                    sound.playTrade()
                                }
                            },
                            enabled = coins >= trail.cost,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFB703)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("${trail.cost} 🪙", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun BackgroundsTab(
    prefs: GamePreferences,
    sound: SoundManager,
    coins: Int,
    onCoinsUpdated: (Int) -> Unit,
    onApply: () -> Unit
) {
    val bgs = listOf(
        BackgroundItem("classic_sky", "Classic Sky", "🌤️", 0, Color(0xFF87CEEB), Color(0xFFE0F7FA)),
        BackgroundItem("dawn_sunrise", "Dawn Sunrise", "🌅", 60, Color(0xFFFF7E5F), Color(0xFFFFECCC)),
        BackgroundItem("sunset_twilight", "Sunset Twilight", "🌇", 120, Color(0xFF4A154B), Color(0xFFF80759)),
        BackgroundItem("emerald_forest", "Emerald Forest", "🌲", 200, Color(0xFF0F382C), Color(0xFF6EE7B7)),
        BackgroundItem("midnight_city", "Midnight City", "🌃", 500, Color(0xFF020617), Color(0xFF1E293B)),
        BackgroundItem("synthwave_80s", "Synthwave 80s", "🌆", 800, Color(0xFF2E0249), Color(0xFFA91079)),
        BackgroundItem("cosmic_space", "Deep Cosmos", "🚀", 2000, Color(0xFF000000), Color(0xFF4C1D95))
    )

    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        items(bgs) { bg ->
            val isUnlocked = prefs.isBackgroundUnlocked(bg.id)
            val isEquipped = prefs.selectedBackground == bg.id

            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(bg.icon, fontSize = 24.sp)
                        Spacer(modifier = Modifier.width(12.dp))
                        Text(bg.name, color = Color.White, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                    }

                    if (isEquipped) {
                        Text("EQUIPPED", color = Color(0xFF38BDF8), fontWeight = FontWeight.Black, fontSize = 12.sp)
                    } else if (isUnlocked) {
                        Button(
                            onClick = {
                                prefs.selectedBackground = bg.id
                                onApply()
                                sound.playClick()
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("EQUIP", color = Color.White, fontSize = 12.sp)
                        }
                    } else {
                        Button(
                            onClick = {
                                if (coins >= bg.cost) {
                                    val newCoins = coins - bg.cost
                                    prefs.bankedCoins = newCoins
                                    prefs.unlockBackground(bg.id)
                                    prefs.selectedBackground = bg.id
                                    onCoinsUpdated(newCoins)
                                    onApply()
                                    sound.playTrade()
                                }
                            },
                            enabled = coins >= bg.cost,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFB703)),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text("${bg.cost} 🪙", color = Color.Black, fontWeight = FontWeight.Bold, fontSize = 12.sp)
                        }
                    }
                }
            }
        }
    }
}

// Sound click helper
fun SoundManager.playClick() {
    playCoin()
}
