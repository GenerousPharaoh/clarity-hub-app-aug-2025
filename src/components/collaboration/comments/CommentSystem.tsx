import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  IconButton,
  Button,
  TextField,
  Menu,
  MenuItem,
  Chip,
  Stack,
  Divider,
  Paper,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Reply as ReplyIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Highlight as HighlightIcon,
  StickyNote2 as StickyNoteIcon,
  Comment as CommentIcon,
  Lightbulb as SuggestionIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useCollaboration, DocumentComment } from '../../../contexts/CollaborationContext';

interface CommentSystemProps {
  documentId: string;
  containerRef?: React.RefObject<HTMLElement>;
  showResolved?: boolean;
}

interface CommentThreadProps {
  comment: DocumentComment;
  replies: DocumentComment[];
  onReply: (content: string) => void;
  onResolve: () => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  currentUserId?: string;
}

interface CommentFormProps {
  onSubmit: (content: string, type: DocumentComment['comment_type']) => void;
  onCancel: () => void;
  placeholder?: string;
  autoFocus?: boolean;
}

const CommentTypeIcon = ({ type }: { type: DocumentComment['comment_type'] }) => {
  switch (type) {
    case 'highlight':
      return <HighlightIcon fontSize="small" />;
    case 'sticky_note':
      return <StickyNoteIcon fontSize="small" />;
    case 'suggestion':
      return <SuggestionIcon fontSize="small" />;
    default:
      return <CommentIcon fontSize="small" />;
  }
};

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  placeholder = "Add a comment...",
  autoFocus = false,
}) => {
  const [content, setContent] = useState('');
  const [commentType, setCommentType] = useState<DocumentComment['comment_type']>('comment');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content.trim(), commentType);
      setContent('');
      setCommentType('comment');
    }
  };

  const handleTypeSelect = (type: DocumentComment['comment_type']) => {
    setCommentType(type);
    setAnchorEl(null);
  };

  return (
    <Card variant="outlined" sx={{ mb: 2 }}>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              startIcon={<CommentTypeIcon type={commentType} />}
            >
              {commentType}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              <MenuItem onClick={() => handleTypeSelect('comment')}>
                <CommentIcon fontSize="small" sx={{ mr: 1 }} />
                Comment
              </MenuItem>
              <MenuItem onClick={() => handleTypeSelect('highlight')}>
                <HighlightIcon fontSize="small" sx={{ mr: 1 }} />
                Highlight
              </MenuItem>
              <MenuItem onClick={() => handleTypeSelect('sticky_note')}>
                <StickyNoteIcon fontSize="small" sx={{ mr: 1 }} />
                Sticky Note
              </MenuItem>
              <MenuItem onClick={() => handleTypeSelect('suggestion')}>
                <SuggestionIcon fontSize="small" sx={{ mr: 1 }} />
                Suggestion
              </MenuItem>
            </Menu>
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!content.trim()}
            >
              Submit
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

const CommentThread: React.FC<CommentThreadProps> = ({
  comment,
  replies,
  onReply,
  onResolve,
  onEdit,
  onDelete,
  currentUserId,
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getUserName = (comment: DocumentComment) => {
    const firstName = comment.author?.first_name || '';
    const lastName = comment.author?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Anonymous';
  };

  const getUserInitials = (comment: DocumentComment) => {
    const firstName = comment.author?.first_name || '';
    const lastName = comment.author?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'A';
  };

  const handleReplySubmit = (content: string) => {
    onReply(content);
    setShowReplyForm(false);
  };

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== comment.content) {
      onEdit(comment.id, editContent.trim());
    }
    setEditing(false);
    setEditContent(comment.content);
  };

  const isOwner = currentUserId === comment.author_id;

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        mb: 2,
        opacity: comment.resolved ? 0.7 : 1,
        backgroundColor: comment.resolved ? 'action.hover' : 'background.paper',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar
            src={comment.author?.avatar_url}
            sx={{ width: 32, height: 32 }}
          >
            {getUserInitials(comment)}
          </Avatar>
          
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {getUserName(comment)}
              </Typography>
              <Chip
                icon={<CommentTypeIcon type={comment.comment_type} />}
                label={comment.comment_type}
                size="small"
                variant="outlined"
              />
              {comment.resolved && (
                <Chip
                  icon={<CheckIcon />}
                  label="Resolved"
                  size="small"
                  color="success"
                  variant="outlined"
                />
              )}
              <Typography variant="caption" color="text.secondary">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </Typography>
            </Box>
            
            {editing ? (
              <Box sx={{ mb: 2 }}>
                <TextField
                  fullWidth
                  multiline
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    onClick={handleEditSubmit}
                  >
                    Save
                  </Button>
                  <Button
                    size="small"
                    onClick={() => {
                      setEditing(false);
                      setEditContent(comment.content);
                    }}
                  >
                    Cancel
                  </Button>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {comment.content}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!comment.resolved && (
                <Button
                  size="small"
                  startIcon={<ReplyIcon />}
                  onClick={() => setShowReplyForm(true)}
                >
                  Reply
                </Button>
              )}
              
              {!comment.resolved && (
                <Button
                  size="small"
                  startIcon={<CheckIcon />}
                  onClick={onResolve}
                  color="success"
                >
                  Resolve
                </Button>
              )}
              
              {isOwner && (
                <IconButton
                  size="small"
                  onClick={(e) => setAnchorEl(e.currentTarget)}
                >
                  <MoreVertIcon />
                </IconButton>
              )}
              
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                <MenuItem onClick={() => { setEditing(true); setAnchorEl(null); }}>
                  <EditIcon fontSize="small" sx={{ mr: 1 }} />
                  Edit
                </MenuItem>
                <MenuItem 
                  onClick={() => { onDelete(comment.id); setAnchorEl(null); }}
                  sx={{ color: 'error.main' }}
                >
                  <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                  Delete
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Box>
        
        {/* Replies */}
        {replies.length > 0 && (
          <Box sx={{ ml: 5, mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            {replies.map((reply) => (
              <Box key={reply.id} sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Avatar
                  src={reply.author?.avatar_url}
                  sx={{ width: 24, height: 24 }}
                >
                  {getUserInitials(reply)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold">
                      {getUserName(reply)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {reply.content}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
        
        {/* Reply Form */}
        {showReplyForm && (
          <Box sx={{ ml: 5, mt: 2 }}>
            <CommentForm
              onSubmit={handleReplySubmit}
              onCancel={() => setShowReplyForm(false)}
              placeholder="Add a reply..."
              autoFocus
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const CommentSystem: React.FC<CommentSystemProps> = ({
  documentId,
  containerRef,
  showResolved = false,
}) => {
  const { state, addComment, updateComment, deleteComment, resolveComment } = useCollaboration();
  const [showNewCommentForm, setShowNewCommentForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{ x: number; y: number } | null>(null);

  // Get comments for this document
  const documentComments = state.comments.filter(
    comment => 
      comment.document_id === documentId && 
      (showResolved || !comment.resolved) &&
      !comment.parent_id
  );

  // Group replies with their parent comments
  const commentsWithReplies = documentComments.map(comment => ({
    comment,
    replies: state.comments.filter(c => c.parent_id === comment.id),
  }));

  const handleAddComment = useCallback((content: string, type: DocumentComment['comment_type']) => {
    addComment({
      document_id: documentId,
      project_id: state.currentProject!,
      content,
      comment_type: type,
      position: selectedPosition ? {
        page: 1, // Default page
        x: selectedPosition.x,
        y: selectedPosition.y,
      } : undefined,
      metadata: {},
      resolved: false,
    });
    setShowNewCommentForm(false);
    setSelectedPosition(null);
  }, [addComment, documentId, state.currentProject, selectedPosition]);

  const handleReply = useCallback((parentId: string) => (content: string) => {
    addComment({
      document_id: documentId,
      project_id: state.currentProject!,
      parent_id: parentId,
      content,
      comment_type: 'comment',
      metadata: {},
      resolved: false,
    });
  }, [addComment, documentId, state.currentProject]);

  const handleEdit = useCallback((commentId: string, content: string) => {
    updateComment(commentId, { content });
  }, [updateComment]);

  const handleDelete = useCallback((commentId: string) => {
    deleteComment(commentId);
  }, [deleteComment]);

  const handleResolve = useCallback((commentId: string) => {
    resolveComment(commentId);
  }, [resolveComment]);

  // Handle text selection for adding comments
  useEffect(() => {
    if (!containerRef?.current) return;

    const handleSelectionEnd = () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);
      const containerRect = containerRef.current!.getBoundingClientRect();
      const rangeRect = range.getBoundingClientRect();

      setSelectedPosition({
        x: rangeRect.x - containerRect.x,
        y: rangeRect.y - containerRect.y,
      });
    };

    const container = containerRef.current;
    container.addEventListener('mouseup', handleSelectionEnd);

    return () => {
      container.removeEventListener('mouseup', handleSelectionEnd);
    };
  }, [containerRef]);

  const unresolvedCount = documentComments.filter(c => !c.resolved).length;

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            Comments
          </Typography>
          {unresolvedCount > 0 && (
            <Badge badgeContent={unresolvedCount} color="primary">
              <CommentIcon />
            </Badge>
          )}
        </Box>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowNewCommentForm(true)}
          size="small"
        >
          Add Comment
        </Button>
      </Box>

      {selectedPosition && (
        <Paper 
          sx={{ 
            p: 2, 
            mb: 2, 
            border: '2px dashed',
            borderColor: 'primary.main',
            backgroundColor: 'primary.50',
          }}
        >
          <Typography variant="body2" color="primary">
            Text selected! Click "Add Comment" to comment on the selection.
          </Typography>
        </Paper>
      )}

      {showNewCommentForm && (
        <CommentForm
          onSubmit={handleAddComment}
          onCancel={() => {
            setShowNewCommentForm(false);
            setSelectedPosition(null);
          }}
          autoFocus
        />
      )}

      <Stack spacing={2}>
        {commentsWithReplies.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <CommentIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
            <Typography variant="body1">
              No comments yet. Be the first to add one!
            </Typography>
          </Paper>
        ) : (
          commentsWithReplies.map(({ comment, replies }) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              replies={replies}
              onReply={handleReply(comment.id)}
              onResolve={() => handleResolve(comment.id)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              currentUserId={state.activeUsers.find(u => u.user_id === comment.author_id)?.user_id}
            />
          ))
        )}
      </Stack>
    </Box>
  );
};

export default CommentSystem;