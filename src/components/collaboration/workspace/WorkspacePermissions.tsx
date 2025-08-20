import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  FormControlLabel,
  Divider,
  Stack,
  Paper,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Share as ShareIcon,
  Security as SecurityIcon,
  Visibility as ViewIcon,
  Create as EditPermIcon,
  Comment as CommentIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string;
}

interface WorkspacePermission {
  id: string;
  user_id: string;
  project_id: string;
  permissions: {
    read: boolean;
    write: boolean;
    comment: boolean;
    admin: boolean;
    share: boolean;
  };
  granted_by: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

interface WorkspacePermissionsProps {
  projectId: string;
  currentUserId?: string;
  isProjectOwner?: boolean;
}

interface InviteUserDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, permissions: WorkspacePermission['permissions']) => void;
  users: User[];
}

interface PermissionEditorProps {
  permission: WorkspacePermission;
  onChange: (permissionId: string, newPermissions: WorkspacePermission['permissions']) => void;
  disabled?: boolean;
}

const PermissionEditor: React.FC<PermissionEditorProps> = ({
  permission,
  onChange,
  disabled = false,
}) => {
  const handlePermissionChange = (key: keyof WorkspacePermission['permissions'], value: boolean) => {
    const newPermissions = { ...permission.permissions, [key]: value };
    
    // If removing admin, remove all other permissions
    if (key === 'admin' && !value) {
      newPermissions.share = false;
    }
    
    // If adding admin, add all other permissions
    if (key === 'admin' && value) {
      newPermissions.read = true;
      newPermissions.write = true;
      newPermissions.comment = true;
      newPermissions.share = true;
    }
    
    // If removing read, remove all dependent permissions
    if (key === 'read' && !value) {
      newPermissions.write = false;
      newPermissions.comment = false;
      newPermissions.admin = false;
      newPermissions.share = false;
    }
    
    // If adding write or comment, ensure read is enabled
    if ((key === 'write' || key === 'comment') && value) {
      newPermissions.read = true;
    }
    
    // If adding share, ensure read is enabled
    if (key === 'share' && value) {
      newPermissions.read = true;
    }
    
    onChange(permission.id, newPermissions);
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <FormControlLabel
        control={
          <Switch
            checked={permission.permissions.read}
            onChange={(e) => handlePermissionChange('read', e.target.checked)}
            disabled={disabled}
            size="small"
          />
        }
        label={<ViewIcon fontSize="small" />}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={permission.permissions.write}
            onChange={(e) => handlePermissionChange('write', e.target.checked)}
            disabled={disabled || !permission.permissions.read}
            size="small"
          />
        }
        label={<EditPermIcon fontSize="small" />}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={permission.permissions.comment}
            onChange={(e) => handlePermissionChange('comment', e.target.checked)}
            disabled={disabled || !permission.permissions.read}
            size="small"
          />
        }
        label={<CommentIcon fontSize="small" />}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={permission.permissions.share}
            onChange={(e) => handlePermissionChange('share', e.target.checked)}
            disabled={disabled || !permission.permissions.read}
            size="small"
          />
        }
        label={<ShareIcon fontSize="small" />}
      />
      
      <FormControlLabel
        control={
          <Switch
            checked={permission.permissions.admin}
            onChange={(e) => handlePermissionChange('admin', e.target.checked)}
            disabled={disabled}
            size="small"
          />
        }
        label={<AdminIcon fontSize="small" />}
      />
    </Stack>
  );
};

const InviteUserDialog: React.FC<InviteUserDialogProps> = ({
  open,
  onClose,
  onInvite,
  users,
}) => {
  const [email, setEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<WorkspacePermission['permissions']>({
    read: true,
    write: false,
    comment: true,
    admin: false,
    share: false,
  });

  const handleInvite = () => {
    const inviteEmail = selectedUser?.email || email;
    if (inviteEmail.trim()) {
      onInvite(inviteEmail.trim(), permissions);
      setEmail('');
      setSelectedUser(null);
      setPermissions({
        read: true,
        write: false,
        comment: true,
        admin: false,
        share: false,
      });
      onClose();
    }
  };

  const handlePermissionChange = (key: keyof WorkspacePermission['permissions'], value: boolean) => {
    const newPermissions = { ...permissions, [key]: value };
    
    // Apply the same logic as PermissionEditor
    if (key === 'admin' && !value) {
      newPermissions.share = false;
    }
    
    if (key === 'admin' && value) {
      newPermissions.read = true;
      newPermissions.write = true;
      newPermissions.comment = true;
      newPermissions.share = true;
    }
    
    if (key === 'read' && !value) {
      newPermissions.write = false;
      newPermissions.comment = false;
      newPermissions.admin = false;
      newPermissions.share = false;
    }
    
    if ((key === 'write' || key === 'comment') && value) {
      newPermissions.read = true;
    }
    
    if (key === 'share' && value) {
      newPermissions.read = true;
    }
    
    setPermissions(newPermissions);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Invite User to Workspace</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Autocomplete
            options={users}
            getOptionLabel={(option) => `${option.first_name} ${option.last_name} (${option.email})`}
            value={selectedUser}
            onChange={(_, newValue) => setSelectedUser(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search users or enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                margin="normal"
              />
            )}
            renderOption={(props, option) => (
              <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar src={option.avatar_url} sx={{ width: 24, height: 24 }}>
                  {option.first_name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="body2">
                    {option.first_name} {option.last_name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.email}
                  </Typography>
                </Box>
              </Box>
            )}
            freeSolo
          />
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Permissions
        </Typography>
        
        <Paper sx={{ p: 2 }}>
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ViewIcon />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">View</Typography>
                <Typography variant="caption" color="text.secondary">
                  Can view documents and whiteboard
                </Typography>
              </Box>
              <Switch
                checked={permissions.read}
                onChange={(e) => handlePermissionChange('read', e.target.checked)}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EditPermIcon />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">Edit</Typography>
                <Typography variant="caption" color="text.secondary">
                  Can edit documents and whiteboard
                </Typography>
              </Box>
              <Switch
                checked={permissions.write}
                onChange={(e) => handlePermissionChange('write', e.target.checked)}
                disabled={!permissions.read}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CommentIcon />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">Comment</Typography>
                <Typography variant="caption" color="text.secondary">
                  Can add comments and annotations
                </Typography>
              </Box>
              <Switch
                checked={permissions.comment}
                onChange={(e) => handlePermissionChange('comment', e.target.checked)}
                disabled={!permissions.read}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <ShareIcon />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">Share</Typography>
                <Typography variant="caption" color="text.secondary">
                  Can invite others to the workspace
                </Typography>
              </Box>
              <Switch
                checked={permissions.share}
                onChange={(e) => handlePermissionChange('share', e.target.checked)}
                disabled={!permissions.read}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AdminIcon />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">Admin</Typography>
                <Typography variant="caption" color="text.secondary">
                  Full access including permission management
                </Typography>
              </Box>
              <Switch
                checked={permissions.admin}
                onChange={(e) => handlePermissionChange('admin', e.target.checked)}
              />
            </Box>
          </Stack>
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleInvite} 
          variant="contained"
          disabled={!selectedUser && !email.trim()}
        >
          Send Invitation
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const WorkspacePermissions: React.FC<WorkspacePermissionsProps> = ({
  projectId,
  currentUserId,
  isProjectOwner = false,
}) => {
  const [permissions, setPermissions] = useState<WorkspacePermission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ element: HTMLElement; permissionId: string } | null>(null);

  // Load permissions and users
  useEffect(() => {
    loadPermissions();
    loadUsers();
  }, [projectId]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      // This would be a real API call
      const mockPermissions: WorkspacePermission[] = [
        {
          id: '1',
          user_id: 'user1',
          project_id: projectId,
          permissions: { read: true, write: true, comment: true, admin: false, share: true },
          granted_by: currentUserId || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: 'user1',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john@example.com',
            avatar_url: undefined,
          },
        },
        {
          id: '2',
          user_id: 'user2',
          project_id: projectId,
          permissions: { read: true, write: false, comment: true, admin: false, share: false },
          granted_by: currentUserId || '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          user: {
            id: 'user2',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane@example.com',
            avatar_url: undefined,
          },
        },
      ];
      setPermissions(mockPermissions);
    } catch (err) {
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // This would be a real API call to get all users
      const mockUsers: User[] = [
        { id: 'user3', first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com' },
        { id: 'user4', first_name: 'Alice', last_name: 'Brown', email: 'alice@example.com' },
      ];
      setUsers(mockUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleInviteUser = async (email: string, userPermissions: WorkspacePermission['permissions']) => {
    try {
      // This would be a real API call
      const newPermission: WorkspacePermission = {
        id: `perm_${Date.now()}`,
        user_id: `user_${Date.now()}`,
        project_id: projectId,
        permissions: userPermissions,
        granted_by: currentUserId || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: {
          id: `user_${Date.now()}`,
          first_name: email.split('@')[0],
          last_name: '',
          email,
        },
      };
      
      setPermissions(prev => [...prev, newPermission]);
    } catch (err) {
      setError('Failed to invite user');
    }
  };

  const handlePermissionChange = async (permissionId: string, newPermissions: WorkspacePermission['permissions']) => {
    try {
      setPermissions(prev =>
        prev.map(p =>
          p.id === permissionId
            ? { ...p, permissions: newPermissions, updated_at: new Date().toISOString() }
            : p
        )
      );
      // This would be a real API call to update permissions
    } catch (err) {
      setError('Failed to update permissions');
    }
  };

  const handleRemoveUser = async (permissionId: string) => {
    try {
      setPermissions(prev => prev.filter(p => p.id !== permissionId));
      // This would be a real API call to remove user
    } catch (err) {
      setError('Failed to remove user');
    }
  };

  const getUserName = (user?: User) => {
    if (!user) return 'Unknown User';
    return `${user.first_name} ${user.last_name}`.trim() || user.email;
  };

  const getPermissionSummary = (perms: WorkspacePermission['permissions']) => {
    if (perms.admin) return 'Admin';
    if (perms.write) return 'Editor';
    if (perms.comment) return 'Commenter';
    if (perms.read) return 'Viewer';
    return 'No Access';
  };

  const canManagePermissions = isProjectOwner || permissions.find(p => p.user_id === currentUserId)?.permissions.admin;

  if (loading) {
    return <Typography>Loading permissions...</Typography>;
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIcon />
            <Typography variant="h6">
              Workspace Permissions
            </Typography>
          </Box>
          
          {canManagePermissions && (
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              onClick={() => setInviteDialogOpen(true)}
            >
              Invite User
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Permissions</TableCell>
                <TableCell>Added</TableCell>
                {canManagePermissions && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {permissions.map((permission) => (
                <TableRow key={permission.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        src={permission.user?.avatar_url}
                        sx={{ width: 32, height: 32 }}
                      >
                        {permission.user?.first_name?.charAt(0) || 'U'}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {getUserName(permission.user)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {permission.user?.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={getPermissionSummary(permission.permissions)}
                      size="small"
                      color={permission.permissions.admin ? 'error' : 
                             permission.permissions.write ? 'warning' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <PermissionEditor
                      permission={permission}
                      onChange={handlePermissionChange}
                      disabled={!canManagePermissions || permission.user_id === currentUserId}
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(permission.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  
                  {canManagePermissions && (
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => setMenuAnchor({ element: e.currentTarget, permissionId: permission.id })}
                        disabled={permission.user_id === currentUserId}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {permissions.length === 0 && (
          <Paper sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
            <SecurityIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
            <Typography variant="body1">
              No users have been granted access yet
            </Typography>
            <Typography variant="body2">
              Invite team members to start collaborating
            </Typography>
          </Paper>
        )}
      </CardContent>

      <InviteUserDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onInvite={handleInviteUser}
        users={users}
      />

      <Menu
        anchorEl={menuAnchor?.element}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            if (menuAnchor) {
              handleRemoveUser(menuAnchor.permissionId);
            }
            setMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Remove Access
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default WorkspacePermissions;