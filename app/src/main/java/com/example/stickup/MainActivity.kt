package com.example.stickup

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.example.stickup.audio.SoundManager
import com.example.stickup.data.GamePreferences
import com.example.stickup.ui.StickUpGameScreen
import com.example.stickup.ui.theme.StickUpTheme

class MainActivity : ComponentActivity() {
    private lateinit var soundManager: SoundManager
    private lateinit var preferences: GamePreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        preferences = GamePreferences(applicationContext)
        soundManager = SoundManager().apply {
            isEnabled = preferences.soundEnabled
        }

        setContent {
            StickUpTheme {
                StickUpGameScreen(
                    sound = soundManager,
                    prefs = preferences
                )
            }
        }
    }

    override fun onPause() {
        super.onPause()
        soundManager.isEnabled = false
    }

    override fun onResume() {
        super.onResume()
        soundManager.isEnabled = preferences.soundEnabled
    }
}
