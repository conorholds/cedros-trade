use serde::Serialize;

/// Content configuration for generating discovery content.
pub struct ContentConfig {
    pub base_path: String,
    pub name: String,
    pub version: String,
    pub description: String,
}

impl ContentConfig {
    pub fn new(base_path: &str) -> Self {
        Self {
            base_path: base_path.trim_end_matches('/').to_string(),
            name: "cedros-trade".into(),
            version: env!("CARGO_PKG_VERSION").into(),
            description: "Solana trading infrastructure — swap routing, smart orders, transfers, portfolio tracking".into(),
        }
    }

    pub fn path(&self, endpoint: &str) -> String {
        format!("{}{}", self.base_path, endpoint)
    }
}

#[derive(Serialize)]
pub struct AiDiscoveryIndex {
    pub version: String,
    pub name: String,
    pub description: String,
    pub endpoints: DiscoveryEndpoints,
    pub skills: Vec<SkillPointer>,
}

#[derive(Serialize)]
pub struct DiscoveryEndpoints {
    pub llms_txt: String,
    pub llms_full_txt: String,
    pub llms_admin_txt: String,
    pub skill_index_markdown: String,
    pub skill_index_json: String,
    pub agent_guide: String,
    pub openapi: String,
    pub a2a_agent_card: String,
    pub ai_plugin: String,
    pub mcp: String,
    pub health: String,
    pub skills_bundle: String,
}

#[derive(Serialize, Clone)]
pub struct SkillPointer {
    pub id: String,
    pub name: String,
    pub path: String,
    pub description: String,
}

#[derive(Serialize)]
pub struct AiPluginManifest {
    pub schema_version: String,
    pub name_for_human: String,
    pub name_for_model: String,
    pub description_for_human: String,
    pub description_for_model: String,
    pub auth: AiPluginAuth,
    pub api: AiPluginApi,
}

#[derive(Serialize)]
pub struct AiPluginAuth {
    #[serde(rename = "type")]
    pub auth_type: String,
}

#[derive(Serialize)]
pub struct AiPluginApi {
    #[serde(rename = "type")]
    pub api_type: String,
    pub url: String,
}

#[derive(Serialize)]
pub struct AgentCard {
    pub name: String,
    pub version: String,
    pub description: String,
    pub url: String,
    pub skills: Vec<AgentSkill>,
    pub authentication: AgentAuth,
}

#[derive(Serialize)]
pub struct AgentSkill {
    pub id: String,
    pub name: String,
    pub description: String,
    pub tags: Vec<String>,
}

#[derive(Serialize)]
pub struct AgentAuth {
    pub schemes: Vec<String>,
    pub header: String,
}

#[derive(Serialize)]
pub struct McpDiscovery {
    pub name: String,
    pub version: String,
    pub protocol_version: String,
    pub capabilities: McpCapabilities,
    pub tools: Vec<McpTool>,
}

#[derive(Serialize)]
pub struct McpCapabilities {
    pub tools: bool,
    pub resources: bool,
}

#[derive(Serialize)]
pub struct McpTool {
    pub name: String,
    pub description: String,
    pub input_schema: serde_json::Value,
}

#[derive(Serialize)]
pub struct SkillMetadata {
    pub name: String,
    pub version: String,
    pub description: String,
    pub category: String,
    pub api_base: String,
    pub capabilities: serde_json::Value,
    pub skills: Vec<SkillPointer>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HeartbeatResponse {
    pub status: String,
    pub version: String,
    pub name: String,
    pub capabilities: Vec<String>,
    pub endpoints_count: usize,
}
