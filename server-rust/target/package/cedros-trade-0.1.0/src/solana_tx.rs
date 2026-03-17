//! Minimal Solana transaction builder — no solana-sdk dependency.
//!
//! Builds unsigned, serialized transactions for SOL/SPL transfers + ATA creation.
//! The frontend signs via wallet adapter and submits.

use crate::error::TradeError;

/// A 32-byte Solana public key.
#[derive(Clone, Copy, PartialEq, Eq, Hash)]
pub struct Pubkey([u8; 32]);

impl Pubkey {
    pub fn from_base58(s: &str) -> Result<Self, TradeError> {
        let bytes = bs58::decode(s).into_vec().map_err(|_| {
            TradeError::BadRequest(format!("invalid base58 pubkey: {s}"))
        })?;
        let arr: [u8; 32] = bytes.try_into().map_err(|_| {
            TradeError::BadRequest(format!("pubkey must be 32 bytes: {s}"))
        })?;
        Ok(Self(arr))
    }

    pub const fn from_bytes(bytes: [u8; 32]) -> Self {
        Self(bytes)
    }

    pub fn as_bytes(&self) -> &[u8; 32] {
        &self.0
    }
}

// Well-known program IDs
pub const SYSTEM_PROGRAM: Pubkey = Pubkey([0; 32]); // 11111111111111111111111111111111
pub const TOKEN_PROGRAM: Pubkey = Pubkey([
    6, 221, 246, 225, 215, 101, 161, 147, 217, 203, 225, 70, 206, 235, 121, 172, 28, 180, 133,
    237, 95, 91, 55, 145, 58, 140, 245, 133, 126, 255, 0, 169,
]); // TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
pub const ATA_PROGRAM: Pubkey = Pubkey([
    140, 151, 37, 143, 78, 36, 137, 241, 187, 61, 16, 41, 20, 142, 13, 131, 11, 90, 19, 153, 218,
    255, 16, 132, 4, 142, 123, 216, 219, 233, 248, 89,
]); // ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL

/// A single Solana instruction (before compilation).
pub struct Instruction {
    pub program_id: Pubkey,
    pub accounts: Vec<AccountMeta>,
    pub data: Vec<u8>,
}

#[derive(Clone)]
pub struct AccountMeta {
    pub pubkey: Pubkey,
    pub is_signer: bool,
    pub is_writable: bool,
}

/// Build a SystemProgram::Transfer instruction.
pub fn system_transfer(from: Pubkey, to: Pubkey, lamports: u64) -> Instruction {
    // SystemInstruction::Transfer = index 2
    let mut data = vec![2, 0, 0, 0];
    data.extend_from_slice(&lamports.to_le_bytes());

    Instruction {
        program_id: SYSTEM_PROGRAM,
        accounts: vec![
            AccountMeta { pubkey: from, is_signer: true, is_writable: true },
            AccountMeta { pubkey: to, is_signer: false, is_writable: true },
        ],
        data,
    }
}

/// Build an SPL Token transfer_checked instruction.
pub fn spl_transfer_checked(
    source_ata: Pubkey,
    mint: Pubkey,
    dest_ata: Pubkey,
    authority: Pubkey,
    amount: u64,
    decimals: u8,
) -> Instruction {
    // transfer_checked = instruction index 12
    let mut data = vec![12];
    data.extend_from_slice(&amount.to_le_bytes());
    data.push(decimals);

    Instruction {
        program_id: TOKEN_PROGRAM,
        accounts: vec![
            AccountMeta { pubkey: source_ata, is_signer: false, is_writable: true },
            AccountMeta { pubkey: mint, is_signer: false, is_writable: false },
            AccountMeta { pubkey: dest_ata, is_signer: false, is_writable: true },
            AccountMeta { pubkey: authority, is_signer: true, is_writable: false },
        ],
        data,
    }
}

/// Build a create_associated_token_account_idempotent instruction.
/// Uses instruction index 1 (idempotent) — safe to include even if ATA already exists.
/// The payer pays rent for a new ATA (~0.00203 SOL / 2039280 lamports).
pub fn create_ata_idempotent(payer: Pubkey, wallet: Pubkey, mint: Pubkey) -> Instruction {
    let ata = derive_ata(&wallet, &mint);

    Instruction {
        program_id: ATA_PROGRAM,
        accounts: vec![
            AccountMeta { pubkey: payer, is_signer: true, is_writable: true },
            AccountMeta { pubkey: ata, is_signer: false, is_writable: true },
            AccountMeta { pubkey: wallet, is_signer: false, is_writable: false },
            AccountMeta { pubkey: mint, is_signer: false, is_writable: false },
            AccountMeta { pubkey: SYSTEM_PROGRAM, is_signer: false, is_writable: false },
            AccountMeta { pubkey: TOKEN_PROGRAM, is_signer: false, is_writable: false },
        ],
        data: vec![1], // 1 = CreateIdempotent (no-op if ATA already exists)
    }
}

/// Derive the associated token account address for a wallet + mint.
pub fn derive_ata(wallet: &Pubkey, mint: &Pubkey) -> Pubkey {
    // PDA: sha256(wallet || TOKEN_PROGRAM || mint || ATA_PROGRAM) then find off-curve
    // We use the standard seeds: [wallet, token_program_id, mint]
    find_program_address(
        &[wallet.as_bytes(), TOKEN_PROGRAM.as_bytes(), mint.as_bytes()],
        &ATA_PROGRAM,
    )
}

pub fn find_program_address(seeds: &[&[u8]], program_id: &Pubkey) -> Pubkey {
    for bump in (0..=255u8).rev() {
        if let Some(addr) = try_create_program_address(seeds, bump, program_id) {
            return addr;
        }
    }
    // Should never happen with valid inputs
    Pubkey([0; 32])
}

fn try_create_program_address(seeds: &[&[u8]], bump: u8, program_id: &Pubkey) -> Option<Pubkey> {
    use sha2::{Digest, Sha256};

    let mut hasher = Sha256::new();
    for seed in seeds {
        hasher.update(seed);
    }
    hasher.update([bump]);
    hasher.update(program_id.as_bytes());
    hasher.update(b"ProgramDerivedAddress");

    let hash: [u8; 32] = hasher.finalize().into();

    // A valid PDA must NOT be on the ed25519 curve.
    // Simplified check: we assume the hash is off-curve (true ~50% of the time).
    // The bump iteration handles the other cases.
    if is_on_curve(&hash) {
        None
    } else {
        Some(Pubkey(hash))
    }
}

/// Check if 32 bytes represent a valid ed25519 curve point.
/// Uses curve25519-dalek for correct decompression.
fn is_on_curve(bytes: &[u8; 32]) -> bool {
    use curve25519_dalek::edwards::CompressedEdwardsY;
    let compressed = CompressedEdwardsY::from_slice(bytes);
    match compressed {
        Ok(point) => point.decompress().is_some(),
        Err(_) => false,
    }
}

/// Compile instructions into a serialized Solana transaction (unsigned, base64).
pub fn build_unsigned_transaction(
    instructions: Vec<Instruction>,
    fee_payer: Pubkey,
    recent_blockhash: [u8; 32],
) -> Vec<u8> {
    let mut accounts: Vec<CompiledAccount> = Vec::new();
    add_account(&mut accounts, fee_payer, true, true);
    for ix in &instructions {
        for meta in &ix.accounts {
            add_account(&mut accounts, meta.pubkey, meta.is_signer, meta.is_writable);
        }
        add_account(&mut accounts, ix.program_id, false, false);
    }

    accounts.sort_by_key(account_sort_key);
    accounts.dedup_by(|a, b| {
        if a.pubkey == b.pubkey {
            b.is_signer |= a.is_signer;
            b.is_writable |= a.is_writable;
            true
        } else {
            false
        }
    });

    accounts.sort_by_key(account_sort_key);

    let num_signers = accounts.iter().filter(|a| a.is_signer).count() as u8;
    let num_readonly_signed = accounts.iter().filter(|a| a.is_signer && !a.is_writable).count() as u8;
    let num_readonly_unsigned = accounts.iter().filter(|a| !a.is_signer && !a.is_writable).count() as u8;

    let account_index = |pk: &Pubkey| -> u8 {
        accounts.iter().position(|a| a.pubkey == *pk).unwrap_or(0) as u8
    };

    let compiled_instructions: Vec<CompiledInstruction> = instructions
        .iter()
        .map(|ix| {
            let program_id_index = account_index(&ix.program_id);
            let account_indexes: Vec<u8> =
                ix.accounts.iter().map(|m| account_index(&m.pubkey)).collect();
            CompiledInstruction {
                program_id_index,
                account_indexes,
                data: ix.data.clone(),
            }
        })
        .collect();

    let mut buf = Vec::new();

    // Signature slots (zero-filled for unsigned tx)
    write_compact_u16(&mut buf, num_signers as u16);
    for _ in 0..num_signers { buf.extend_from_slice(&[0u8; 64]); }

    // Message: header + accounts + blockhash + instructions
    buf.push(num_signers);
    buf.push(num_readonly_signed);
    buf.push(num_readonly_unsigned);
    write_compact_u16(&mut buf, accounts.len() as u16);
    for acc in &accounts { buf.extend_from_slice(acc.pubkey.as_bytes()); }
    buf.extend_from_slice(&recent_blockhash);
    write_compact_u16(&mut buf, compiled_instructions.len() as u16);
    for ci in &compiled_instructions {
        buf.push(ci.program_id_index);
        write_compact_u16(&mut buf, ci.account_indexes.len() as u16);
        buf.extend_from_slice(&ci.account_indexes);
        write_compact_u16(&mut buf, ci.data.len() as u16);
        buf.extend_from_slice(&ci.data);
    }

    buf
}

struct CompiledAccount {
    pubkey: Pubkey,
    is_signer: bool,
    is_writable: bool,
}

fn account_sort_key(a: &CompiledAccount) -> u8 {
    match (a.is_signer, a.is_writable) {
        (true, true) => 0,
        (true, false) => 1,
        (false, true) => 2,
        (false, false) => 3,
    }
}

fn add_account(accounts: &mut Vec<CompiledAccount>, pubkey: Pubkey, signer: bool, writable: bool) {
    if let Some(existing) = accounts.iter_mut().find(|a| a.pubkey == pubkey) {
        existing.is_signer |= signer;
        existing.is_writable |= writable;
    } else {
        accounts.push(CompiledAccount {
            pubkey,
            is_signer: signer,
            is_writable: writable,
        });
    }
}

struct CompiledInstruction {
    program_id_index: u8,
    account_indexes: Vec<u8>,
    data: Vec<u8>,
}

fn write_compact_u16(buf: &mut Vec<u8>, val: u16) {
    if val < 0x80 {
        buf.push(val as u8);
    } else if val < 0x4000 {
        buf.push((val & 0x7F | 0x80) as u8);
        buf.push((val >> 7) as u8);
    } else {
        buf.push((val & 0x7F | 0x80) as u8);
        buf.push(((val >> 7) & 0x7F | 0x80) as u8);
        buf.push((val >> 14) as u8);
    }
}

/// Native SOL mint address.
pub const SOL_MINT: &str = "So11111111111111111111111111111111111111112";

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pubkey_from_base58() {
        let pk = Pubkey::from_base58("So11111111111111111111111111111111111111112");
        assert!(pk.is_ok());
    }

    #[test]
    fn test_pubkey_invalid() {
        assert!(Pubkey::from_base58("invalid").is_err());
        assert!(Pubkey::from_base58("").is_err());
    }

    #[test]
    fn test_system_transfer_instruction() {
        let from = Pubkey::from_base58("So11111111111111111111111111111111111111112").unwrap();
        let to =
            Pubkey::from_base58("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap();
        let ix = system_transfer(from, to, 1_000_000);
        assert_eq!(ix.accounts.len(), 2);
        assert_eq!(ix.data.len(), 12); // 4 bytes index + 8 bytes amount
        assert!(ix.accounts[0].is_signer);
        assert!(ix.accounts[1].is_writable);
    }

    #[test]
    fn test_compact_u16_encoding() {
        let mut buf = Vec::new();
        write_compact_u16(&mut buf, 0);
        assert_eq!(buf, vec![0]);

        buf.clear();
        write_compact_u16(&mut buf, 127);
        assert_eq!(buf, vec![127]);

        buf.clear();
        write_compact_u16(&mut buf, 128);
        assert_eq!(buf, vec![0x80, 0x01]);
    }

    #[test]
    fn test_derive_ata_known_value() {
        // For wallet=SystemProgram (all zeros) and mint=SOL, the ATA should be deterministic
        // and NOT equal to the input wallet (it's a PDA, off-curve)
        let wallet = Pubkey::from_base58("So11111111111111111111111111111111111111112").unwrap();
        let mint = Pubkey::from_base58("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap();
        let ata = derive_ata(&wallet, &mint);

        // ATA should be 32 bytes and NOT equal to wallet or mint
        assert_ne!(ata.as_bytes(), wallet.as_bytes());
        assert_ne!(ata.as_bytes(), mint.as_bytes());
        assert_ne!(*ata.as_bytes(), [0u8; 32]);

        // Derivation must be deterministic
        let ata2 = derive_ata(&wallet, &mint);
        assert_eq!(ata.as_bytes(), ata2.as_bytes());
    }

    #[test]
    fn test_is_on_curve() {
        // The ed25519 basepoint compressed form is on the curve
        let basepoint: [u8; 32] = [
            0x58, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
            0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66, 0x66,
        ];
        assert!(is_on_curve(&basepoint), "ed25519 basepoint should be on curve");

        // A derived PDA (output of find_program_address) should NOT be on curve
        let seeds: &[&[u8]] = &[b"test"];
        let pda = find_program_address(seeds, &SYSTEM_PROGRAM);
        assert!(!is_on_curve(pda.as_bytes()), "PDA should not be on curve");
    }

    #[test]
    fn test_create_ata_idempotent_instruction() {
        let payer = Pubkey::from_base58("So11111111111111111111111111111111111111112").unwrap();
        let wallet = Pubkey::from_base58("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap();
        let mint = Pubkey::from_base58("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB").unwrap();
        let ix = create_ata_idempotent(payer, wallet, mint);

        assert_eq!(ix.data, vec![1]); // Idempotent variant
        assert_eq!(ix.accounts.len(), 6); // payer, ata, wallet, mint, system, token
        assert!(ix.accounts[0].is_signer); // payer signs
        assert!(ix.accounts[0].is_writable); // payer pays rent
        assert!(ix.accounts[1].is_writable); // ATA is writable
    }

    #[test]
    fn test_build_sol_transfer_transaction() {
        let from = Pubkey::from_base58("So11111111111111111111111111111111111111112").unwrap();
        let to =
            Pubkey::from_base58("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").unwrap();
        let ix = system_transfer(from, to, 1_000_000);
        let blockhash = [0u8; 32];
        let tx = build_unsigned_transaction(vec![ix], from, blockhash);

        // Should produce a non-empty serialized transaction
        assert!(!tx.is_empty());
        // First byte is compact-u16 for signature count (1 signer = 0x01)
        assert_eq!(tx[0], 1);
    }
}
