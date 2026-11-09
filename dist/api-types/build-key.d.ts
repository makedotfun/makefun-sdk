export type BuildKeyDisableReason = 'closed' | 'cap' | 'rotated' | 'merged' | 'takedown';
export type BuildKeyRefusalCode = 'build_keys_off' | 'unmetered' | 'entries_closed' | 'no_account' | 'house_account' | 'merged_account' | 'already_issued' | 'no_active_key' | 'fully_reserved';
export interface BuildKeyRefusalData {
    code: BuildKeyRefusalCode;
}
export interface BuildKeySuggestedHeaders {
    'x-masq-policy': 'off';
}
export interface BuildKeyBody {
    rotate?: boolean;
}
export interface BuildKeyIssued {
    competition: string;
    key: string;
    rotated: boolean;
    prefix: string;
    expires_at: string;
    cap_usd: string;
    cap_micro_usd: string;
    models: string[];
    openai_base_url: string;
    anthropic_base_url: string;
    suggested_headers: BuildKeySuggestedHeaders;
}
export interface BuildKeyStateResponse {
    competition: string;
    issuing: boolean;
    active: boolean;
    prefix: string | null;
    expires_at: string | null;
    disabled_at: string | null;
    disable_reason: BuildKeyDisableReason | null;
    cap_usd: string;
    cap_micro_usd: string;
    spent_micro_usd: string;
    left_micro_usd: string;
    models: string[];
    openai_base_url: string | null;
    anthropic_base_url: string | null;
    suggested_headers: BuildKeySuggestedHeaders;
}
export interface BuildKeyRoutes {
    'GET /api/competitions/:slug/build-key': {
        params: {
            slug: string;
        };
        response: BuildKeyStateResponse;
    };
    'POST /api/competitions/:slug/build-key': {
        params: {
            slug: string;
        };
        body: BuildKeyBody;
        response: BuildKeyIssued;
    };
}
//# sourceMappingURL=build-key.d.ts.map