import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },
    warning: { main: '#f59e0b' },
    background: {
      default: '#0f1419',
      paper: '#1a2332',
    },
  },
  typography: {
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
  },
  components: {
    MuiChip: {
      styleOverrides: {
        root: {
          height: 24,
        },
      },
    },
  },
});
