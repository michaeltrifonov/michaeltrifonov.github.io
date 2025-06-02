// Crypto utilities for client-side encryption/decryption
const CryptoUtils = {
    // Derive key from password
    async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );
        
        return crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    },

    // Encrypt content
    async encrypt(content, password) {
        const encoder = new TextEncoder();
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        const key = await this.deriveKey(password, salt);
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            encoder.encode(content)
        );
        
        // Combine salt, iv, and encrypted data
        const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
        combined.set(salt, 0);
        combined.set(iv, salt.length);
        combined.set(new Uint8Array(encrypted), salt.length + iv.length);
        
        // Convert to base64 for storage
        return btoa(String.fromCharCode(...combined));
    },

    // Decrypt content
    async decrypt(encryptedBase64, password) {
        try {
            // Convert from base64
            const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
            
            // Extract components (salt: 16, iv: 12, authTag: 16, rest: encrypted)
            const salt = combined.slice(0, 16);
            const iv = combined.slice(16, 28);
            const authTag = combined.slice(28, 44);
            const encrypted = combined.slice(44);
            
            // Combine encrypted data with auth tag for Web Crypto API
            const ciphertext = new Uint8Array(encrypted.length + authTag.length);
            ciphertext.set(encrypted, 0);
            ciphertext.set(authTag, encrypted.length);
            
            const key = await this.deriveKey(password, salt);
            
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv },
                key,
                ciphertext
            );
            
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Decryption failed:', error);
            return null;
        }
    },

    // Hash password for quick validation (optional)
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
};

// Export for use in other scripts
window.CryptoUtils = CryptoUtils;