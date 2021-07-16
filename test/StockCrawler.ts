import axios, { AxiosResponse } from "axios";
import cheerio from "cheerio";
import CommonUtil from "@/util/common-util";
import iconv = require("iconv-lite");
import fs = require("fs");
import { Config } from "@/config";

type StockItem = {
  code: string;
  name: string;
  market: string;
  capitalization: number;
};

type Market = {
  name: string;
  seq: number;
};

const MarketList: Market[] = [
  { name: "kospi", seq: 0 },
  { name: "kosdaq", seq: 1 },
];

class StockCrawler {
  async crawler() {
    const stockList: StockItem[] = await this.getStokcList();
    console.log("stockList.length :>> ", stockList.length);
    const json = JSON.stringify(stockList, null, 2);
    fs.writeFile("./crawler-data/stock.json", json, function (err) {
      if (err) {
        console.log(err);
      }
    });
  }

  /**
   * @param page 페이지 번호
   * @returns
   */
  async getStockListPage(marketSeq: number, page: number): Promise<AxiosResponse> {
    return await axios({
      method: "get",
      url: `https://finance.naver.com/sise/sise_market_sum.nhn?sosok=${marketSeq}&page=${page}`,
      headers: {
        "User-Agent": Config.userAgent,
      },
      responseType: "arraybuffer",
    });
  }

  async getStokcList(): Promise<StockItem[]> {
    const stockList: StockItem[] = [];

    for (const market of MarketList) {
      for (let page = 1; page < 2; page++) {
        const htmlDoc: AxiosResponse = await this.getStockListPage(market.seq, page);
        const html = iconv.decode(htmlDoc.data, "euc-kr");
        const $ = cheerio.load(html);
        const list = $("table.type_2 tbody tr[onmouseover]");

        if (list.length === 0) {
          break;
        }

        // row
        list.each((i, row) => {
          const link = $(row).find("td:eq(1)").html();
          const temp = $(row).find("td:eq(6)").text();
          const capitalization = parseInt(CommonUtil.replaceAll(temp, ",", ""));
          const matches = /code=(\w*).*>(.*)</.exec(link);
          const stockItem: StockItem = {
            code: matches[1],
            name: CommonUtil.unescapeHtml(matches[2]),
            market: market.name,
            capitalization: capitalization,
          };
          stockList.push(stockItem);
        });
        console.log(`market: ${market.name}, page: ${page}`);
        await this.delay(500);
      }
    }
    return stockList;
  }

  async delay(ms) {
    new Promise((resolve) => setTimeout(() => resolve(ms), ms));
  }
}

const crawler = new StockCrawler();

crawler.crawler();
