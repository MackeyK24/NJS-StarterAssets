import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // reactStrictMode: true, // Enable Strict Mode
  // output: "export",      // Enable Static Export

  // The src/babylon git submodule imports PNGs with plain <img src={logo}>, expecting
  // a string URL. Next.js's next-image-loader would return a StaticImageData object
  // instead, causing <img src="[object Object]">. The fix: intercept those two imports
  // before any loader runs and replace them with inline data-URI modules that export
  // the public path strings. webpack: true is set in server-classic.ts so this runs.
  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /assets[/\\]babylon\.png$/,
        (res: { request: string }) => {
          res.request = "data:text/javascript,export default '/babylon.png'";
        }
      ),
      new webpack.NormalModuleReplacementPlugin(
        /assets[/\\]spinner\.png$/,
        (res: { request: string }) => {
          res.request = "data:text/javascript,export default '/spinner.png'";
        }
      )
    );
    return config;
  },
};

export default nextConfig;
