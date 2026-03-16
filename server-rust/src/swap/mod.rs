pub mod dflow;
pub mod jupiter;
pub mod jupiter_ultra;

use async_trait::async_trait;

use crate::error::TradeError;
use crate::types::{ProviderCapabilities, ProviderHealth, QuoteParams, SwapQuote, SwapTransaction};

/// Trait implemented by each swap provider (Jupiter, Ultra, DFlow).
#[async_trait]
pub trait SwapProvider: Send + Sync {
    fn name(&self) -> &str;
    fn capabilities(&self) -> ProviderCapabilities;
    async fn quote(&self, params: &QuoteParams) -> Result<SwapQuote, TradeError>;
    async fn build(&self, quote: &SwapQuote, user_public_key: &str) -> Result<SwapTransaction, TradeError>;
    async fn health(&self) -> ProviderHealth;
}

// --- Shared validation helpers ---

pub(crate) fn validate_mint(mint: &str) -> Result<(), TradeError> {
    if mint.is_empty() {
        return Err(TradeError::InvalidMint("mint address is empty".into()));
    }
    if mint.len() < 32 || mint.len() > 44 {
        return Err(TradeError::InvalidMint(format!(
            "invalid length for mint: {mint}"
        )));
    }
    bs58::decode(mint).into_vec().map_err(|_| {
        TradeError::InvalidMint(format!("not valid base58: {mint}"))
    })?;
    Ok(())
}

pub(crate) fn validate_amount(amount: &str) -> Result<(), TradeError> {
    if amount.is_empty() {
        return Err(TradeError::InvalidAmount("amount is empty".into()));
    }
    let parsed: u64 = amount.parse().map_err(|_| {
        TradeError::InvalidAmount(format!("not a valid u64: {amount}"))
    })?;
    if parsed == 0 {
        return Err(TradeError::InvalidAmount("amount must be positive".into()));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_mint_valid() {
        assert!(validate_mint("So11111111111111111111111111111111111111112").is_ok());
        assert!(validate_mint("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v").is_ok());
    }

    #[test]
    fn test_validate_mint_invalid() {
        assert!(validate_mint("").is_err());
        assert!(validate_mint("short").is_err());
        assert!(validate_mint("not-base58!@#$%^&*()not-base58!@#$").is_err());
    }

    #[test]
    fn test_validate_amount_valid() {
        assert!(validate_amount("1").is_ok());
        assert!(validate_amount("1000000").is_ok());
    }

    #[test]
    fn test_validate_amount_invalid() {
        assert!(validate_amount("").is_err());
        assert!(validate_amount("0").is_err());
        assert!(validate_amount("-1").is_err());
        assert!(validate_amount("abc").is_err());
    }
}
