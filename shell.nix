with (import <nixpkgs> {});
mkShell {
  buildInputs = [
    tinymist
    typst
    typescript-language-server
    nodejs_24
  ];
}
