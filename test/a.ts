import axios, { AxiosResponse } from "axios";
import cheerio from "cheerio";
import CommonUtil from "@/util/common-util";
import iconv = require("iconv-lite");

const delay = (ms) =>
  new Promise((resolve) => {
    setTimeout(() => {
      // nothing
    }, ms);
  });

(async function crawler() {
  for (let i = 1; i < 2; i++) {
    const htmlDoc: AxiosResponse = await getStockListPage(i);
    const html = iconv.decode(htmlDoc.data, "euc-kr");

    const $ = cheerio.load(html);
    const list = $("table.type_2 tbody tr[onmouseover]");
    // row
    list.each((i, row) => {
      const link = $(row).find("td:eq(1)").html();
      const matches = /code=(\w*).*>(.*)</.exec(link);
      const stockList = {};
      stockList["code"];
      stockList["code"] = matches[1];
      stockList["name"] = CommonUtil.unescapeHtml(matches[2]);
      console.log("stockList :>> ", stockList);
    });
    await delay(1000);
  }
})();

/**
 * @param page 페이지 번호
 * @returns
 */
async function getStockListPage(page: number): Promise<AxiosResponse> {
  return await axios({
    method: "get",
    url: `https://finance.naver.com/sise/sise_market_sum.nhn?sosok=0&page=${page}`,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
    },
    responseType: "arraybuffer",
  });
}
