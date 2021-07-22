import * as moment from "moment";
import CrawlerHttp from "./CrawlerHttp";
import Config from "@/config/default";
import CommonUtil from "@/util/common-util";
import { GenericObject } from "@/types/type";
import * as _ from "lodash";
import * as Excel from "exceljs";

const targetStock: StockItem[] = [
  {
    code: "069500",
    name: "KODEX 200",
  },
  {
    code: "122630",
    name: "KODEX 레버리지",
  },
];

type StockItem = {
  code: string;
  name: string;
};

type StockPrice = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  // 초기 값 기준 수익률
  gain: number;
  ma: GenericObject;
};

/**
 * 이동평균선 돌파 백테스트
 */
class MabsBacktest {
  private start = new Date(2003, 1, 1);
  private end = new Date();
  private baseObject = "historyData[2]";
  private topItem = 30;

  async test(stockItem: StockItem) {
    // 1. 데이터 블러오기
    const text = await CommonUtil.readTextFile(this.getFilePath(stockItem));
    const priceObject: Array<[string, number, number, number]> = JSON.parse(text);
    priceObject.splice(0, 1);

    // 2. 데이터 가공
    const initClosePrice = priceObject[0][3];
    const marketPrice = priceObject.map(
      (p): StockPrice => {
        return { date: p[0], open: p[1], high: p[1], low: p[2], close: p[3], gain: CommonUtil.getYield(p[3], initClosePrice), ma: {} };
      },
    );
    const closePrice = marketPrice.map((p) => p.close);

    const maList = [5, 10, 20, 40, 60, 120];

    for (let i = 0; i < marketPrice.length; i++) {
      const price = marketPrice[i];

      for (const maSize of maList) {
        if (i >= maSize - 1) {
          const priceHistory = closePrice.slice(i - (maSize - 1), i + 1);
          price.ma[maSize + ""] = _.mean(priceHistory);
        }
      }
    }

    // 3. 분석

    // 4.결과 저장(excel)
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("종목");
    worksheet.columns = [
      { header: "날짜", key: "date" },
      { header: "시가", key: "open" },
      { header: "고가", key: "high" },
      { header: "저가.", key: "low" },
      { header: "종가", key: "close" },
      { header: "수익률", key: "gain", style: { numFmt: ".00%" } },
      { header: "이동평균(5)", key: "ma_5" },
      { header: "이동평균(10)", key: "ma_10" },
      { header: "이동평균(20)", key: "ma_20" },
      { header: "이동평균(40)", key: "ma_40" },
      { header: "이동평균(60)", key: "ma_60" },
      { header: "이동평균(120)", key: "ma_120" },
    ];

    for (const price of marketPrice) {
      const row = {
        date: price["date"],
        open: price["open"],
        high: price["high"],
        low: price["low"],
        close: price["close"],
        gain: price["gain"],
        ma_5: price.ma["5"],
        ma_10: price.ma["10"],
        ma_20: price.ma["20"],
        ma_40: price.ma["40"],
        ma_60: price.ma["60"],
        ma_120: price.ma["120"],
      };
      worksheet.addRow(row);
    }

    worksheet.eachRow((row, rIdx) => {
      row.eachCell((cell, cIdx) => {
        let color = "cccccc";
        if (7 <= cIdx && cIdx <= 12) {
          color = "eeee00";
        }

        if (rIdx === 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: color },
          };
          cell.font = {
            bold: true,
          };
        }
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // 틀고정
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    CommonUtil.applyAutoColumnWith(worksheet);

    await workbook.xlsx.writeFile(Config.report.file.mabsBacktest);
  }

  async saveMarketPrice() {
    for (const stock of targetStock) {
      const formStr = moment(this.start).format("YYYYMMDD");
      const endStr = moment(this.end).format("YYYYMMDD");
      const priceArray = await CrawlerHttp.getMakretPrice(stock.code, formStr, endStr);
      await CommonUtil.saveObjectToJson(priceArray, this.getFilePath(stock));
    }
  }

  private getFilePath(stock: { code: string; name: string }): string {
    return Config.crawling.dir.mabsMarketPrice + "/" + `${stock.code}_${stock.name}.json`;
  }
}

const backtest = new MabsBacktest();

backtest.test(targetStock[0]);
