use ring::aead::{Aad, BoundKey, Nonce, NonceSequence, OpeningKey, SealingKey, UnboundKey, AES_256_GCM};
use ring::error::Unspecified;
use ring::rand::{SecureRandom, SystemRandom};
use data_encoding::BASE64;
use sha2::{Sha256, Digest};

const NONCE_LEN: usize = 12;

struct CounterNonceSequence {
    counter: u32,
}

impl CounterNonceSequence {
    fn new() -> Self {
        Self { counter: 0 }
    }
}

impl NonceSequence for CounterNonceSequence {
    fn advance(&mut self) -> Result<Nonce, Unspecified> {
        let mut nonce_bytes = vec![0u8; NONCE_LEN];
        let counter_bytes = self.counter.to_le_bytes();
        nonce_bytes[..4].copy_from_slice(&counter_bytes);
        self.counter += 1;
        Nonce::try_assume_unique_for_key(&nonce_bytes)
    }
}

pub struct EncryptionService {
    rng: SystemRandom,
}

impl EncryptionService {
    pub fn new() -> Self {
        Self {
            rng: SystemRandom::new(),
        }
    }

    pub fn derive_key(&self, password: &str, salt: &[u8]) -> Vec<u8> {
        use ring::pbkdf2;
        let iterations = 100_000;
        let mut key = vec![0u8; 32];
        pbkdf2::derive(
            pbkdf2::PBKDF2_HMAC_SHA256,
            std::num::NonZeroU32::new(iterations).unwrap(),
            salt,
            password.as_bytes(),
            &mut key,
        );
        key
    }

    pub fn encrypt(&self, data: &[u8], password: &str) -> Result<String, String> {
        // Generate random salt
        let mut salt = vec![0u8; 32];
        self.rng
            .fill(&mut salt)
            .map_err(|_| "Failed to generate salt".to_string())?;

        // Derive key from password
        let key_bytes = self.derive_key(password, &salt);

        // Create unbound key
        let unbound_key = UnboundKey::new(&AES_256_GCM, &key_bytes)
            .map_err(|_| "Failed to create encryption key".to_string())?;

        // Create sealing key
        let nonce_sequence = CounterNonceSequence::new();
        let mut sealing_key = SealingKey::new(unbound_key, nonce_sequence);

        // Prepare data for encryption
        let mut in_out = data.to_vec();
        
        // Encrypt data
        sealing_key
            .seal_in_place_append_tag(Aad::empty(), &mut in_out)
            .map_err(|_| "Failed to encrypt data".to_string())?;

        // Combine salt and encrypted data
        let mut result = salt;
        result.extend_from_slice(&in_out);

        // Encode as base64
        Ok(BASE64.encode(&result))
    }

    pub fn decrypt(&self, encrypted: &str, password: &str) -> Result<Vec<u8>, String> {
        // Decode from base64
        let data = BASE64
            .decode(encrypted.as_bytes())
            .map_err(|_| "Invalid base64 encoding".to_string())?;

        if data.len() < 32 {
            return Err("Invalid encrypted data".to_string());
        }

        // Extract salt and encrypted data
        let (salt, encrypted_data) = data.split_at(32);

        // Derive key from password
        let key_bytes = self.derive_key(password, salt);

        // Create unbound key
        let unbound_key = UnboundKey::new(&AES_256_GCM, &key_bytes)
            .map_err(|_| "Failed to create decryption key".to_string())?;

        // Create opening key
        let nonce_sequence = CounterNonceSequence::new();
        let mut opening_key = OpeningKey::new(unbound_key, nonce_sequence);

        // Prepare data for decryption
        let mut in_out = encrypted_data.to_vec();

        // Decrypt data
        let decrypted = opening_key
            .open_in_place(Aad::empty(), &mut in_out)
            .map_err(|_| "Failed to decrypt data (wrong password?)".to_string())?;

        Ok(decrypted.to_vec())
    }

    pub fn hash(&self, data: &[u8]) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data);
        let result = hasher.finalize();
        BASE64.encode(&result)
    }

    pub fn verify_hash(&self, data: &[u8], hash: &str) -> bool {
        let computed_hash = self.hash(data);
        computed_hash == hash
    }

    pub fn generate_random_bytes(&self, len: usize) -> Result<Vec<u8>, String> {
        let mut bytes = vec![0u8; len];
        self.rng
            .fill(&mut bytes)
            .map_err(|_| "Failed to generate random bytes".to_string())?;
        Ok(bytes)
    }

    pub fn generate_random_string(&self, len: usize) -> Result<String, String> {
        let bytes = self.generate_random_bytes(len)?;
        Ok(BASE64.encode(&bytes))
    }
}

impl Default for EncryptionService {
    fn default() -> Self {
        Self::new()
    }
}
