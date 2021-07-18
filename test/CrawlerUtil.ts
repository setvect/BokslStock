import * as fs from "fs";
import { promisify } from "util";
import { Config } from "@/config";
import { StockItem } from "./StockStruct";

export default class CrawlerUtil {
  static async loadStockList() {
    const readFilePromise = promisify(fs.readFile);
    const data = await readFilePromise(Config.crawling.file.stockList, "utf-8");
    const stockList: StockItem[] = JSON.parse(data);
    return stockList;
  }
}
