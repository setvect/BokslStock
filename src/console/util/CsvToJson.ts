import { Config } from "@/config";
import * as fs from "fs";
import { promisify } from "util";
import { StockItem } from "@/console/crawler/StockStruct";
import * as Excel from "exceljs";
import CommonUtil from "@/util/common-util";

/**
 * OHLC로 정보를 가지고 있는 CSV를 JSON으로 변경
 * 주로 외국 주가 정보를 처리 가능한 JSON를 만들기 위함
 */
export class CsvToJson {
  // private baseObject = "historyData[3]";
  private baseObject = "currentIndicator";
  private topItem = 30;
  private cash = 15_000_000;

  async convert(csvPath: string, jsonPath: string) {
    const csvText = await CommonUtil.readTextFile(csvPath, "utf-8");
    const lines = csvText.split("\n");
    const jsonObject = [];
    jsonObject.push(["날짜", "시가", "고가", "저가", "종가", "거래량", "외국인소진율"]);
    lines.splice(0, 1);
    for (const line of lines) {
      const tokens: string[] = line.split(",");
      jsonObject.push([
        CommonUtil.replaceAll(tokens[0], "-", ""),
        parseFloat(tokens[1]),
        parseFloat(tokens[2]),
        parseFloat(tokens[3]),
        parseFloat(tokens[4]),
        parseFloat(tokens[5]),
        0,
      ]);
    }
    await CommonUtil.saveObjectToJson(jsonObject, jsonPath);
  }
}

const exportExcel = new CsvToJson();
exportExcel.convert("./crawler-data/temp/spy-etf.csv", Config.crawling.dir.marketPrice + "A00001_spy.json");
exportExcel.convert("./crawler-data/temp/qqq-etf.csv", Config.crawling.dir.marketPrice + "A00002_qqq.json");
exportExcel.convert("./crawler-data/temp/tqqq-etf.csv", Config.crawling.dir.marketPrice + "A00003_tqqq.json");
