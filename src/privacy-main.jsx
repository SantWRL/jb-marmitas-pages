// Entrada da página de Política de Privacidade (/privacidade.html).
// Página estática: não toca no Supabase, então funciona em qualquer deploy.
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import PrivacyPolicy from './pages/privacy.jsx';

const rootNode = typeof document !== 'undefined' && document.getElementById('root');
if (rootNode) {
  createRoot(rootNode).render(<PrivacyPolicy />);
}
