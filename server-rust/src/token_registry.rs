use serde::{Deserialize, Serialize};
use tracing::info;

use crate::error::TradeError;
use crate::types::{TokenCategory, TokenRecord};

/// In-memory token registry with filtering support.
#[derive(Debug, Clone)]
pub struct TokenRegistry {
    tokens: Vec<TokenRecord>,
}

impl TokenRegistry {
    /// Load the embedded (compiled-in) token list.
    pub fn embedded() -> Self {
        let tokens = embedded_token_list();
        info!(count = tokens.len(), "loaded embedded token registry");
        Self { tokens }
    }

    /// All tokens in the registry.
    pub fn all(&self) -> &[TokenRecord] {
        &self.tokens
    }

    /// Filter tokens by category.
    pub fn by_category(&self, category: TokenCategory) -> Vec<&TokenRecord> {
        self.tokens
            .iter()
            .filter(|t| t.categories.contains(&category))
            .collect()
    }

    /// Look up a token by mint address.
    pub fn by_mint(&self, mint: &str) -> Option<&TokenRecord> {
        self.tokens.iter().find(|t| t.mint == mint)
    }

    /// Look up a token by symbol (case-insensitive).
    pub fn by_symbol(&self, symbol: &str) -> Option<&TokenRecord> {
        let upper = symbol.to_uppercase();
        self.tokens.iter().find(|t| t.symbol.to_uppercase() == upper)
    }

    pub fn len(&self) -> usize {
        self.tokens.len()
    }

    pub fn is_empty(&self) -> bool {
        self.tokens.is_empty()
    }

    /// Add a new token to the registry.
    pub fn add(&mut self, token: TokenRecord) {
        self.tokens.push(token);
    }

    /// Update token metadata by mint address.
    pub fn update(
        &mut self,
        mint: &str,
        patch: crate::admin::TokenPatch,
    ) -> Result<TokenRecord, TradeError> {
        let token = self
            .tokens
            .iter_mut()
            .find(|t| t.mint == mint)
            .ok_or_else(|| TradeError::TokenNotFound(mint.to_string()))?;

        if let Some(name) = patch.name {
            token.name = name;
        }
        if let Some(symbol) = patch.symbol {
            token.symbol = symbol;
        }
        if let Some(logo) = patch.logo_url {
            token.logo_url = Some(logo);
        }
        if let Some(cg) = patch.coingecko_id {
            token.coingecko_id = Some(cg);
        }
        if let Some(cats) = patch.categories {
            token.categories = cats;
        }

        Ok(token.clone())
    }

    /// Remove a token by mint address.
    pub fn remove(&mut self, mint: &str) -> Result<(), TradeError> {
        let before = self.tokens.len();
        self.tokens.retain(|t| t.mint != mint);
        if self.tokens.len() == before {
            return Err(TradeError::TokenNotFound(mint.to_string()));
        }
        Ok(())
    }
}

/// Query parameters for listing tokens.
#[derive(Debug, Deserialize)]
pub struct TokenListQuery {
    pub category: Option<String>,
}

/// Response for token list endpoint.
#[derive(Debug, Serialize)]
pub struct TokenListResponse {
    pub tokens: Vec<TokenRecord>,
    pub count: usize,
}

impl TokenListResponse {
    pub fn from_registry(
        registry: &TokenRegistry,
        category: Option<&str>,
    ) -> Result<Self, TradeError> {
        let tokens: Vec<TokenRecord> = match category {
            Some(cat) => {
                let parsed = parse_category(cat)?;
                registry.by_category(parsed).into_iter().cloned().collect()
            }
            None => registry.all().to_vec(),
        };
        let count = tokens.len();
        Ok(Self { tokens, count })
    }
}

fn parse_category(s: &str) -> Result<TokenCategory, TradeError> {
    match s {
        "governance" => Ok(TokenCategory::Governance),
        "meme" => Ok(TokenCategory::Meme),
        "liquid-staking" => Ok(TokenCategory::LiquidStaking),
        "stablecoin" => Ok(TokenCategory::Stablecoin),
        _ => Err(TradeError::BadRequest(format!(
            "unknown category: {s}. valid: governance, meme, liquid-staking, stablecoin"
        ))),
    }
}

fn embedded_token_list() -> Vec<TokenRecord> {
    vec![
        TokenRecord {
            mint: "So11111111111111111111111111111111111111112".into(),
            symbol: "SOL".into(),
            name: "Solana".into(),
            decimals: 9,
            logo_url: Some("https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png".into()),
            coingecko_id: Some("solana".into()),
            tradingview_symbol: Some("SOLUSD".into()),
            categories: vec![TokenCategory::Governance],
        },
        TokenRecord {
            mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v".into(),
            symbol: "USDC".into(),
            name: "USD Coin".into(),
            decimals: 6,
            logo_url: Some("https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png".into()),
            coingecko_id: Some("usd-coin".into()),
            tradingview_symbol: Some("USDCUSD".into()),
            categories: vec![TokenCategory::Stablecoin],
        },
        TokenRecord {
            mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB".into(),
            symbol: "USDT".into(),
            name: "Tether USD".into(),
            decimals: 6,
            logo_url: Some("https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.svg".into()),
            coingecko_id: Some("tether".into()),
            tradingview_symbol: Some("USDTUSD".into()),
            categories: vec![TokenCategory::Stablecoin],
        },
        TokenRecord {
            mint: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN".into(),
            symbol: "JUP".into(),
            name: "Jupiter".into(),
            decimals: 6,
            logo_url: Some("https://static.jup.ag/jup/icon.png".into()),
            coingecko_id: Some("jupiter-exchange-solana".into()),
            tradingview_symbol: Some("JUPUSD".into()),
            categories: vec![TokenCategory::Governance],
        },
        TokenRecord {
            mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263".into(),
            symbol: "BONK".into(),
            name: "Bonk".into(),
            decimals: 5,
            logo_url: Some("https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I".into()),
            coingecko_id: Some("bonk".into()),
            tradingview_symbol: Some("BONKUSD".into()),
            categories: vec![TokenCategory::Meme],
        },
        TokenRecord {
            mint: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm".into(),
            symbol: "WIF".into(),
            name: "dogwifhat".into(),
            decimals: 6,
            logo_url: Some("https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betibd7cibd32duber3pm.ipfs.nftstorage.link".into()),
            coingecko_id: Some("dogwifcoin".into()),
            tradingview_symbol: Some("WIFUSD".into()),
            categories: vec![TokenCategory::Meme],
        },
        TokenRecord {
            mint: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn".into(),
            symbol: "jitoSOL".into(),
            name: "Jito Staked SOL".into(),
            decimals: 9,
            logo_url: Some("https://storage.googleapis.com/token-metadata/JitoSOL-256.png".into()),
            coingecko_id: Some("jito-staked-sol".into()),
            tradingview_symbol: Some("JITOSOLUSDT".into()),
            categories: vec![TokenCategory::LiquidStaking],
        },
        TokenRecord {
            mint: "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So".into(),
            symbol: "mSOL".into(),
            name: "Marinade Staked SOL".into(),
            decimals: 9,
            logo_url: Some("https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So/logo.png".into()),
            coingecko_id: Some("msol".into()),
            tradingview_symbol: Some("MSOLUSDT".into()),
            categories: vec![TokenCategory::LiquidStaking],
        },
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_embedded_registry_loads() {
        let registry = TokenRegistry::embedded();
        assert!(!registry.is_empty());
        assert_eq!(registry.len(), 8);
    }

    #[test]
    fn test_filter_by_category() {
        let registry = TokenRegistry::embedded();
        let stables = registry.by_category(TokenCategory::Stablecoin);
        assert_eq!(stables.len(), 2);
        assert!(stables
            .iter()
            .all(|t| t.categories.contains(&TokenCategory::Stablecoin)));
    }

    #[test]
    fn test_lookup_by_mint() {
        let registry = TokenRegistry::embedded();
        let sol = registry.by_mint("So11111111111111111111111111111111111111112");
        assert!(sol.is_some());
        assert_eq!(sol.unwrap().symbol, "SOL");
    }

    #[test]
    fn test_lookup_by_symbol() {
        let registry = TokenRegistry::embedded();
        assert!(registry.by_symbol("USDC").is_some());
        assert!(registry.by_symbol("usdc").is_some());
        assert!(registry.by_symbol("NONEXISTENT").is_none());
    }

    #[test]
    fn test_lookup_by_mint_not_found() {
        let registry = TokenRegistry::embedded();
        assert!(registry.by_mint("nonexistent").is_none());
    }

    #[test]
    fn test_parse_category() {
        assert!(parse_category("governance").is_ok());
        assert!(parse_category("meme").is_ok());
        assert!(parse_category("liquid-staking").is_ok());
        assert!(parse_category("stablecoin").is_ok());
        assert!(parse_category("invalid").is_err());
    }
}
