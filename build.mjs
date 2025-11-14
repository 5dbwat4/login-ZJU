import * as esbuild from "esbuild";
// import package_info from "./package.json" assert { type: "json" };
import package_info from "./package.json" with { type: "json" };
import { execSync } from "child_process";

const banner = `\
/**
 * login-ZJU: A server-side library helping your application login to ZJU services
 * @author 5dbwat4<me@5dbwat4.top>
 * @version ${package_info.version}
 */`;

await esbuild.build({
  entryPoints: ["./index.ts"],
  bundle: true,
  minify: true,
  platform: "node",
  outfile: "./build/login-ZJU.js",
  sourcemap: "linked",
  //   target: 'lib',
  format: "esm",
  //   legalComments:'inline',
  banner: {
    js: banner,
  },
});

// execSync("npx tsc --project tsconfig.json");
