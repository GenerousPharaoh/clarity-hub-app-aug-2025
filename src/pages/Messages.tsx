import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import { Inbox as InboxIcon } from '@mui/icons-material';

const Messages = () => {
  const demoMessages = [
    { id: 1, from: 'John Smith', subject: 'Case Update - Johnson vs. State', time: '2 hours ago', unread: true },
    { id: 2, from: 'Sarah Williams', subject: 'Document Review Complete', time: '5 hours ago', unread: false },
    { id: 3, from: 'Legal Team', subject: 'New Evidence Submitted', time: '1 day ago', unread: false },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <InboxIcon sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">Messages</Typography>
      </Box>
      
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        <List>
          {demoMessages.map((message, index) => (
            <React.Fragment key={message.id}>
              <ListItem sx={{ 
                bgcolor: message.unread ? 'action.hover' : 'transparent',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' }
              }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="subtitle1" fontWeight={message.unread ? 600 : 400}>
                        {message.subject}
                      </Typography>
                      {message.unread && <Chip label="New" size="small" color="primary" />}
                    </Box>
                  }
                  secondary={`From: ${message.from} • ${message.time}`}
                />
              </ListItem>
              {index < demoMessages.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
      
      <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Messages feature coming soon. This will include secure messaging between team members and case participants.
        </Typography>
      </Box>
    </Box>
  );
};

export default Messages;