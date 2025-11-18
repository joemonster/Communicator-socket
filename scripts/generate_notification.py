#!/usr/bin/env python3
"""
Skrypt do generowania prostego dźwięku powiadomienia.
Tworzy krótki beep (440 Hz, 0.3 sekundy).
"""

import wave
import math
import struct

def generate_beep(filename, frequency=440, duration=0.3, volume=0.5, sample_rate=44100):
    """Generuje prosty dźwięk beep"""
    num_samples = int(sample_rate * duration)

    # Otwórz plik WAV
    wav_file = wave.open(filename, 'w')
    wav_file.setnchannels(1)  # Mono
    wav_file.setsampwidth(2)  # 16-bit
    wav_file.setframerate(sample_rate)

    # Generuj próbki audio
    for i in range(num_samples):
        # Generuj falę sinusoidalną
        value = math.sin(2 * math.pi * frequency * i / sample_rate)

        # Dodaj envelope (fade in/out) dla gładszego dźwięku
        if i < sample_rate * 0.05:  # Fade in
            value *= i / (sample_rate * 0.05)
        elif i > num_samples - sample_rate * 0.05:  # Fade out
            value *= (num_samples - i) / (sample_rate * 0.05)

        # Konwertuj do 16-bit integer
        value = int(value * volume * 32767)
        data = struct.pack('<h', value)
        wav_file.writeframes(data)

    wav_file.close()
    print(f"✅ Wygenerowano plik: {filename}")

if __name__ == '__main__':
    generate_beep('../public/notification.wav')
    print("💡 Możesz teraz użyć tego pliku lub zastąpić go własnym dźwiękiem MP3/WAV")
