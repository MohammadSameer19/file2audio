// Audio Parameters - Direct PCM encoding
const SAMPLE_RATE = 202860;  // 202.86 kHz
const BITS_PER_SAMPLE = 16;

// Multi-file archive functions
function createArchive(filesData) {
    // Calculate total size
    let totalSize = 4; // Number of files (4 bytes)
    
    filesData.forEach(file => {
        totalSize += 4; // Name length
        totalSize += file.name.length; // Name
        totalSize += 4; // Data length
        totalSize += file.data.length; // Data
    });
    
    const archive = new Uint8Array(totalSize);
    const view = new DataView(archive.buffer);
    let offset = 0;
    
    // Write number of files
    view.setUint32(offset, filesData.length, false);
    offset += 4;
    
    // Write each file
    filesData.forEach(file => {
        const nameBytes = new TextEncoder().encode(file.name);
        
        // Name length
        view.setUint32(offset, nameBytes.length, false);
        offset += 4;
        
        // Name
        archive.set(nameBytes, offset);
        offset += nameBytes.length;
        
        // Data length
        view.setUint32(offset, file.data.length, false);
        offset += 4;
        
        // Data
        archive.set(file.data, offset);
        offset += file.data.length;
    });
    
    return archive;
}

function parseArchive(archiveData) {
    const view = new DataView(archiveData.buffer, archiveData.byteOffset);
    let offset = 0;
    
    // Read number of files
    const numFiles = view.getUint32(offset, false);
    offset += 4;
    
    const files = [];
    
    // Read each file
    for (let i = 0; i < numFiles; i++) {
        // Name length
        const nameLength = view.getUint32(offset, false);
        offset += 4;
        
        // Name
        const nameBytes = archiveData.slice(offset, offset + nameLength);
        const name = new TextDecoder().decode(nameBytes);
        offset += nameLength;
        
        // Data length
        const dataLength = view.getUint32(offset, false);
        offset += 4;
        
        // Data
        const data = archiveData.slice(offset, offset + dataLength);
        offset += dataLength;
        
        files.push({ name, data });
    }
    
    return files;
}

function createMultiFileHeader(numFiles, dataSize, isEncrypted) {
    const header = new Uint8Array(9);
    const view = new DataView(header.buffer);
    
    view.setUint32(0, numFiles, false);
    view.setUint32(4, dataSize, false);
    header[8] = isEncrypted;
    
    return header;
}

function parseMultiFileHeader(data) {
    const view = new DataView(data.buffer, data.byteOffset);
    
    const numFiles = view.getUint32(0, false);
    const dataSize = view.getUint32(4, false);
    const isEncrypted = data[8];
    
    // Extract archive data and trim to actual size (removes padding)
    const archiveData = data.slice(9, 9 + dataSize);
    
    // Show decryption box if encrypted
    if (isEncrypted) {
        document.getElementById('decryption-options').classList.remove('hidden');
    } else {
        document.getElementById('decryption-options').classList.add('hidden');
    }
    
    return { numFiles, archiveData, isEncrypted };
}

// AES-256-GCM Encryption Functions
async function encryptData(data, password) {
    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive key from password using PBKDF2
    const passwordKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        passwordKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt']
    );
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        data
    );
    
    // Combine salt + iv + encrypted data
    const result = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    result.set(salt, 0);
    result.set(iv, salt.length);
    result.set(new Uint8Array(encryptedData), salt.length + iv.length);
    
    return result;
}

async function decryptData(encryptedData, password) {
    try {
        // Validate input
        if (!encryptedData || encryptedData.length < 28) {
            throw new Error('Invalid encrypted data: too short (minimum 28 bytes required)');
        }
        
        if (!password || password.length === 0) {
            throw new Error('Password is required');
        }
        
        // Extract salt, iv, and encrypted data
        const salt = encryptedData.slice(0, 16);
        const iv = encryptedData.slice(16, 28);
        const data = encryptedData.slice(28);
        
        // Derive key from password
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        const key = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['decrypt']
        );
        
        // Decrypt data
        const decryptedData = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );
        
        return new Uint8Array(decryptedData);
    } catch (error) {
        // Provide more specific error messages
        if (error.name === 'OperationError') {
            throw new Error('Wrong password or corrupted data');
        }
        throw error;
    }
}

// Convert bytes directly to audio samples (PCM encoding)
// Pack 2 bytes into each 16-bit sample for maximum efficiency
function bytesToAudioSamples(data) {
    // Pad data to even length
    const paddedData = data.length % 2 === 0 ? data : new Uint8Array([...data, 0]);
    const samples = new Int16Array(paddedData.length / 2);
    
    for (let i = 0; i < samples.length; i++) {
        // Pack two bytes into one 16-bit sample
        // High byte and low byte
        const highByte = paddedData[i * 2];
        const lowByte = paddedData[i * 2 + 1];
        samples[i] = (highByte << 8) | lowByte;
        // Convert to signed
        if (samples[i] > 32767) samples[i] -= 65536;
    }
    
    return samples;
}

// Convert audio samples back to bytes
function audioSamplesToBytes(samples) {
    const data = new Uint8Array(samples.length * 2);
    
    for (let i = 0; i < samples.length; i++) {
        // Convert signed to unsigned
        let sample = samples[i];
        if (sample < 0) sample += 65536;
        
        // Unpack two bytes from one 16-bit sample
        data[i * 2] = (sample >> 8) & 0xFF;      // High byte
        data[i * 2 + 1] = sample & 0xFF;         // Low byte
    }
    
    return data;
}

function createWavBlob(audioBuffer) {
    const numChannels = 1;
    const sampleRate = SAMPLE_RATE;
    const bitsPerSample = BITS_PER_SAMPLE;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    
    const dataSize = audioBuffer.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // WAV header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Audio data - directly write Int16Array
    let offset = 44;
    for (let i = 0; i < audioBuffer.length; i++) {
        view.setInt16(offset, audioBuffer[i], true);
        offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
}

function parseWavFile(arrayBuffer) {
    const view = new DataView(arrayBuffer);
    
    // Skip to data chunk (simplified - assumes standard WAV format)
    const dataOffset = 44;
    const dataSize = view.getUint32(40, true);
    const numSamples = dataSize / 2;
    
    // Read as Int16Array
    const samples = new Int16Array(numSamples);
    for (let i = 0; i < numSamples; i++) {
        samples[i] = view.getInt16(dataOffset + i * 2, true);
    }
    
    // Convert samples back to bytes
    return audioSamplesToBytes(samples);
}

function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
