{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs { inherit system; };
      in
      {
        devShell = with pkgs; mkShell {
          buildInputs = [
            nodejs_24
            typescript-language-server
            wget
          ];
          shellHook = ''
            if [ ! -d "./src/tinymist" ]; then
              wget https://github.com/Myriad-Dreamin/tinymist/releases/download/v0.15.8/tinymist-web.tar.gz
              tar -xf tinymist-web.tar.gz
              mv package tinymist
              rm tinymist-web.tar.gz
            fi

            if [ ! -d "./src/npm" ]; then
              mkdir -p npm/engine
              wget https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/dist/worker/browser.js -O npm/browser.js

              wget https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/+esm -O npm/typst.js
              wget https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/dist/engine/engine.core.wasm -O npm/engine/engine.core.wasm
              wget https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/dist/engine/engine.core2.wasm -O npm/engine/engine.core2.wasm
              wget https://cdn.jsdelivr.net/npm/typst-wasm@1.0.0/dist/engine/engine.core3.wasm -O npm/engine/engine.core3.wasm

              wget https://cdn.jsdelivr.net/npm/nanotar@0.2.1/+esm -O npm/nanotar.js
              sed -i 's#/npm/nanotar@0.2.1/+esm#/npm/nanotar.js#' npm/typst.js
            fi
          '';
        };
      }
    );
}
