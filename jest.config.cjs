module.exports = {
  // Dois projetos:
  // - "unit": testes de lógica (carrinho, formatação, páginas) em ambiente node
  // - "screen": testes de tela/colisão em jsdom com React Testing Library
  // Ambos passam pelo babel-jest (src/ é ESM+JSX; os testes rodam como CJS).
  projects: [
    {
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/*.test.js'],
      transform: {
        '^.+\\.jsx?$': ['babel-jest', { configFile: './babel.config.cjs' }]
      },
      transformIgnorePatterns: ['/node_modules/']
    },
    {
      displayName: 'screen',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/screen/*.test.jsx'],
      setupFilesAfterEnv: ['<rootDir>/tests/screen/setup.cjs'],
      transform: {
        '^.+\\.(js|jsx|cjs)$': ['babel-jest', { configFile: './babel.config.cjs' }]
      },
      transformIgnorePatterns: ['/node_modules/'],
      moduleNameMapper: {
        '\\.css$': '<rootDir>/tests/__mocks__/css-stub.cjs',
        // Aliases de import (iguais ao jsconfig.json)
        '^components/(.*)$': '<rootDir>/src/components/$1',
        '^lib/(.*)$': '<rootDir>/src/lib/$1',
        '^assets/(.*)$': '<rootDir>/assets/$1'
      }
    }
  ]
};
