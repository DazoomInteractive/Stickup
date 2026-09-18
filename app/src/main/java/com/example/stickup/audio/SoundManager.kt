package com.example.stickup.audio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlin.math.sin

class SoundManager {
    var isEnabled: Boolean = true
    private val scope = CoroutineScope(Dispatchers.Default)

    private fun playTone(
        startFreq: Float,
        endFreq: Float,
        durationMs: Int,
        amplitude: Float = 0.5f,
        type: String = "sine"
    ) {
        if (!isEnabled) return
        scope.launch {
            try {
                val sampleRate = 22050
                val numSamples = (sampleRate * durationMs) / 1000
                val buffer = ShortArray(numSamples)

                for (i in 0 until numSamples) {
                    val progress = i.toFloat() / numSamples
                    val freq = startFreq + (endFreq - startFreq) * progress
                    val time = i.toDouble() / sampleRate
                    val sampleVal = when (type) {
                        "square" -> if (sin(2.0 * Math.PI * freq * time) > 0) 1.0 else -1.0
                        else -> sin(2.0 * Math.PI * freq * time)
                    }
                    // Apply smooth attack and decay envelope
                    val envelope = when {
                        progress < 0.05f -> progress / 0.05f
                        progress > 0.7f -> (1f - progress) / 0.3f
                        else -> 1f
                    }
                    buffer[i] = (sampleVal * 32767.0 * amplitude * envelope).toInt().coerceIn(-32768, 32767).toShort()
                }

                val track = AudioTrack.Builder()
                    .setAudioAttributes(
                        AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_GAME)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setAudioFormat(
                        AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(buffer.size * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build()

                track.write(buffer, 0, buffer.size)
                track.play()
                // Release after playback
                kotlinx.coroutines.delay(durationMs.toLong() + 50)
                track.release()
            } catch (_: Exception) {}
        }
    }

    fun playJump() {
        playTone(320f, 650f, 90, 0.4f)
    }

    fun playSpring() {
        playTone(380f, 980f, 160, 0.6f)
    }

    fun playDiamond() {
        playTone(1100f, 1750f, 110, 0.45f)
    }

    fun playCoin() {
        playTone(980f, 1320f, 100, 0.5f)
    }

    fun playTrade() {
        scope.launch {
            playTone(523f, 659f, 80, 0.4f)
            kotlinx.coroutines.delay(70)
            playTone(659f, 784f, 80, 0.45f)
            kotlinx.coroutines.delay(70)
            playTone(784f, 1046f, 140, 0.5f)
        }
    }

    fun playPowerUp() {
        playTone(400f, 1100f, 180, 0.55f)
    }

    fun playStomp() {
        playTone(220f, 90f, 120, 0.6f, "square")
    }

    fun playShoot() {
        playTone(700f, 250f, 80, 0.35f)
    }

    fun playGameOver() {
        scope.launch {
            playTone(440f, 350f, 120, 0.5f)
            kotlinx.coroutines.delay(130)
            playTone(350f, 220f, 200, 0.5f)
        }
    }
}
