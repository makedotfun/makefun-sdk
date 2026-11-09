// client.profiles: an account's public profile.
//
//   get   GET /api/profiles/:handle   the profile as anyone sees it (an old handle still answers for 90 days after a change)

import type { ResponseOf } from '../api-types/public.ts';
import type { CallOptions, MakefunClient } from '../client.ts';

export interface ProfilesResource {
  get(handle: string, options?: CallOptions): Promise<ResponseOf<'GET /api/profiles/:handle'>>;
}

export function profilesResource(client: MakefunClient): ProfilesResource {
  return {
    get: (handle, options) => client.request('GET /api/profiles/:handle', { ...options, params: { handle } }),
  };
}
