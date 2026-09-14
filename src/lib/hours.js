import { useEffect, useState } from 'react';

// Horário de funcionamento da JB Marmitas: 11h às 14h, todos os dias.
// Depois das 14h o site não aceita mais pedidos (nem no banco, nem no WhatsApp).
export const OPEN_HOUR = 11;
export const CLOSE_HOUR = 14;
export const BUSINESS_HOURS_LABEL = '11h às 14h';

// Balsas-MA fica em UTC-3 o ano inteiro (o Brasil não tem horário de verão
// desde 2019), então o relógio da loja é sempre o UTC menos 3 horas.
// Calcular por aqui evita depender do fuso do visitante: um cliente em
// Portugal às 16h precisa ver "fechado", não o horário local dele.
export function balsasNow(date = new Date()) {
  return new Date(date.getTime() - 3 * 60 * 60 * 1000);
}

// Janela [11:00, 14:00): às 11h em ponto abre, às 14h em ponto já fechou.
export function isWithinBusinessHours(date = new Date()) {
  const hour = balsasNow(date).getUTCHours();
  return hour >= OPEN_HOUR && hour < CLOSE_HOUR;
}

export function closedMessage() {
  return `Estamos fechados agora. Aceitamos pedidos das ${BUSINESS_HOURS_LABEL} (horário de Balsas).`;
}

// Hook: reavalia a cada tick (padrão 30s) para o site mudar de "aberto" para
// "fechado" sozinho quando o relógio bate 14h, sem recarregar a página.
export function useBusinessHours(intervalMs = 30000) {
  const [isOpen, setIsOpen] = useState(() => isWithinBusinessHours());

  useEffect(() => {
    setIsOpen(isWithinBusinessHours());
    const timer = setInterval(() => setIsOpen(isWithinBusinessHours()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return isOpen;
}
