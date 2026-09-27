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
            wget
          ];
          shellHook = ''
            if [ ! -d "./tinymist" ]; then
              wget https://github.com/Myriad-Dreamin/tinymist/releases/download/v0.15.8/tinymist-web.tar.gz
              tar -xf tinymist-web.tar.gz
              mv package tinymist
              rm tinymist-web.tar.gz
            fi
          '';
        };
      }
    );
}
