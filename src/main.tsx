import { createRoot } from 'react-dom/client';
import { App } from './App';
import { StoreProvider } from './game/store';
import { createPlatform } from './platform';
import './styles.css';

// Требования площадки: ни контекстного меню, ни выделения по долгому нажатию в игровой области (п. 1.6.1.8, 1.6.2.7).
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('selectstart', (e) => e.preventDefault());
document.addEventListener('dragstart', (e) => e.preventDefault());

async function boot() {
  const platform = await createPlatform();
  // Язык определяем через SDK при запуске (п. 2.14). Игра пока только на русском.
  document.documentElement.lang = platform.lang().startsWith('ru') ? 'ru' : platform.lang();
  const save = await platform.load();
  createRoot(document.getElementById('root')!).render(
    <StoreProvider platform={platform} initial={save}>
      <App />
    </StoreProvider>,
  );
}

void boot();
