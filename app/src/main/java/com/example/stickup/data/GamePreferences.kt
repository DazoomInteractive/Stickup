package com.example.stickup.data

import android.content.Context
import android.content.SharedPreferences

class GamePreferences(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("stickup_prefs", Context.MODE_PRIVATE)

    var highScore: Int
        get() = prefs.getInt("high_score", 0)
        set(value) = prefs.edit().putInt("high_score", value).apply()

    var bankedCoins: Int
        get() = prefs.getInt("banked_coins", 0)
        set(value) = prefs.edit().putInt("banked_coins", value).apply()

    var privacyAccepted: Boolean
        get() = prefs.getBoolean("privacy_accepted", false)
        set(value) = prefs.edit().putBoolean("privacy_accepted", value).apply()

    var soundEnabled: Boolean
        get() = prefs.getBoolean("sound_enabled", true)
        set(value) = prefs.edit().putBoolean("sound_enabled", value).apply()

    var selectedSkin: String
        get() = prefs.getString("selected_skin", "classic") ?: "classic"
        set(value) = prefs.edit().putString("selected_skin", value).apply()

    var selectedTrail: String
        get() = prefs.getString("selected_trail", "none") ?: "none"
        set(value) = prefs.edit().putString("selected_trail", value).apply()

    var selectedBackground: String
        get() = prefs.getString("selected_background", "classic_sky") ?: "classic_sky"
        set(value) = prefs.edit().putString("selected_background", value).apply()

    fun getUpgradeLevel(id: String): Int {
        return prefs.getInt("upgrade_$id", 0)
    }

    fun setUpgradeLevel(id: String, level: Int) {
        prefs.edit().putInt("upgrade_$id", level).apply()
    }

    fun isSkinUnlocked(id: String): Boolean {
        if (id == "classic") return true
        return prefs.getBoolean("skin_$id", false)
    }

    fun unlockSkin(id: String) {
        prefs.edit().putBoolean("skin_$id", true).apply()
    }

    fun isTrailUnlocked(id: String): Boolean {
        if (id == "none") return true
        return prefs.getBoolean("trail_$id", false)
    }

    fun unlockTrail(id: String) {
        prefs.edit().putBoolean("trail_$id", true).apply()
    }

    fun isBackgroundUnlocked(id: String): Boolean {
        if (id == "classic_sky") return true
        return prefs.getBoolean("bg_$id", false)
    }

    fun unlockBackground(id: String) {
        prefs.edit().putBoolean("bg_$id", true).apply()
    }
}
