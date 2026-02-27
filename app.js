// Global state
let selectedFiles = [];
let selectedAudio = null;
let encryptionEnabled = false;
let darkMode = false;

// Password visibility toggle
document.addEventListener('click', (e) => {
    if (e.target.closest('.password-toggle')) {
        const button = e.target.closest('.password-toggle');
        const targetId = button.dataset.target;
        const input = document.getElementById(targetId);
        const eyeIcon = button.querySelector('.eye-icon');
        const eyeOffIcon = button.querySelector('.eye-off-icon');
        
        if (input.type === 'password') {
            input.type = 'text';
            eyeIcon.classList.add('hidden');
            eyeOffIcon.classList.remove('hidden');
        } else {
            input.type = 'password';
            eyeIcon.classList.remove('hidden');
            eyeOffIcon.classList.add('hidden');
        }
    }
});

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');

themeToggle.addEventListener('click', () => {
    darkMode = !darkMode;
    document.body.classList.toggle('dark-mode', darkMode);
    sunIcon.classList.toggle('hidden', darkMode);
    moonIcon.classList.toggle('hidden', !darkMode);
    localStorage.setItem('darkMode', darkMode);
});

// Load saved theme
if (localStorage.getItem('darkMode') === 'true') {
    darkMode = true;
    document.body.classList.add('dark-mode');
    sunIcon.classList.add('hidden');
    moonIcon.classList.remove('hidden');
}

// Encryption toggle
const enableEncryptionCheckbox = document.getElementById('enable-encryption');
const passwordFields = document.getElementById('password-fields');

enableEncryptionCheckbox.addEventListener('change', (e) => {
    encryptionEnabled = e.target.checked;
    passwordFields.classList.toggle('hidden', !encryptionEnabled);
});

// Tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabName = btn.dataset.tab;
        
        // Update buttons
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
    });
});

// Image upload handling
const imageUploadArea = document.getElementById('image-upload-area');
const imageInput = document.getElementById('image-input');
const imagePreview = document.getElementById('image-preview');
const encodeBtn = document.getElementById('encode-btn');

imageUploadArea.addEventListener('click', () => imageInput.click());

imageUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageUploadArea.classList.add('dragover');
});

imageUploadArea.addEventListener('dragleave', () => {
    imageUploadArea.classList.remove('dragover');
});

imageUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    imageUploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        selectedFiles = [...selectedFiles, ...files];
        handleFilesSelect(selectedFiles);
    }
});

imageInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        selectedFiles = [...selectedFiles, ...files];
        handleFilesSelect(selectedFiles);
    }
    e.target.value = '';
});

function handleFilesSelect(files) {
    const filesList = document.getElementById('files-list');
    filesList.innerHTML = '';
    
    let totalSize = 0;
    
    files.forEach((file, index) => {
        totalSize += file.size;
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const icon = document.createElement('div');
        icon.className = 'file-item-icon';
        icon.textContent = getFileIcon(file.name);
        
        const info = document.createElement('div');
        info.className = 'file-item-info';
        
        const name = document.createElement('div');
        name.className = 'file-item-name';
        name.textContent = file.name;
        
        const size = document.createElement('div');
        size.className = 'file-item-size';
        size.textContent = formatBytes(file.size);
        
        info.appendChild(name);
        info.appendChild(size);
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'file-item-remove';
        removeBtn.textContent = 'Remove';
        removeBtn.onclick = () => removeFile(index);
        
        fileItem.appendChild(icon);
        fileItem.appendChild(info);
        fileItem.appendChild(removeBtn);
        
        filesList.appendChild(fileItem);
    });
    
    imagePreview.classList.remove('hidden');
    document.getElementById('file-count').textContent = `${files.length} file(s)`;
    document.getElementById('total-size').textContent = formatBytes(totalSize);
    encodeBtn.disabled = false;
    
    document.getElementById('encryption-options').classList.remove('hidden');
    document.getElementById('encode-result').classList.add('hidden');
}

function removeFile(index) {
    selectedFiles = selectedFiles.filter((_, i) => i !== index);
    if (selectedFiles.length > 0) {
        handleFilesSelect(selectedFiles);
    } else {
        imagePreview.classList.add('hidden');
        encodeBtn.disabled = true;
        document.getElementById('encryption-options').classList.add('hidden');
    }
}

// Audio upload handling
const audioUploadArea = document.getElementById('audio-upload-area');
const audioInput = document.getElementById('audio-input');
const audioPreview = document.getElementById('audio-preview');
const previewAudio = document.getElementById('preview-audio');
const decodeBtn = document.getElementById('decode-btn');

audioUploadArea.addEventListener('click', () => audioInput.click());

audioUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    audioUploadArea.classList.add('dragover');
});

audioUploadArea.addEventListener('dragleave', () => {
    audioUploadArea.classList.remove('dragover');
});

audioUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    audioUploadArea.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'audio/wav') {
        handleAudioSelect(file);
    }
});

audioInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleAudioSelect(file);
    }
});

function handleAudioSelect(file) {
    selectedAudio = file;
    
    const url = URL.createObjectURL(file);
    previewAudio.src = url;
    audioPreview.classList.remove('hidden');
    document.getElementById('audio-name').textContent = file.name;
    document.getElementById('audio-file-size').textContent = formatBytes(file.size);
    decodeBtn.disabled = false;
    
    document.getElementById('decode-result').classList.add('hidden');
}

// Encode button
encodeBtn.addEventListener('click', async () => {
    if (selectedFiles.length === 0) return;
    
    if (encryptionEnabled) {
        const password = document.getElementById('encode-password').value.trim();
        const confirmPassword = document.getElementById('encode-password-confirm').value.trim();
        
        if (!password || password.length < 8) {
            alert('Password must be at least 8 characters long');
            return;
        }
        
        if (password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }
    }
    
    encodeBtn.disabled = true;
    const progressContainer = document.getElementById('encode-progress');
    const progressFill = document.getElementById('encode-progress-fill');
    const statusText = document.getElementById('encode-status');
    
    progressContainer.classList.remove('hidden');
    progressFill.style.width = '0%';
    
    try {
        statusText.textContent = 'Reading files...';
        
        const filesData = [];
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            const data = await readFileAsArrayBuffer(file);
            filesData.push({
                name: file.name,
                data: new Uint8Array(data)
            });
            progressFill.style.width = `${(i + 1) / selectedFiles.length * 20}%`;
        }
        
        statusText.textContent = 'Preparing data...';
        progressFill.style.width = '25%';
        
        const archiveData = createArchive(filesData);
        
        let dataToEncode = archiveData;
        let isEncrypted = 0;
        
        if (encryptionEnabled) {
            statusText.textContent = 'Encrypting...';
            progressFill.style.width = '35%';
            
            const password = document.getElementById('encode-password').value.trim();
            dataToEncode = await encryptData(archiveData, password);
            isEncrypted = 1;
        }
        
        const header = createMultiFileHeader(selectedFiles.length, dataToEncode.length, isEncrypted);
        const fullData = new Uint8Array(header.length + dataToEncode.length);
        fullData.set(header, 0);
        fullData.set(dataToEncode, header.length);
        
        statusText.textContent = 'Generating audio...';
        progressFill.style.width = '60%';
        
        const audioBuffer = bytesToAudioSamples(fullData);
        
        statusText.textContent = 'Creating WAV file...';
        progressFill.style.width = '90%';
        
        const wavBlob = createWavBlob(audioBuffer);
        
        progressFill.style.width = '100%';
        statusText.textContent = 'Done!';
        
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            showEncodeResult(wavBlob, audioBuffer.length / SAMPLE_RATE);
        }, 500);
        
    } catch (error) {
        progressContainer.classList.add('hidden');
        alert('Error encoding files: ' + error.message);
    } finally {
        encodeBtn.disabled = false;
    }
});

// Decode button
decodeBtn.addEventListener('click', async () => {
    if (!selectedAudio) return;
    
    decodeBtn.disabled = true;
    const progressContainer = document.getElementById('decode-progress');
    const progressFill = document.getElementById('decode-progress-fill');
    const statusText = document.getElementById('decode-status');
    
    progressContainer.classList.remove('hidden');
    progressFill.style.width = '0%';
    
    try {
        statusText.textContent = 'Reading audio file...';
        const audioData = await readFileAsArrayBuffer(selectedAudio);
        
        statusText.textContent = 'Decoding audio...';
        progressFill.style.width = '20%';
        
        const data = parseWavFile(audioData);
        
        statusText.textContent = 'Reconstructing files...';
        progressFill.style.width = '50%';
        
        const { numFiles, archiveData, isEncrypted } = parseMultiFileHeader(data);
        
        let finalData = archiveData;
        
        if (isEncrypted) {
            const password = document.getElementById('decode-password').value.trim();
            
            if (!password) {
                progressContainer.classList.add('hidden');
                alert('This file is encrypted. Please enter the password.');
                decodeBtn.disabled = false;
                return;
            }
            
            statusText.textContent = 'Decrypting...';
            progressFill.style.width = '70%';
            
            try {
                finalData = await decryptData(archiveData, password);
            } catch (error) {
                progressContainer.classList.add('hidden');
                alert('Decryption failed. Wrong password or corrupted data.\n\nPlease verify:\n- Password is correct\n- Audio file was not compressed or modified');
                decodeBtn.disabled = false;
                return;
            }
        }
        
        statusText.textContent = 'Extracting files...';
        progressFill.style.width = '85%';
        
        const files = parseArchive(finalData);
        
        progressFill.style.width = '100%';
        statusText.textContent = 'Done!';
        
        setTimeout(() => {
            progressContainer.classList.add('hidden');
            showDecodeResult(files);
        }, 500);
        
    } catch (error) {
        progressContainer.classList.add('hidden');
        alert('Error decoding audio: ' + error.message);
    } finally {
        decodeBtn.disabled = false;
    }
});

// Helper functions
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

function showEncodeResult(wavBlob, duration) {
    const resultContainer = document.getElementById('encode-result');
    const resultAudio = document.getElementById('result-audio');
    const downloadBtn = document.getElementById('download-audio-btn');
    
    const url = URL.createObjectURL(wavBlob);
    resultAudio.src = url;
    
    document.getElementById('audio-duration').textContent = formatDuration(duration);
    document.getElementById('audio-size').textContent = formatBytes(wavBlob.size);
    
    downloadBtn.onclick = () => {
        const a = document.createElement('a');
        a.href = url;
        const baseName = selectedFiles.length === 1 ? 
            selectedFiles[0].name.replace(/\.[^.]+$/, '') : 
            'files';
        a.download = baseName + '.wav';
        a.click();
    };
    
    resultContainer.classList.remove('hidden');
    resetEncodeTab();
}

function resetEncodeTab() {
    selectedFiles = [];
    document.getElementById('image-preview').classList.add('hidden');
    encodeBtn.disabled = true;
    document.getElementById('encryption-options').classList.add('hidden');
    document.getElementById('enable-encryption').checked = false;
    encryptionEnabled = false;
    document.getElementById('encode-password').value = '';
    document.getElementById('encode-password-confirm').value = '';
    document.getElementById('password-fields').classList.add('hidden');
    imageInput.value = '';
}

function showDecodeResult(files) {
    const resultContainer = document.getElementById('decode-result');
    const filesList = document.getElementById('decoded-files-list');
    const downloadAllBtn = document.getElementById('download-all-btn');
    
    filesList.innerHTML = '';
    
    let totalSize = 0;
    
    files.forEach((file, index) => {
        totalSize += file.data.length;
        
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const icon = document.createElement('div');
        icon.className = 'file-item-icon';
        icon.textContent = getFileIcon(file.name);
        
        const info = document.createElement('div');
        info.className = 'file-item-info';
        
        const name = document.createElement('div');
        name.className = 'file-item-name';
        name.textContent = file.name;
        
        const size = document.createElement('div');
        size.className = 'file-item-size';
        size.textContent = formatBytes(file.data.length);
        
        info.appendChild(name);
        info.appendChild(size);
        
        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'file-item-download';
        downloadBtn.textContent = 'Download';
        downloadBtn.onclick = () => downloadFile(file.data, file.name);
        
        fileItem.appendChild(icon);
        fileItem.appendChild(info);
        fileItem.appendChild(downloadBtn);
        
        filesList.appendChild(fileItem);
    });
    
    document.getElementById('decoded-file-info').textContent = 
        `${files.length} file(s) • Total size: ${formatBytes(totalSize)}`;
    
    if (files.length > 1) {
        downloadAllBtn.classList.remove('hidden');
        downloadAllBtn.onclick = () => downloadAllFiles(files);
    } else {
        downloadAllBtn.classList.add('hidden');
    }
    
    resultContainer.classList.remove('hidden');
    resetDecodeTab();
}

function resetDecodeTab() {
    selectedAudio = null;
    document.getElementById('audio-preview').classList.add('hidden');
    decodeBtn.disabled = true;
    document.getElementById('decryption-options').classList.add('hidden');
    document.getElementById('decode-password').value = '';
    audioInput.value = '';
}

function downloadFile(data, filename) {
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadAllFiles(files) {
    files.forEach(file => {
        setTimeout(() => downloadFile(file.data, file.name), 100);
    });
}

function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    
    const icons = {
        'pdf': '📄',
        'doc': '📝', 'docx': '📝', 'txt': '📝', 'rtf': '📝',
        'xls': '📊', 'xlsx': '📊', 'csv': '📊',
        'ppt': '📊', 'pptx': '📊',
        'zip': '🗜️', 'rar': '🗜️', '7z': '🗜️', 'tar': '🗜️', 'gz': '🗜️',
        'js': '💻', 'py': '💻', 'java': '💻', 'cpp': '💻', 'c': '💻',
        'html': '💻', 'css': '💻', 'php': '💻', 'rb': '💻',
        'mp3': '🎵', 'wav': '🎵', 'flac': '🎵',
        'mp4': '🎬', 'avi': '🎬', 'mkv': '🎬',
        'jpg': '🖼️', 'jpeg': '🖼️', 'png': '🖼️', 'gif': '🖼️', 'webp': '🖼️',
        'exe': '⚙️', 'apk': '📱', 'dmg': '💿',
    };
    
    return icons[ext] || '📄';
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
