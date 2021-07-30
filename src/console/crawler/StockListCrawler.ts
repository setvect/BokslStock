import { AxiosResponse } from "axios";
import cheerio from "cheerio";
import CommonUtil from "@/util/common-util";
import iconv = require("iconv-lite");
import { Config } from "@/config";
import { StockItem, MarketList } from "./StockStruct";
import CrawlerHttp from "./CrawlerHttp";

class StockListCrawler {
  async crawler() {
    const stockList: StockItem[] = await this.getStokcList();
    CommonUtil.saveObjectToJson(stockList, Config.crawling.file.stockList);
  }

  async getStokcList(): Promise<StockItem[]> {
    const stockList: StockItem[] = [];

    for (const market of MarketList) {
      for (let page = 1; page < 100; page++) {
        const htmlDoc: AxiosResponse = await CrawlerHttp.getStockListPage(market.seq, page);
        const html = iconv.decode(htmlDoc.data, "euc-kr");
        const $ = cheerio.load(html);
        const list = $("table.type_2 tbody tr[onmouseover]");

        if (list.length === 0) {
          break;
        }

        // row
        list.each((i, row) => {
          const link = $(row).find("td:eq(1)").html();
          const currentPrice = CommonUtil.getElementInt($(row).find("td:eq(2)"));
          const capitalization = CommonUtil.getElementInt($(row).find("td:eq(6)"));
          const matches = /code=(\w*).*>(.*)</.exec(link);
          const stockItem: StockItem = {
            code: matches[1],
            name: CommonUtil.unescapeHtml(matches[2]),
            market: market.name,
            capitalization: capitalization,
            currentPrice,
          };
          stockList.push(stockItem);
        });
        const delayTime = 500 + Math.random() * 1000;
        console.log(`market: ${market.name}, page: ${page}, delayTime: ${delayTime}`);
        await CommonUtil.delay(delayTime);
      }
    }
    return stockList;
  }
}

const crawlerStockList = new StockListCrawler();

crawlerStockList.crawler();
