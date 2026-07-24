import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import GameCanvas from './components/GameCanvas';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GameCanvas />
    </ThemeProvider>
  );
}

export default App;
