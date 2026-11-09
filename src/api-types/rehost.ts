// GENERATED from the make.fun API's rehost.ts: do not edit, every release regenerates it.
export interface RehostTermsClause {
  id: string;
  title: string;
  text: string;
}

export interface RehostTerms {
  version: string;
  status: 'draft' | 'final';
  counsel_reviewed: boolean;
  title: string;
  summary: string;
  notice: string | null;
  clauses: RehostTermsClause[];
}

export interface RehostTermsResponse {
  terms: RehostTerms;
  sha256: string;
}

export interface RehostRoutes {
  'GET /api/rehost/terms': { response: RehostTermsResponse };
}
