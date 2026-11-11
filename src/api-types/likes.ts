// GENERATED from the make.fun API's likes.ts: do not edit, every release regenerates it.
export interface EntryLike {
  submission_id: string;
  like_count: number;
  viewer_liked: boolean;
}

export interface EntryLikeCounts {
  counts: Record<string, number>;
}

export interface EntryLikesMine {
  liked: string[];
}

export interface LikesRoutes {
  'PUT /api/submissions/:id/like': { params: { id: string }; response: EntryLike };
  'DELETE /api/submissions/:id/like': { params: { id: string }; response: EntryLike };
  'GET /api/competitions/:slug/likes': { params: { slug: string }; response: EntryLikeCounts };
  'GET /api/competitions/:slug/likes/mine': { params: { slug: string }; response: EntryLikesMine };
}
