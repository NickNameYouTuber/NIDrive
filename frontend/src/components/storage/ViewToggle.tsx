import React from 'react';
import { Box, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';

export type ViewMode = 'grid' | 'list' | 'large';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ viewMode, onViewChange }) => {
  const handleViewChange = (
    event: React.MouseEvent<HTMLElement>,
    newView: ViewMode | null
  ) => {
    if (newView !== null) {
      onViewChange(newView);
    }
  };

  return (
    <Box>
      <ToggleButtonGroup
        value={viewMode}
        exclusive
        onChange={handleViewChange}
        aria-label="view mode"
        size="small"
      >
        <Tooltip title="Grid view">
          <ToggleButton value="grid" aria-label="grid view">
            <GridViewIcon />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="List view">
          <ToggleButton value="list" aria-label="list view">
            <ViewListIcon />
          </ToggleButton>
        </Tooltip>
        <Tooltip title="Large view">
          <ToggleButton value="large" aria-label="large view">
            <ViewModuleIcon />
          </ToggleButton>
        </Tooltip>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ViewToggle;
