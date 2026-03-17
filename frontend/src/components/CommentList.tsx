import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ChatBubbleLeftRightIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/store/authStore';
import { commentApi } from '@/lib/api';
import { Button } from '@/components/Button';
import { TextArea } from '@/components/Input';
import { formatDate } from '@/lib/utils';
import type { Comment as CommentType } from '@/types';

interface CommentListProps {
  artworkId: string;
  onCommentCountChange?: (count: number) => void;
}

export function CommentList({ artworkId, onCommentCountChange }: CommentListProps) {
  const { isAuthenticated } = useAuthStore();
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [artworkId]);

  async function loadComments() {
    try {
      setLoading(true);
      const response = await commentApi.getArtworkComments(artworkId, { limit: 50 });
      setComments(response.data.data || []);
      onCommentCountChange?.(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('加载评论失败:', error);
      toast.error('加载评论失败');
    } finally {
      setLoading(false);
    }
  }

  async function handlePostComment() {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }

    if (!newComment.trim()) {
      toast.error('请输入评论内容');
      return;
    }

    try {
      await commentApi.create({
        content: newComment.trim(),
        artworkId,
      });
      setNewComment('');
      toast.success('评论成功');
      loadComments();
    } catch (error) {
      console.error('发表评论失败:', error);
      toast.error('发表评论失败');
    }
  }

  async function handlePostReply(parentId: string) {
    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }

    if (!replyContent.trim()) {
      toast.error('请输入回复内容');
      return;
    }

    try {
      await commentApi.create({
        content: replyContent.trim(),
        artworkId,
        parentId,
      });
      setReplyContent('');
      setReplyingTo(null);
      toast.success('回复成功');
      loadComments();
    } catch (error) {
      console.error('回复评论失败:', error);
      toast.error('回复评论失败');
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('确定要删除这条评论吗？')) return;

    try {
      await commentApi.delete(commentId);
      toast.success('删除成功');
      loadComments();
    } catch (error) {
      console.error('删除评论失败:', error);
      toast.error('删除评论失败');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 发表评论 */}
      <div className="bg-gray-50 rounded-xl p-4">
        <TextArea
          placeholder="写下你的评论..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          disabled={!isAuthenticated}
        />
        <div className="flex justify-between items-center mt-2">
          <p className="text-sm text-gray-500">
            {isAuthenticated ? `${newComment.length}/500` : '登录后发表评论'}
          </p>
          <Button
            onClick={handlePostComment}
            disabled={!isAuthenticated || !newComment.trim()}
          >
            发表评论
          </Button>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p>暂无评论，快来抢沙发吧</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handlePostReply}
              onDelete={handleDeleteComment}
              replyingTo={replyingTo}
              replyContent={replyContent}
              setReplyingTo={setReplyingTo}
              setReplyContent={setReplyContent}
            />
          ))
        )}
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: CommentType;
  onReply: (parentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  replyingTo: string | null;
  replyContent: string;
  setReplyingTo: (id: string | null) => void;
  setReplyContent: (content: string) => void;
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  replyingTo,
  replyContent,
  setReplyingTo,
  setReplyContent,
}: CommentItemProps) {
  const { user: currentUser, isAuthenticated } = useAuthStore();
  const isOwnComment = currentUser?.id === comment.userId;

  return (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          {comment.user?.avatar ? (
            <img
              src={comment.user.avatar}
              alt={comment.user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 text-sm font-bold">
                {comment.user?.username[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {comment.user?.username || '匿名用户'}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(comment.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setReplyingTo(isAuthenticated && replyingTo === comment.id ? null : comment.id)}
            className="text-gray-400 hover:text-primary-600 text-sm"
          >
            回复
          </button>
          {isOwnComment && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-gray-400 hover:text-red-600 text-sm"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-3 text-gray-700">{comment.content}</p>

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 ml-4 space-y-3 border-l-2 border-gray-100 pl-4">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                {reply.user?.avatar ? (
                  <img
                    src={reply.user.avatar}
                    alt={reply.user.username}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 text-xs font-bold">
                      {reply.user?.username[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="text-sm font-medium text-gray-900">
                  {reply.user?.username || '匿名用户'}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(reply.createdAt)}
                </span>
                {isAuthenticated && reply.userId !== currentUser?.id && (
                  <button
                    onClick={() => {
                      setReplyingTo(comment.id);
                      setReplyContent(`@${reply.user?.username} `);
                    }}
                    className="text-gray-400 hover:text-primary-600 text-xs ml-2"
                  >
                    回复
                  </button>
                )}
              </div>
              <p className="text-sm text-gray-700">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* 回复输入框 */}
      {replyingTo === comment.id && (
        <div className="mt-4 ml-4 bg-gray-50 rounded-lg p-3">
          <TextArea
            placeholder={`回复 ${comment.user?.username || '用户'}...`}
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            rows={2}
            className="text-sm"
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setReplyingTo(null);
                setReplyContent('');
              }}
            >
              取消
            </Button>
            <Button
              size="sm"
              onClick={() => onReply(comment.id, replyContent)}
              disabled={!replyContent.trim()}
            >
              回复
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
