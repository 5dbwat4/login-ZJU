import * as esbuild from 'esbuild'
import package_info from './package.json'  assert { type: 'json' };

const banner=`\
/**
 * login-ZJU: A server-side library helping your application login to ZJU services
 * @author 5dbwat4<me@5dbwat4.top>
 * @version ${package_info.version}
 */`

await esbuild.build({
  entryPoints: ['./index.ts'],
  bundle: true,
  minify: true,
  platform: 'node',
  outfile: './build/login-ZJU.js',
  sourcemap: 'linked',
  lineLimit: 110,
//   target: 'lib',
  format:'esm',
//   legalComments:'inline',
  banner:{
    js: banner
  }

})