// eslint-disable-next-line @typescript-eslint/no-var-requires
const webpack = require("webpack");

module.exports = {
  devServer: {
    port: 8081,
    // 1. api 요청이 있을때 어디에서 처리할지를 설정
    proxy: {
      "/api": {
        target: "http://localhost:8080/api",
        changeOrigin: true,
        pathRewrite: {
          "^/api": "",
        },
      },
    },
  },
  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        // 글로벌 변수
        $: "jquery",
        Cookies: "js-cookie",
        Swal: "sweetalert2",
      }),
    ],
  },
  outputDir: "../dist/frontend", // 2. 배포 파일의 위치를 지정
};
