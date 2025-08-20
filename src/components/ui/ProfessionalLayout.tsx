import React from 'react';
import { 
  Box, 
  AppBar, 
  Toolbar, 
  Typography, 
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Breadcrumbs,
  Link,
  Chip,
  styled,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Home as HomeIcon,
  Folder as FolderIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  ChevronRight as ChevronRightIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { designTokens, professionalAnimations } from '../../theme/index';
import { useThemeMode } from '../../contexts/ThemeContext';
import { ProfessionalTextField } from './ProfessionalTextField';

interface ProfessionalLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  sidebarContent?: React.ReactNode;
  sidebarWidth?: number;
  headerHeight?: number;
}

// Professional app bar with enhanced styling
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: theme.palette.mode === 'dark' 
    ? designTokens.shadows.dark.sm
    : designTokens.shadows.sm,
  borderBottom: `1px solid ${theme.palette.divider}`,
  zIndex: theme.zIndex.appBar,
  
  '& .MuiToolbar-root': {
    minHeight: 64,
    padding: `0 ${designTokens.spacing[6]}`,
    gap: designTokens.spacing[4],
  },
}));

// Professional drawer with enhanced styling
const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    backgroundColor: theme.palette.background.paper,
    borderRight: `1px solid ${theme.palette.divider}`,
    borderRadius: 0,
    boxShadow: 'none',
    overflow: 'hidden',
  },
}));

// Professional sidebar content
const SidebarContent = styled(Box)(({ theme }) => ({
  padding: designTokens.spacing[4],
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  
  '& .sidebar-header': {
    marginBottom: designTokens.spacing[6],
    padding: `${designTokens.spacing[4]} 0`,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  
  '& .sidebar-section': {
    marginBottom: designTokens.spacing[6],
    
    '& .section-title': {
      fontSize: designTokens.typography.fontSize.xs,
      fontWeight: designTokens.typography.fontWeight.semibold,
      color: theme.palette.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: designTokens.typography.letterSpacing.wider,
      marginBottom: designTokens.spacing[3],
      padding: `0 ${designTokens.spacing[3]}`,
    },
  },
}));

// Professional navigation list
const StyledList = styled(List)(() => ({
  padding: 0,
  
  '& .MuiListItem-root': {
    padding: 0,
    marginBottom: designTokens.spacing[1],
  },
}));

// Professional list item button
const StyledListItemButton = styled(ListItemButton)(({ theme }) => ({
  borderRadius: designTokens.borderRadius.md,
  padding: `${designTokens.spacing[3]} ${designTokens.spacing[3]}`,
  transition: professionalAnimations.createTransition(['background-color', 'transform']),
  
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.04),
    transform: 'translateX(2px)',
  },
  
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.12),
    },
    
    '& .MuiListItemIcon-root': {
      color: theme.palette.primary.main,
    },
    
    '& .MuiListItemText-primary': {
      fontWeight: designTokens.typography.fontWeight.semibold,
      color: theme.palette.primary.main,
    },
  },
  
  '& .MuiListItemIcon-root': {
    minWidth: 40,
    color: theme.palette.text.secondary,
    transition: professionalAnimations.createTransition(['color']),
  },
  
  '& .MuiListItemText-primary': {
    fontSize: designTokens.typography.fontSize.sm,
    fontWeight: designTokens.typography.fontWeight.medium,
    color: theme.palette.text.primary,
    transition: professionalAnimations.createTransition(['color', 'font-weight']),
  },
}));

// Professional main content area
const MainContent = styled(Box)<{ sidebarWidth: number; headerHeight: number }>(
  ({ theme, sidebarWidth, headerHeight }) => ({
    flexGrow: 1,
    padding: designTokens.spacing[6],
    marginTop: headerHeight,
    marginLeft: sidebarWidth,
    minHeight: `calc(100vh - ${headerHeight}px)`,
    backgroundColor: theme.palette.background.default,
    transition: professionalAnimations.createTransition(['margin-left']),
    
    [theme.breakpoints.down('md')]: {
      marginLeft: 0,
      padding: designTokens.spacing[4],
    },
  })
);

// Professional breadcrumb styling
const StyledBreadcrumbs = styled(Breadcrumbs)(({ theme }) => ({
  marginBottom: designTokens.spacing[4],
  
  '& .MuiBreadcrumbs-separator': {
    color: theme.palette.text.disabled,
    margin: `0 ${designTokens.spacing[2]}`,
  },
  
  '& .MuiBreadcrumbs-li': {
    '& a, & span': {
      fontSize: designTokens.typography.fontSize.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      textDecoration: 'none',
      transition: professionalAnimations.createTransition(['color']),
    },
    
    '& a': {
      color: theme.palette.text.secondary,
      
      '&:hover': {
        color: theme.palette.primary.main,
        textDecoration: 'underline',
      },
    },
    
    '&:last-child span': {
      color: theme.palette.text.primary,
      fontWeight: designTokens.typography.fontWeight.semibold,
    },
  },
}));

// Professional page header
const PageHeader = styled(Box)(({ theme }) => ({
  marginBottom: designTokens.spacing[6],
  
  '& .page-title': {
    fontSize: designTokens.typography.fontSize['2xl'],
    fontWeight: designTokens.typography.fontWeight.bold,
    color: theme.palette.text.primary,
    marginBottom: designTokens.spacing[2],
    lineHeight: designTokens.typography.lineHeight.tight,
  },
  
  '& .page-subtitle': {
    fontSize: designTokens.typography.fontSize.base,
    color: theme.palette.text.secondary,
    lineHeight: designTokens.typography.lineHeight.relaxed,
    marginBottom: designTokens.spacing[4],
  },
  
  '& .page-actions': {
    display: 'flex',
    alignItems: 'center',
    gap: designTokens.spacing[3],
    marginTop: designTokens.spacing[4],
  },
}));

// Default navigation items
const defaultNavItems = [
  { label: 'Dashboard', icon: HomeIcon, href: '/', selected: false },
  { label: 'Projects', icon: FolderIcon, href: '/projects', selected: false },
  { label: 'Team', icon: PeopleIcon, href: '/team', selected: false },
  { label: 'Analytics', icon: AnalyticsIcon, href: '/analytics', selected: false },
];

export const ProfessionalLayout: React.FC<ProfessionalLayoutProps> = ({
  children,
  title = 'Clarity Hub',
  subtitle,
  breadcrumbs,
  actions,
  sidebarContent,
  sidebarWidth = 280,
  headerHeight = 64,
}) => {
  const theme = useTheme();
  const { toggleMode } = useThemeMode();
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [notificationCount] = React.useState(3);
  
  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };
  
  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchor(event.currentTarget);
  };
  
  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };
  
  const renderSidebarContent = () => {
    if (sidebarContent) {
      return sidebarContent;
    }
    
    return (
      <SidebarContent>
        <Box className="sidebar-header">
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: designTokens.typography.fontWeight.bold,
              color: theme.palette.text.primary,
            }}
          >
            Clarity Hub
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: theme.palette.text.secondary,
              display: 'block',
              marginTop: designTokens.spacing[1],
            }}
          >
            Legal Case Management
          </Typography>
        </Box>
        
        <Box className="sidebar-section">
          <Typography className="section-title">
            Navigation
          </Typography>
          <StyledList>
            {defaultNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <ListItem key={item.label}>
                  <StyledListItemButton selected={item.selected}>
                    <ListItemIcon>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={item.label} />
                  </StyledListItemButton>
                </ListItem>
              );
            })}
          </StyledList>
        </Box>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Divider sx={{ marginY: designTokens.spacing[4] }} />
        
        <Box className="sidebar-section">
          <Typography className="section-title">
            Status
          </Typography>
          <Box sx={{ padding: designTokens.spacing[3] }}>
            <Chip 
              label="Online" 
              color="success" 
              size="small"
              sx={{ 
                fontSize: designTokens.typography.fontSize.xs,
                fontWeight: designTokens.typography.fontWeight.medium,
              }}
            />
          </Box>
        </Box>
      </SidebarContent>
    );
  };
  
  const drawer = (
    <StyledDrawer
      variant="permanent"
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: sidebarWidth,
          boxSizing: 'border-box',
        },
        [theme.breakpoints.down('md')]: {
          display: 'none',
        },
      }}
    >
      {renderSidebarContent()}
    </StyledDrawer>
  );
  
  return (
    <Box sx={{ display: 'flex' }}>
      {/* App Bar */}
      <StyledAppBar position="fixed">
        <Toolbar>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: theme.palette.text.secondary,
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <ProfessionalTextField
              placeholder="Search..."
              size="small"
              sx={{ 
                width: 300,
                [`& .MuiOutlinedInput-root`]: {
                  backgroundColor: alpha(theme.palette.background.paper, 0.8),
                },
              }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                ),
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={toggleMode}
              sx={{ color: theme.palette.text.secondary }}
              title="Toggle theme"
            >
              {theme.palette.mode === 'dark' ? '☀️' : '🌙'}
            </IconButton>
            
            <IconButton sx={{ color: theme.palette.text.secondary }}>
              <Badge badgeContent={notificationCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <IconButton sx={{ color: theme.palette.text.secondary }}>
              <SettingsIcon />
            </IconButton>
            
            <IconButton onClick={handleUserMenuOpen} sx={{ ml: 1 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                <AccountCircleIcon />
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={handleUserMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem onClick={handleUserMenuClose}>Profile</MenuItem>
              <MenuItem onClick={handleUserMenuClose}>Settings</MenuItem>
              <Divider />
              <MenuItem onClick={handleUserMenuClose}>Logout</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </StyledAppBar>
      
      {/* Sidebar */}
      {drawer}
      
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileDrawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: sidebarWidth,
          },
        }}
      >
        {renderSidebarContent()}
      </Drawer>
      
      {/* Main content */}
      <MainContent sidebarWidth={sidebarWidth} headerHeight={headerHeight}>
        {breadcrumbs && (
          <StyledBreadcrumbs separator={<ChevronRightIcon fontSize="small" />}>
            {breadcrumbs.map((crumb, index) => (
              crumb.href ? (
                <Link key={index} href={crumb.href}>
                  {crumb.label}
                </Link>
              ) : (
                <Typography key={index} color="textPrimary">
                  {crumb.label}
                </Typography>
              )
            ))}
          </StyledBreadcrumbs>
        )}
        
        <PageHeader>
          <Typography className="page-title">
            {title}
          </Typography>
          {subtitle && (
            <Typography className="page-subtitle">
              {subtitle}
            </Typography>
          )}
          {actions && (
            <Box className="page-actions">
              {actions}
            </Box>
          )}
        </PageHeader>
        
        {children}
      </MainContent>
    </Box>
  );
};

export default ProfessionalLayout;