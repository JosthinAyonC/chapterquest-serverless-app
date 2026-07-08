import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#800000' },
    secondary: { main: '#633A2C' },
    warning: { main: '#B88A2C' },
    background: {
      default: '#E0D6B8',
      paper: '#FFF9EF',
    },
  },
  typography: {
    fontFamily: "'Outfit', system-ui, sans-serif",
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
