import React from 'react';
import { SvgIcon, SvgIconProps } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

// Icon for search functionality
export const searchIcon = (props?: SvgIconProps) => <SearchIcon {...props} />;

// Icon for download functionality
export const downloadIcon = (props?: SvgIconProps) => <DownloadIcon {...props} />;

// Icon for zoom in functionality
export const zoomInIcon = (props?: SvgIconProps) => <ZoomInIcon {...props} />;

// Icon for zoom out functionality
export const zoomOutIcon = (props?: SvgIconProps) => <ZoomOutIcon {...props} />;

// Icon for next page functionality
export const nextPageIcon = (props?: SvgIconProps) => <NavigateNextIcon {...props} />;

// Icon for previous page functionality
export const prevPageIcon = (props?: SvgIconProps) => <NavigateBeforeIcon {...props} />;

// Export a default object with all icons
export default {
  searchIcon,
  downloadIcon,
  zoomInIcon,
  zoomOutIcon,
  nextPageIcon,
  prevPageIcon
}; 