# 🎵 File to Audio Converter

Convert any file to audio and back using direct PCM encoding with optional AES-256-GCM encryption. Works 100% client-side in your browser or via Python CLI tool.

**Features:** Multiple files • AES-256-GCM encryption • 100% efficient • No uploads

## Features

### Web App (Browser-Based)
- 🌐 **100% client-side** - No server uploads, complete privacy
- 📁 **Multiple file support** - Combine many files into one audio file
- 🔒 **AES-256-GCM encryption** - Optional password protection
- 📱 **Responsive design** - Works on mobile and desktop
- ⚡ **Drag & drop** - Easy file upload
- 🎵 **Audio preview** - Listen before downloading
- 📊 **File management** - Add/remove files, individual downloads

### CLI Tool (Python)
- 🔄 **Universal converter** - ANY file format to audio (WAV)
- 🔓 **Lossless decoding** - Perfect reconstruction of original files
- 🔐 **AES-256-GCM encryption** - Optional password protection with PBKDF2
- ⚡ **Highly efficient** - Audio size ≈ File size (100% efficiency)
- 📦 **Zero dependencies** - No external libraries for basic usage
- 🎯 **Format preservation** - Automatic file extension detection
- ✅ **Verified integrity** - Size validation on decode

## How It Works

This tool uses **direct PCM (Pulse Code Modulation) encoding** to convert file data into audio:

1. **File Reading** - Reads any file as raw binary data
2. **Encryption (Optional)** - Applies AES-256-GCM with PBKDF2 key derivation
3. **Header Creation** - Stores file metadata (extension, size, encryption flag)
4. **PCM Encoding** - Packs 2 bytes of data into each 16-bit audio sample
5. **WAV Generation** - Creates standard WAV file at 202.86 kHz sample rate

**Efficiency:** Audio file size = Original file size + ~44 bytes (WAV header)

**Decoding:** Reverses the process to perfectly reconstruct the original file(s)

## Quick Start

### Web App

Simply open `index.html` in your browser, or run a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Then visit http://localhost:8000
```

### CLI Usage

#### Installation

**Basic Usage (No Encryption)**
```bash
# No installation required! Just Python 3.6+
python file2audio.py encode file.txt file.wav
```

**With Encryption Support**
```bash
# Install cryptography library
pip install cryptography

# Or install from requirements.txt
pip install -r requirements.txt
```

#### Basic Usage

**Encode File to Audio**
```bash
# Without encryption
python file2audio.py encode photo.jpg photo.wav

# With encryption (will prompt for password)
python file2audio.py encode secret.pdf secret.wav --encrypt
```

**Decode Audio to File**
```bash
# Without encryption
python file2audio.py decode photo.wav restored.jpg

# With encryption (will prompt for password)
python file2audio.py decode secret.wav restored.pdf
```

## Examples

```bash
# Convert an image
python file2audio.py encode screenshot.png screenshot.wav

# Convert a document with encryption
python file2audio.py encode document.pdf document.wav --encrypt
# Enter password: ********
# Confirm password: ********

# Decode it back
python file2audio.py decode document.wav restored.pdf
# Enter password: ******** (if encrypted)

# Works with ANY file format
python file2audio.py encode video.mp4 video.wav
python file2audio.py encode archive.zip archive.wav
python file2audio.py encode code.py code.wav

# Decode automatically detects file extension
python file2audio.py decode video.wav restored
# Creates: restored.mp4
```

## Technical Details

### Audio Specifications
- **Sample Rate**: 202,860 Hz (202.86 kHz)
- **Bit Depth**: 16-bit
- **Channels**: Mono
- **Format**: WAV (uncompressed)
- **Encoding**: Direct PCM (2 bytes per sample)
- **Efficiency**: 100% (audio size ≈ file size)

### Encryption Specifications
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2-HMAC-SHA256
- **Iterations**: 100,000 (strong protection against brute force)
- **Salt**: 16 bytes (randomly generated per encryption)
- **Nonce/IV**: 12 bytes (randomly generated per encryption)
- **Overhead**: 28 bytes (salt + nonce)

### File Size Comparison

| Original File | Audio Size (No Encryption) | Audio Size (Encrypted) | Duration |
|--------------|---------------------------|------------------------|----------|
| 100 KB | 100.04 KB | 100.07 KB | 0.25 sec |
| 1 MB | 1.00 MB | 1.00 MB | 2.5 sec |
| 5 MB | 5.00 MB | 5.00 MB | 12.6 sec |
| 10 MB | 10.00 MB | 10.00 MB | 25.2 sec |

**Duration Formula:** `(File size in bytes / 2) / 202,860`

## Security & Privacy

### Encryption (Optional)
When you enable encryption:
- Password is used to derive a 256-bit encryption key
- Each encryption uses unique random salt and nonce
- GCM mode provides authentication (detects tampering)
- Password is never stored, only used for key derivation
- Minimum password length: 8 characters (16+ recommended)

### Privacy (Web App)
- All processing happens in your browser
- No files are uploaded to any server
- No data collection or tracking
- Works completely offline after initial load
- Open source - you can audit the code

## Advantages & Limitations

### ✅ Advantages
- **100% efficient** - Audio size = File size (no wasted space)
- **Lossless** - Perfect reconstruction of original files
- **Universal** - Works with ANY file type
- **Secure** - Industry-standard AES-256-GCM encryption
- **Private** - No server uploads (web version)
- **Fast** - Direct encoding/decoding
- **Multiple files** - Combine many files into one audio

### ⚠️ Limitations
- **Audio quality** - Sounds like white noise (not meant for listening)
- **Lossless required** - Lossy compression (MP3, AAC) will corrupt data
- **High sample rate** - 202.86 kHz may not play on all devices
- **File size** - Large files create large audio files
- **Transmission** - Requires exact file transfer (not streaming)

## Use Cases

1. **Secure File Sharing** - Encrypt files and share via audio messaging apps
2. **Bypass Restrictions** - Share files through audio-only channels
3. **Data Backup** - Store files in unique audio format
4. **Educational** - Learn about data encoding and encryption
5. **Creative Projects** - Data art, audio-visual experiments
6. **Stealth Communication** - Files disguised as audio

## Project Structure

```
.
├── index.html          # Web app - main HTML interface
├── crypto.js           # Cryptography & data encoding (311 lines)
├── app.js              # UI logic & event handlers (545 lines)
├── style.css           # Responsive styles with dark mode
├── file2audio.py       # CLI tool - Python implementation
├── requirements.txt    # Python dependencies (cryptography - optional)
├── vercel.json         # Vercel deployment configuration
├── README.md           # This file - main documentation
└── FEATURES.md         # Detailed feature documentation
```

### Code Organization

**crypto.js** - Core cryptography and data encoding:
- Audio parameters and constants
- Multi-file archive functions
- Header creation and parsing
- AES-256-GCM encryption/decryption
- PCM audio encoding/decoding
- WAV file generation and parsing

**app.js** - User interface and application logic:
- Global state management
- Event handlers (file upload, buttons, theme)
- Progress tracking and UI updates
- File management and downloads
- Utility functions (formatting, icons)

## Browser Compatibility

### Web App
- ✅ Chrome/Edge 60+
- ✅ Firefox 57+
- ✅ Safari 11+
- ✅ Opera 47+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Required APIs:** Web Crypto API, FileReader API, Blob API, DataView API

### CLI Tool
- ✅ Python 3.6+
- ✅ Windows, macOS, Linux
- ✅ Optional: cryptography library for encryption

## Code Quality

✅ Clean, modular code structure (split into crypto.js and app.js)  
✅ No console.log or debug statements  
✅ Comprehensive error handling  
✅ Password visibility toggles  
✅ Automatic state reset after operations  
✅ Dark mode support with persistence  
✅ Production-ready

## FAQ

**Q: Is this secure for sensitive files?**
A: Yes, when using encryption. AES-256-GCM is military-grade encryption. However, use a strong password (16+ characters).

**Q: Can I share the audio via WhatsApp/Telegram?**
A: Yes, but ensure the file is sent as a document/file, not as audio (which may be compressed).

**Q: Why does the audio sound like noise?**
A: The audio is raw data, not meant for listening. It's designed for data storage, not playback.

**Q: What's the maximum file size?**
A: WAV format limit is 4 GB. Browser memory may limit web app to smaller files.

**Q: Can I use this for cloud storage?**
A: Technically yes, but may violate terms of service. Use responsibly.

**Q: Does it work offline?**
A: Yes! The web app works offline after initial load. CLI tool always works offline.

## Contributing

Contributions are welcome! Areas for improvement:
- Error correction codes (Reed-Solomon)
- Compression before encoding
- Additional encryption algorithms
- Batch processing
- Resume interrupted operations

## License

MIT License - Free for personal and commercial use

## Disclaimer

This tool is for educational and legitimate use cases. Do not abuse cloud storage services or violate their terms of service. Always respect copyright and privacy laws.
