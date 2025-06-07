import React, { useState } from 'react';
import { 
  Paper, 
  InputBase, 
  IconButton, 
  Box,
  Divider,
  Tooltip,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  FormControlLabel,
  Checkbox,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

export interface SearchFilters {
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  sizeMin?: number;
  sizeMax?: number;
  isPublic?: boolean;
}

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSearch = () => {
    onSearch(searchQuery, filters);
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    onSearch('', filters);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setAnchorEl(null);
  };

  const handleApplyFilters = () => {
    onSearch(searchQuery, filters);
    handleCloseFilter();
  };

  const handleTypeChange = (event: SelectChangeEvent) => {
    setFilters({
      ...filters,
      type: event.target.value
    });
  };

  const handleDateFromChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      dateFrom: event.target.value
    });
  };

  const handleDateToChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      dateTo: event.target.value
    });
  };

  const handlePublicChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      isPublic: event.target.checked
    });
  };

  const open = Boolean(anchorEl);

  return (
    <Box sx={{ mb: 2 }}>
      <Paper
        component="form"
        sx={{ p: '2px 4px', display: 'flex', alignItems: 'center' }}
        elevation={2}
        onSubmit={(e) => e.preventDefault()}
      >
        <IconButton sx={{ p: '10px' }} aria-label="search" onClick={handleSearch}>
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{ ml: 1, flex: 1 }}
          placeholder="Search files..."
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyPress={handleKeyPress}
        />
        {searchQuery && (
          <IconButton sx={{ p: '10px' }} aria-label="clear" onClick={handleClearSearch}>
            <CloseIcon />
          </IconButton>
        )}
        <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
        <Tooltip title="Filters">
          <IconButton 
            color="primary" 
            sx={{ p: '10px' }} 
            aria-label="filters"
            onClick={handleFilterClick}
          >
            <FilterListIcon />
          </IconButton>
        </Tooltip>
      </Paper>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleCloseFilter}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="h6" gutterBottom>Filters</Typography>
          
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel id="file-type-label">File Type</InputLabel>
            <Select
              labelId="file-type-label"
              id="file-type-select"
              value={filters.type || ''}
              label="File Type"
              onChange={handleTypeChange}
            >
              <MenuItem value=""><em>Any</em></MenuItem>
              <MenuItem value="image">Images</MenuItem>
              <MenuItem value="document">Documents</MenuItem>
              <MenuItem value="video">Videos</MenuItem>
              <MenuItem value="audio">Audio</MenuItem>
              <MenuItem value="archive">Archives</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>Upload Date</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <FormControl size="small">
                <InputLabel shrink>From</InputLabel>
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={handleDateFromChange}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </FormControl>
              <FormControl size="small">
                <InputLabel shrink>To</InputLabel>
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={handleDateToChange}
                  style={{ 
                    padding: '8px', 
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                />
              </FormControl>
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={filters.isPublic || false} 
                  onChange={handlePublicChange}
                  name="public"
                />
              }
              label="Only Public Files"
            />
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Tooltip title="Clear all filters">
              <IconButton 
                size="small"
                onClick={() => setFilters({})}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box sx={{ flex: 1 }} />
            <Box 
              component="button"
              sx={{
                px: 2,
                py: 1,
                border: 0,
                borderRadius: 1,
                backgroundColor: 'primary.main',
                color: 'white',
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
              onClick={handleApplyFilters}
            >
              Apply Filters
            </Box>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default SearchBar;
