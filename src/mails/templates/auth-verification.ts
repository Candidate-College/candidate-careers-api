module.exports = (content: string): string => {
  return `
    <header>
      <h1>Auth Verification</h1>
    </header>
    <section>
      ${content}
    </section>
    <footer>
      <span>Copyright &copy; 2025</span>
    </footer>
  `;
};
