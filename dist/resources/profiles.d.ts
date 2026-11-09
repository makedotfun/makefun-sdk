import type { ResponseOf } from '../api-types/public.js';
import type { CallOptions, MakefunClient } from '../client.js';
export interface ProfilesResource {
    get(handle: string, options?: CallOptions): Promise<ResponseOf<'GET /api/profiles/:handle'>>;
}
export declare function profilesResource(client: MakefunClient): ProfilesResource;
//# sourceMappingURL=profiles.d.ts.map