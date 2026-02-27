#!/usr/bin/env python3
"""
File to Audio Converter
Converts any file to audio and back using direct PCM encoding
Supports optional AES-256-GCM encryption
"""

import sys
import struct
import wave
import os
from pathlib import Path
from getpass import getpass

# Audio Parameters
SAMPLE_RATE = 202860  # 202.86 kHz
BITS_PER_SAMPLE = 16

# Try to import cryptography for encryption support
try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
    ENCRYPTION_AVAILABLE = True
except ImportError:
    ENCRYPTION_AVAILABLE = False


def encrypt_data(data, password):
    """Encrypt data using AES-256-GCM"""
    if not ENCRYPTION_AVAILABLE:
        print("Error: cryptography library not installed. Install with: pip install cryptography")
        sys.exit(1)
    
    # Generate salt
    salt = os.urandom(16)
    
    # Derive key from password using PBKDF2
    kdf = PBKDF2(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = kdf.derive(password.encode())
    
    # Generate nonce (IV)
    nonce = os.urandom(12)
    
    # Encrypt
    aesgcm = AESGCM(key)
    encrypted_data = aesgcm.encrypt(nonce, data, None)
    
    # Combine salt + nonce + encrypted data
    return salt + nonce + encrypted_data


def decrypt_data(encrypted_data, password):
    """Decrypt data using AES-256-GCM"""
    if not ENCRYPTION_AVAILABLE:
        print("Error: cryptography library not installed. Install with: pip install cryptography")
        sys.exit(1)
    
    # Extract salt, nonce, and encrypted data
    salt = encrypted_data[:16]
    nonce = encrypted_data[16:28]
    ciphertext = encrypted_data[28:]
    
    # Derive key from password
    kdf = PBKDF2(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    key = kdf.derive(password.encode())
    
    # Decrypt
    aesgcm = AESGCM(key)
    decrypted_data = aesgcm.decrypt(nonce, ciphertext, None)
    
    return decrypted_data


def bytes_to_audio_samples(data):
    """Convert bytes directly to 16-bit audio samples (2 bytes per sample)"""
    # Pad to even length if needed
    if len(data) % 2 != 0:
        data = data + b'\x00'
    
    samples = []
    for i in range(0, len(data), 2):
        # Pack two bytes into one 16-bit sample
        high_byte = data[i]
        low_byte = data[i + 1]
        sample = (high_byte << 8) | low_byte
        # Convert to signed
        if sample > 32767:
            sample -= 65536
        samples.append(sample)
    return samples


def audio_samples_to_bytes(samples):
    """Convert 16-bit audio samples back to bytes (2 bytes per sample)"""
    data = bytearray()
    for sample in samples:
        # Convert signed to unsigned
        if sample < 0:
            sample += 65536
        # Unpack two bytes from one 16-bit sample
        high_byte = (sample >> 8) & 0xFF
        low_byte = sample & 0xFF
        data.append(high_byte)
        data.append(low_byte)
    return bytes(data)


def encode_image(image_path, output_audio, encrypt=False):
    """Encode file to audio"""
    print(f"Reading file: {image_path}")
    
    # Read file
    with open(image_path, 'rb') as f:
        file_data = f.read()
    
    original_size = len(file_data)
    
    # Get file extension
    ext = Path(image_path).suffix.encode('utf-8')
    
    # Encrypt if requested
    is_encrypted = 0
    data_to_encode = file_data
    
    if encrypt:
        if not ENCRYPTION_AVAILABLE:
            print("Error: Encryption requires cryptography library")
            print("Install with: pip install cryptography")
            sys.exit(1)
        
        password = getpass("Enter password: ")
        confirm_password = getpass("Confirm password: ")
        
        if password != confirm_password:
            print("Error: Passwords do not match")
            sys.exit(1)
        
        if len(password) < 8:
            print("Error: Password must be at least 8 characters")
            sys.exit(1)
        
        print("Encrypting...")
        data_to_encode = encrypt_data(file_data, password)
        is_encrypted = 1
    
    # Create header: [ext_len(1)][ext][original_size(4)][is_encrypted(1)]
    header = struct.pack('B', len(ext)) + ext
    header += struct.pack('>I', original_size)
    header += struct.pack('B', is_encrypted)
    
    # Combine header and data
    full_data = header + data_to_encode
    
    print(f"File size: {original_size} bytes")
    if encrypt:
        print(f"Encrypted size: {len(data_to_encode)} bytes")
    
    # Convert to audio samples
    print("Converting to audio...")
    audio_samples = bytes_to_audio_samples(full_data)
    
    # Write WAV file
    print(f"Writing audio file: {output_audio}")
    with wave.open(output_audio, 'wb') as wav:
        wav.setnchannels(1)  # Mono
        wav.setsampwidth(2)  # 16-bit
        wav.setframerate(SAMPLE_RATE)
        
        # Convert to bytes
        audio_bytes = struct.pack(f'{len(audio_samples)}h', *audio_samples)
        wav.writeframes(audio_bytes)
    
    duration = len(audio_samples) / SAMPLE_RATE
    audio_size = os.path.getsize(output_audio)
    efficiency = (original_size / audio_size) * 100
    
    print(f"✓ Done!")
    print(f"  Audio duration: {duration:.2f} seconds")
    print(f"  Audio size: {audio_size} bytes")
    print(f"  Efficiency: {efficiency:.1f}%")
    if encrypt:
        print(f"  🔒 File is encrypted")


def decode_audio(audio_path, output_image):
    """Decode audio file back to file"""
    print(f"Reading audio: {audio_path}")
    
    # Read WAV file
    with wave.open(audio_path, 'rb') as wav:
        sample_rate = wav.getframerate()
        n_samples = wav.getnframes()
        audio_data = wav.readframes(n_samples)
    
    # Convert to samples
    samples = struct.unpack(f'{n_samples}h', audio_data)
    
    print("Converting to bytes...")
    
    # Convert samples back to bytes
    data = audio_samples_to_bytes(samples)
    
    # Parse header
    try:
        ext_len = data[0]
        ext = data[1:1+ext_len].decode('utf-8')
        offset = 1 + ext_len
        
        original_size = struct.unpack('>I', data[offset:offset+4])[0]
        is_encrypted = data[offset+4]
        
        file_data = data[offset+5:]
        
        # Decrypt if encrypted
        if is_encrypted:
            if not ENCRYPTION_AVAILABLE:
                print("Error: This file is encrypted but cryptography library is not installed")
                print("Install with: pip install cryptography")
                sys.exit(1)
            
            print("🔒 File is encrypted")
            password = getpass("Enter password: ")
            
            print("Decrypting...")
            try:
                file_data = decrypt_data(file_data, password)
            except Exception as e:
                print(f"✗ Decryption failed: Wrong password or corrupted data")
                sys.exit(1)
        
        # Verify size
        if len(file_data) != original_size:
            print(f"Warning: Size mismatch. Expected {original_size}, got {len(file_data)}")
        
        # Add extension if not provided
        if not output_image.endswith(ext):
            output_image = output_image + ext
        
        # Write file
        print(f"Writing file: {output_image}")
        with open(output_image, 'wb') as f:
            f.write(file_data)
        
        print(f"✓ Done! File restored: {len(file_data)} bytes")
        
    except Exception as e:
        print(f"✗ Error decoding: {e}")
        sys.exit(1)


def main():
    if len(sys.argv) < 4:
        print("File to Audio Converter (Direct PCM Encoding + AES-256-GCM Encryption)")
        print("\nUsage:")
        print("  Encode: python img2audio.py encode <file> <output.wav> [--encrypt]")
        print("  Decode: python img2audio.py decode <audio.wav> <output_file>")
        print("\nExample:")
        print("  python img2audio.py encode photo.jpg photo.wav")
        print("  python img2audio.py encode secret.pdf secret.wav --encrypt")
        print("  python img2audio.py decode photo.wav restored.jpg")
        print("\nNote: Audio file size ≈ File size (very efficient!)")
        if not ENCRYPTION_AVAILABLE:
            print("\n⚠ Encryption not available. Install with: pip install cryptography")
        sys.exit(1)
    
    command = sys.argv[1].lower()
    
    if command == 'encode':
        image_path = sys.argv[2]
        output_audio = sys.argv[3]
        encrypt = '--encrypt' in sys.argv or '-e' in sys.argv
        
        if not os.path.exists(image_path):
            print(f"✗ Error: File not found: {image_path}")
            sys.exit(1)
        
        encode_image(image_path, output_audio, encrypt)
        
    elif command == 'decode':
        audio_path = sys.argv[2]
        output_image = sys.argv[3]
        
        if not os.path.exists(audio_path):
            print(f"✗ Error: Audio file not found: {audio_path}")
            sys.exit(1)
        
        decode_audio(audio_path, output_image)
        
    else:
        print(f"✗ Unknown command: {command}")
        print("Use 'encode' or 'decode'")
        sys.exit(1)


if __name__ == '__main__':
    main()
