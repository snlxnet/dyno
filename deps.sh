if [ ! -d "./src/tinymist" ]; then
  cd src
  wget https://github.com/Myriad-Dreamin/tinymist/releases/download/v0.15.8/tinymist-web.tar.gz
  tar -xf tinymist-web.tar.gz
  mv package tinymist
  rm tinymist-web.tar.gz
  cd ..
fi

if [ ! -d "./src/yap.js" ]; then
  wget https://yap.snlx.net/runtime.js -O src/yap.js
fi

if [ ! -d "./src/npm" ]; then
  cd src
  mkdir -p npm/engine
  wget https://cdn.jsdelivr.net/npm/typ-js@0.2.0/typ_js.js -O npm/typ_js.js
  wget https://cdn.jsdelivr.net/npm/typ-js@0.2.0/typ_js_bg.wasm -O npm/typ_js_bg.wasm
  cd ..
fi
