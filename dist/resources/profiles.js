// client.profiles: an account's public profile.
//
//   get   GET /api/profiles/:handle   the profile as anyone sees it (an old handle still answers for 90 days after a change)
export function profilesResource(client) {
    return {
        get: (handle, options) => client.request('GET /api/profiles/:handle', { ...options, params: { handle } }),
    };
}
//# sourceMappingURL=profiles.js.map