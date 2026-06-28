import Chip from '@mui/material/Chip';
import { ThemeProvider } from '@mui/material/styles';
import {
  getAppEnvironment,
  getEnvironmentBadgeLabel,
} from '../lib/env';
import { muiTheme } from '../theme/muiTheme';

export default function EnvironmentBadge() {
  const label = getEnvironmentBadgeLabel(getAppEnvironment());
  if (!label) {
    return null;
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <Chip
        label={label}
        size="small"
        color="warning"
        variant="outlined"
        aria-label={`App environment: ${label}`}
        sx={{
          fontWeight: 700,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          fontSize: '0.625rem',
          borderRadius: '999px',
        }}
      />
    </ThemeProvider>
  );
}
