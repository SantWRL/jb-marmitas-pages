import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

// Motivo pelo qual o Supabase não pôde ser configurado (string vazia = ok).
// A interface usa isso para mostrar uma tela de erro visível em vez de
// quebrar o bundle inteiro com um throw (que deixava a tela preta).
const missing = [];
if (!supabaseUrl) missing.push('VITE_SUPABASE_URL');
if (!publishableKey) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');

export const supabaseConfigError = missing.length
  ? `Supabase não configurado neste deploy: falta ${missing.join(' e ')}. O responsável pelo site precisa definir as variáveis de ambiente (GitHub → Settings → Secrets and variables → Actions) e publicar novamente.`
  : '';

// Quando não configurado, usa valores placeholder apenas para o bundle
// continuar importável — nenhuma chamada é feita, porque a tela de erro
// substitui o App antes de qualquer efeito rodar.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  publishableKey || 'placeholder-anon-key'
);
