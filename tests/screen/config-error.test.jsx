// Tela de erro de configuração substitui a "tela preta" quando o deploy
// não tem as variáveis de ambiente do Supabase.
import { render, screen } from '@testing-library/react';
import { ConfigErrorScreen } from '../../src/lib/ConfigErrorScreen.jsx';
import { supabaseConfigError } from '../../src/lib/supabase.js';

describe('Tela: erro de configuração do Supabase', () => {
  test('sem variáveis faltando no ambiente de teste, não há erro de config', () => {
    expect(supabaseConfigError).toBe('');
  });

  test('mostra mensagem de erro, instruções e contato do WhatsApp', () => {
    render(
      <ConfigErrorScreen message="Supabase não configurado neste deploy: falta VITE_SUPABASE_URL (teste)." />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('falta VITE_SUPABASE_URL');
    expect(screen.getByText('VITE_SUPABASE_URL')).toBeInTheDocument();
    expect(screen.getByText('VITE_SUPABASE_PUBLISHABLE_KEY')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /falar com a JB Marmitas/ })).toHaveAttribute(
      'href',
      'https://wa.me/558999195466'
    );
  });
});
