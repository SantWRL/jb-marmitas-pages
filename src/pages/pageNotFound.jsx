export default function PageNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-dark text-white">
      <h1 className="text-6xl font-italiana mb-4">404</h1>
      <p className="text-2xl font-josefinSans">Página não encontrada</p>
      <a
        href="/"
        className="mt-8 px-6 py-3 bg-red text-white font-bold rounded hover:bg-redDark transition-colors"
      >
        Voltar ao início
      </a>
    </div>
  );
}
