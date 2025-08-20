import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  TextField,
  IconButton,
  Button,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Chip,
  Divider,
  Badge,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Mood as EmojiIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
  PersonAdd as MentionIcon,
  Notifications as NotificationsIcon,
  NotificationsOff as NotificationsOffIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { useCollaboration, ChatMessage } from '../../../contexts/CollaborationContext';

interface TeamChatProps {
  projectId: string;
  compact?: boolean;
  maxHeight?: number;
}

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar?: boolean;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onReply: (message: ChatMessage) => void;
}

interface MessageInputProps {
  onSend: (content: string, type?: ChatMessage['message_type']) => void;
  placeholder?: string;
  disabled?: boolean;
  replyTo?: ChatMessage;
  onCancelReply?: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isOwn,
  showAvatar = true,
  onEdit,
  onDelete,
  onReply,
}) => {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const getUserName = () => {
    const firstName = message.author?.first_name || '';
    const lastName = message.author?.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Anonymous';
  };

  const getUserInitials = () => {
    const firstName = message.author?.first_name || '';
    const lastName = message.author?.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || 'A';
  };

  const getMessageTime = () => {
    const messageDate = new Date(message.created_at);
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    }
    if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'HH:mm')}`;
    }
    return format(messageDate, 'MMM d, HH:mm');
  };

  const handleEditSubmit = () => {
    if (editContent.trim() && editContent !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setEditing(false);
    setEditContent(message.content);
  };

  const handleEditCancel = () => {
    setEditing(false);
    setEditContent(message.content);
  };

  const renderMessageContent = () => {
    if (message.message_type === 'system') {
      return (
        <Paper sx={{ p: 1, backgroundColor: 'action.hover', textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {message.content}
          </Typography>
        </Paper>
      );
    }

    return (
      <Paper
        sx={{
          p: 1.5,
          maxWidth: '70%',
          backgroundColor: isOwn ? 'primary.main' : 'background.paper',
          color: isOwn ? 'primary.contrastText' : 'text.primary',
          borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          border: isOwn ? 'none' : '1px solid',
          borderColor: 'divider',
        }}
      >
        {editing ? (
          <Box>
            <TextField
              fullWidth
              multiline
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                style: { color: isOwn ? 'inherit' : undefined },
              }}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                size="small"
                onClick={handleEditSubmit}
                sx={{ color: isOwn ? 'inherit' : undefined }}
              >
                Save
              </Button>
              <Button
                size="small"
                onClick={handleEditCancel}
                sx={{ color: isOwn ? 'inherit' : undefined }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {message.content}
            {message.edited && (
              <Typography
                component="span"
                variant="caption"
                sx={{
                  ml: 1,
                  opacity: 0.7,
                  fontStyle: 'italic',
                }}
              >
                (edited)
              </Typography>
            )}
          </Typography>
        )}
      </Paper>
    );
  };

  if (message.message_type === 'system') {
    return (
      <ListItem sx={{ justifyContent: 'center', py: 0.5 }}>
        {renderMessageContent()}
      </ListItem>
    );
  }

  return (
    <ListItem
      sx={{
        alignItems: 'flex-start',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        py: 0.5,
        '&:hover .message-actions': {
          opacity: 1,
        },
      }}
    >
      {showAvatar && (
        <ListItemAvatar sx={{ minWidth: isOwn ? 40 : 56 }}>
          <Avatar
            src={message.author?.avatar_url}
            sx={{
              width: 32,
              height: 32,
              ml: isOwn ? 1 : 0,
              mr: isOwn ? 0 : 1,
            }}
          >
            {getUserInitials()}
          </Avatar>
        </ListItemAvatar>
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isOwn ? 'flex-end' : 'flex-start',
          flex: 1,
          ml: !showAvatar && !isOwn ? 5 : 0,
          mr: !showAvatar && isOwn ? 5 : 0,
        }}
      >
        {showAvatar && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 0.5,
              flexDirection: isOwn ? 'row-reverse' : 'row',
            }}
          >
            <Typography variant="caption" fontWeight="bold">
              {getUserName()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {getMessageTime()}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            flexDirection: isOwn ? 'row-reverse' : 'row',
          }}
        >
          {renderMessageContent()}

          <Box
            className="message-actions"
            sx={{
              opacity: 0,
              transition: 'opacity 0.2s',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Tooltip title="Reply">
              <IconButton
                size="small"
                onClick={() => onReply(message)}
                sx={{ mb: 0.5 }}
              >
                <ReplyIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {isOwn && (
              <IconButton
                size="small"
                onClick={(e) => setAnchorEl(e.currentTarget)}
              >
                <MoreVertIcon fontSize="small" />
              </IconButton>
            )}
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem
              onClick={() => {
                setEditing(true);
                setAnchorEl(null);
              }}
            >
              <EditIcon fontSize="small" sx={{ mr: 1 }} />
              Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                onDelete(message.id);
                setAnchorEl(null);
              }}
              sx={{ color: 'error.main' }}
            >
              <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
              Delete
            </MenuItem>
          </Menu>
        </Box>
      </Box>
    </ListItem>
  );
};

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  placeholder = "Type a message...",
  disabled = false,
  replyTo,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
      {replyTo && (
        <Paper sx={{ p: 1, mb: 1, backgroundColor: 'action.hover' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="caption" color="text.secondary">
              Replying to {replyTo.author?.first_name || 'User'}
            </Typography>
            <IconButton size="small" onClick={onCancelReply}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {replyTo.content.length > 50
              ? `${replyTo.content.substring(0, 50)}...`
              : replyTo.content}
          </Typography>
        </Paper>
      )}

      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Attach file">
                    <IconButton size="small" disabled={disabled}>
                      <AttachFileIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Add emoji">
                    <IconButton
                      size="small"
                      disabled={disabled}
                      onClick={(e) => setAnchorEl(e.currentTarget)}
                    >
                      <EmojiIcon />
                    </IconButton>
                  </Tooltip>

                  <IconButton
                    type="submit"
                    size="small"
                    disabled={disabled || !message.trim()}
                    color="primary"
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </InputAdornment>
            ),
          }}
        />
      </form>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        {['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥'].map((emoji) => (
          <MenuItem
            key={emoji}
            onClick={() => {
              setMessage(message + emoji);
              setAnchorEl(null);
            }}
          >
            {emoji}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

const TeamChat: React.FC<TeamChatProps> = ({
  projectId,
  compact = false,
  maxHeight = 600,
}) => {
  const { state, sendMessage, editMessage } = useCollaboration();
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [notifications, setNotifications] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get messages for this project
  const projectMessages = state.chatMessages.filter(
    msg => msg.project_id === projectId
  );

  // Group messages by day and consecutive same author
  const groupedMessages = projectMessages.reduce((groups, message, index) => {
    const prevMessage = projectMessages[index - 1];
    const messageDate = new Date(message.created_at);
    const prevDate = prevMessage ? new Date(prevMessage.created_at) : null;

    const isSameDay = prevDate && 
      messageDate.toDateString() === prevDate.toDateString();
    const isSameAuthor = prevMessage && 
      prevMessage.author_id === message.author_id &&
      (messageDate.getTime() - new Date(prevMessage.created_at).getTime()) < 5 * 60 * 1000; // 5 minutes

    const showAvatar = !isSameAuthor;
    const showDateDivider = !isSameDay;

    groups.push({
      message,
      showAvatar,
      showDateDivider,
    });

    return groups;
  }, [] as Array<{ message: ChatMessage; showAvatar: boolean; showDateDivider: boolean }>);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [projectMessages.length, scrollToBottom]);

  const handleSendMessage = useCallback((content: string) => {
    sendMessage({
      project_id: projectId,
      content,
      message_type: 'text',
      thread_id: replyTo?.id,
      metadata: replyTo ? { reply_to: replyTo.id } : undefined,
    });
    setReplyTo(null);
  }, [sendMessage, projectId, replyTo]);

  const handleEditMessage = useCallback((messageId: string, content: string) => {
    editMessage(messageId, content);
  }, [editMessage]);

  const handleDeleteMessage = useCallback((messageId: string) => {
    // Delete functionality would be implemented here
    console.log('Delete message:', messageId);
  }, []);

  const handleReply = useCallback((message: ChatMessage) => {
    setReplyTo(message);
  }, []);

  const unreadCount = projectMessages.filter(
    msg => new Date(msg.created_at) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
  ).length;

  return (
    <Card sx={{ height: maxHeight, display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6">
              Team Chat
            </Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="primary">
                <NotificationsIcon />
              </Badge>
            )}
          </Box>

          <Tooltip title={notifications ? 'Mute notifications' : 'Enable notifications'}>
            <IconButton
              size="small"
              onClick={() => setNotifications(!notifications)}
            >
              {notifications ? <NotificationsIcon /> : <NotificationsOffIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>

      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        {groupedMessages.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body1">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <List sx={{ py: 1 }}>
            {groupedMessages.map(({ message, showAvatar, showDateDivider }, index) => (
              <React.Fragment key={message.id}>
                {showDateDivider && (
                  <ListItem sx={{ justifyContent: 'center', py: 1 }}>
                    <Chip
                      label={format(new Date(message.created_at), 'MMMM d, yyyy')}
                      size="small"
                      variant="outlined"
                    />
                  </ListItem>
                )}
                <MessageItem
                  message={message}
                  isOwn={message.author_id === state.activeUsers[0]?.user_id}
                  showAvatar={showAvatar}
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                  onReply={handleReply}
                />
              </React.Fragment>
            ))}
          </List>
        )}
        <div ref={messagesEndRef} />
      </Box>

      <MessageInput
        onSend={handleSendMessage}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </Card>
  );
};

export default TeamChat;