import {
  OPEN_HOUR,
  CLOSE_HOUR,
  BUSINESS_HOURS_LABEL,
  balsasNow,
  isWithinBusinessHours,
  closedMessage
} from '../src/lib/hours.js';

// 2026-09-13 foi um domingo; o horário vale todos os dias da semana.
const balsas = (hour, minute = 0) => {
  // Balsas = UTC-3: 12h locais = 15h UTC.
  return new Date(Date.UTC(2026, 8, 13, hour + 3, minute, 0));
};

describe('Horário de funcionamento (11h às 14h)', () => {
  test('constantes documentam a janela e o rótulo', () => {
    expect(OPEN_HOUR).toBe(11);
    expect(CLOSE_HOUR).toBe(14);
    expect(BUSINESS_HOURS_LABEL).toBe('11h às 14h');
  });

  test('balsasNow converte para o fuso da loja (UTC-3)', () => {
    // 15h UTC = 12h em Balsas.
    const local = balsasNow(new Date(Date.UTC(2026, 8, 13, 15, 0)));
    expect(local.getUTCHours()).toBe(12);
  });

  test('11h em ponto abre (intervalo inclusivo no início)', () => {
    expect(isWithinBusinessHours(balsas(11, 0))).toBe(true);
  });

  test('12h59 está dentro e 13h59 ainda está', () => {
    expect(isWithinBusinessHours(balsas(12, 59))).toBe(true);
    expect(isWithinBusinessHours(balsas(13, 59))).toBe(true);
  });

  test('14h em ponto já fechou (intervalo exclusivo no fim)', () => {
    expect(isWithinBusinessHours(balsas(14, 0))).toBe(false);
  });

  test('fora da janela: manhã, tarde e madrugada', () => {
    expect(isWithinBusinessHours(balsas(10, 59))).toBe(false);
    expect(isWithinBusinessHours(balsas(18, 0))).toBe(false);
    expect(isWithinBusinessHours(balsas(3, 0))).toBe(false);
  });

  test('cliente em outro fuso vê o horário de Balsas, não o dele', () => {
    // 16h em Portugal (UTC+1 no verão) = 12h em Balsas: aberto.
    expect(isWithinBusinessHours(new Date(Date.UTC(2026, 8, 13, 15, 0)))).toBe(true);
    // 8h em Balsas (11h UTC) = 13h em Portugal: fechado para ambos.
    expect(isWithinBusinessHours(new Date(Date.UTC(2026, 8, 13, 11, 0)))).toBe(false);
  });

  test('mensagem de fechado informa a janela completa', () => {
    expect(closedMessage()).toContain('11h às 14h');
    expect(closedMessage()).toContain('fechados');
  });
});
