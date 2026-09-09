// Configuração do Babel usada apenas pelo babel-jest (testes de tela).
// O build de produção usa Vite/esbuild e ignora este arquivo.
const importMetaEnvPlugin = ({ types: t }) => ({
  visitor: {
    // import.meta -> ({ env: process.env, url: <url do arquivo> })
    MetaProperty(path) {
      path.replaceWith(
        t.objectExpression([
          t.objectProperty(
            t.identifier('env'),
            t.memberExpression(t.identifier('process'), t.identifier('env'))
          ),
          t.objectProperty(
            t.identifier('url'),
            t.callExpression(
              t.memberExpression(
                t.callExpression(t.identifier('require'), [t.stringLiteral('url')]),
                t.identifier('pathToFileURL')
              ),
              [t.identifier('__filename')]
            )
          )
        ])
      );
    }
  }
});

module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
    ['@babel/preset-react', { runtime: 'automatic' }]
  ],
  plugins: [importMetaEnvPlugin]
};
