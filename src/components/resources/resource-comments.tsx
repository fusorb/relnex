"use client";

import { useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Icon, Skeleton, Textarea } from "@fusorb/facet-components";
import {
  useCommentReplies,
  useCreateReply,
  useCreateRootComment,
  useResourceComments,
  useUpdateCommentStatus,
  type CommentItem,
} from "@/hooks/use-comments";

function formatDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusVariant(status?: string): "default" | "secondary" | "outline" | "destructive" {
  if (status === "HIDDEN" || status === "SPAM") return "destructive";
  if (status === "ARCHIVED" || status === "DELETED") return "outline";
  return "secondary";
}

function CommentRow({
  resourceId,
  comment,
  isOwner,
  viewerId,
  parentId,
}: {
  resourceId: string;
  comment: CommentItem;
  isOwner: boolean;
  viewerId: string | null;
  parentId?: string | null;
}) {
  const [showReply, setShowReply] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const createReply = useCreateReply(resourceId, comment.id);
  const updateStatus = useUpdateCommentStatus(resourceId);
  const replies = useCommentReplies(comment.id, showReplies);

  const canModerate = isOwner || (viewerId && comment.authorId === viewerId);

  return (
    <li className="rounded-xl border border-border bg-card/50 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {comment.author?.displayName ?? comment.author?.username ?? "User"}
            </span>
            {comment.createdAt && <span>{formatDate(comment.createdAt)}</span>}
            {comment.status && comment.status !== "ACTIVE" && (
              <Badge variant={statusVariant(comment.status)}>{comment.status}</Badge>
            )}
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{comment.content}</p>
        </div>
        <div className="flex items-center gap-2">
          {viewerId && (
            <Button size="sm" variant="ghost" onClick={() => setShowReply((v) => !v)}>
              Reply
            </Button>
          )}
          {canModerate && (
            <select
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              value={comment.status ?? "ACTIVE"}
              onChange={(e) =>
                updateStatus.mutate({
                  commentId: comment.id,
                  status: e.target.value,
                  parentId: parentId ?? comment.parentId ?? null,
                })
              }
              aria-label="Moderate comment"
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="HIDDEN">HIDDEN</option>
              <option value="SPAM">SPAM</option>
              <option value="ARCHIVED">ARCHIVED</option>
              <option value="DELETED">DELETED</option>
            </select>
          )}
        </div>
      </div>

      {showReply && viewerId && (
        <div className="mt-3 space-y-2 border-l-2 border-border pl-3">
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            rows={2}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={createReply.isPending || !replyText.trim()}
              onClick={async () => {
                const content = replyText.trim();
                if (!content) return;
                await createReply.mutateAsync(content);
                setReplyText("");
                setShowReply(false);
                setShowReplies(true);
              }}
            >
              {createReply.isPending ? "Replying..." : "Reply"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowReply(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="mt-2">
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-foreground"
          onClick={() => setShowReplies((v) => !v)}
        >
          {showReplies ? "Hide replies" : "Show replies"}
        </button>
      </div>

      {showReplies && (
        <div className="mt-2 border-l-2 border-border pl-3">
          {replies.isLoading ? (
            <Skeleton className="h-12 w-full rounded-lg" />
          ) : replies.data?.items?.length ? (
            <ul className="space-y-2">
              {replies.data.items.map((reply) => (
                <li key={reply.id} className="rounded-lg border border-border/70 p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {reply.author?.displayName ?? reply.author?.username ?? "User"}
                      </span>
                      {reply.createdAt && <span>{formatDate(reply.createdAt)}</span>}
                      {reply.status && reply.status !== "ACTIVE" && (
                        <Badge variant={statusVariant(reply.status)}>{reply.status}</Badge>
                      )}
                    </div>
                    {canModerate || (viewerId && reply.authorId === viewerId) ? (
                      <select
                        className="h-7 rounded-md border border-border bg-background px-2 text-[11px]"
                        value={reply.status ?? "ACTIVE"}
                        onChange={(e) =>
                          updateStatus.mutate({
                            commentId: reply.id,
                            status: e.target.value,
                            parentId: comment.id,
                          })
                        }
                        aria-label="Moderate reply"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="HIDDEN">HIDDEN</option>
                        <option value="SPAM">SPAM</option>
                        <option value="ARCHIVED">ARCHIVED</option>
                        <option value="DELETED">DELETED</option>
                      </select>
                    ) : null}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{reply.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No replies yet.</p>
          )}
        </div>
      )}
    </li>
  );
}

export function ResourceComments({
  resourceId,
  viewerId,
  isOwner,
}: {
  resourceId: string;
  viewerId: string | null;
  isOwner: boolean;
}) {
  const { data, isLoading } = useResourceComments(resourceId);
  const createComment = useCreateRootComment(resourceId);
  const [newComment, setNewComment] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="message-square" className="size-4" aria-hidden />
          Discussion {typeof data?.total === "number" ? `(${data.total})` : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewerId ? (
          <div className="space-y-2">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
            />
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={createComment.isPending || !newComment.trim()}
                onClick={async () => {
                  const content = newComment.trim();
                  if (!content) return;
                  await createComment.mutateAsync(content);
                  setNewComment("");
                }}
              >
                {createComment.isPending ? "Posting..." : "Comment"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Sign in and complete onboarding to comment.</p>
        )}

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
        ) : data?.items?.length ? (
          <ul className="space-y-3">
            {data.items.map((comment) => (
              <CommentRow
                key={comment.id}
                resourceId={resourceId}
                comment={comment}
                isOwner={isOwner}
                viewerId={viewerId}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No comments yet. Start the discussion.</p>
        )}
      </CardContent>
    </Card>
  );
}
