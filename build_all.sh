#!/bin/sh
mkdir dist
cp index.dist.html dist/index.html
cp -r js dist/
cp -r types dist/
cp -r css dist/
engine ./scripts/bundle-iif.ts core/vans.iif.ts
engine ./scripts/bundle-iif.ts core/pico.iif.ts
engine ./scripts/bundle.ts core/protobuf/proto.ts
engine ./scripts/bundle.ts pages/404.ts
engine ./scripts/bundle.ts pages/index.ts

