import axios, { AxiosResponse } from "axios";
import cheerio from "cheerio";
import CommonUtil from "@/util/common-util";
import iconv = require("iconv-lite");
import { Config } from "@/config";
import { StockItem, MarketList } from "./StockStruct";

class StockListCrawler {
  async crawler() {
    const stockList: StockItem[] = await this.getStokcList();
    CommonUtil.saveObjectToJson(stockList, Config.crawling.file.stockList);
  }

  async getStokcList(): Promise<StockItem[]> {
    const stockList: StockItem[] = [];

    for (const market of MarketList) {
      for (let page = 1; page < 100; page++) {
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

  /**
   * @param page 페이지 번호
   * @returns
   */
  async getStockListPage(marketSeq: number, page: number): Promise<AxiosResponse> {
    return await axios({
      method: "get",
      url: Config.crawling.url.stockList.replace("{marketSeq}", marketSeq.toString()).replace("{page}", page.toString()),
      headers: {
        "User-Agent": Config.crawling.userAgent,
      },
      responseType: "arraybuffer",
    });
  }
}

const crawlerStockList = new StockListCrawler();

crawlerStockList.crawler();
