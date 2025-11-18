# 🚀 Szybki Start - Domowy Czat

## Uruchomienie w 3 krokach:

### 1️⃣ Zainstaluj zależności
```bash
npm install
```

### 2️⃣ Uruchom aplikację
```bash
npm run dev
```

### 3️⃣ Otwórz w przeglądarce
```
http://localhost:3000
```

---

## 📱 Dostęp z innych urządzeń

### Znajdź swój adres IP:

**Windows:**
```bash
ipconfig
```
Szukaj: `IPv4 Address` → np. `192.168.0.10`

**Mac/Linux:**
```bash
hostname -I
# lub
ip addr
```

### Wpisz w przeglądarce na innym urządzeniu:
```
http://192.168.0.10:3000
```
*(Zamień 192.168.0.10 na swój IP)*

---

## 🔐 Domyślne konta:

| Użytkownik | Hasło      |
|------------|------------|
| Mama       | `mama123`  |
| Tata       | `tata123`  |
| Michał     | `michal123`|
| Salon      | `salon123` |

### Zmiana haseł:
Edytuj plik: `lib/usersConfig.js`

---

## ❓ Problemy?

### Port 3000 zajęty?
```bash
PORT=3001 npm run dev
```

### Firewall blokuje?
- **Windows:** Zezwól Node.js w Windows Defender Firewall
- **Mac:** System Preferences → Security → Firewall → Allow
- **Linux:** `sudo ufw allow 3000/tcp`

### Nie możesz połączyć się z innego urządzenia?
1. Sprawdź, czy oba urządzenia są w tej samej sieci Wi-Fi
2. Wyłącz tymczasowo firewall do testów
3. Sprawdź IP ponownie (może się zmienić)

---

## 📚 Więcej informacji

Pełna dokumentacja: **[README.md](README.md)**

---

**Gotowe! Miłego czatowania! 🎉**
