import axios, { AxiosResponse } from "axios";
import cheerio from "cheerio";
import CommonUtil from "@/util/common-util";
import iconv = require("iconv-lite");
import fs = require("fs");

enum StockType {
  kospi = 0,
  kosdaq = 1,
}

type StockItem = {
  code: string;
  name: string;
};

const delay = (ms) => new Promise((resolve) => setTimeout(() => resolve(ms), ms));

(async function crawler() {
  const stockList: StockItem[] = [];

  for (const stockType in [StockType.kosdaq, StockType.kospi]) {
    for (let page = 1; page < 100; page++) {
      const htmlDoc: AxiosResponse = await getStockListPage(stockType, page);
      const html = iconv.decode(htmlDoc.data, "euc-kr");
      const $ = cheerio.load(html);
      const list = $("table.type_2 tbody tr[onmouseover]");

      if (list.length === 0) {
        break;
      }

      // row
      list.each((i, row) => {
        const link = $(row).find("td:eq(1)").html();
        const matches = /code=(\w*).*>(.*)</.exec(link);
        const stockItem: StockItem = { code: matches[1], name: CommonUtil.unescapeHtml(matches[2]) };
        stockList.push(stockItem);
      });
      console.log(`stock: ${stockType}, page: ${page}`);
      await delay(500);
    }
  }
  console.log("stockList.length :>> ", stockList.length);
  const json = JSON.stringify(stockList, null, 2);
  fs.writeFile("./crawler-data/stock.json", json, function (err) {
    if (err) {
      console.log(err);
    }
  });
})();

/**
 * @param page 페이지 번호
 * @returns
 */
async function getStockListPage(type: string, page: number): Promise<AxiosResponse> {
  return await axios({
    method: "get",
    url: `https://finance.naver.com/sise/sise_market_sum.nhn?sosok=${type}&page=${page}`,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
    },
    responseType: "arraybuffer",
  });
}
