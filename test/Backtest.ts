import { Config } from "@/config";
import { ExportExcel } from "./ExportExcel";
import CommonUtil from "@/util/common-util";
import * as Excel from "exceljs";
import * as moment from "moment";
import * as _ from "lodash";

const compareStock = {
  code: "069500",
  name: "KODEX 200",
};

/**
 * 백테스트
 */
class Backtest {
  private from = new Date(2021, 3, 1);
  private to = new Date(2021, 6, 16);
  private baseObject = "historyData[2]";
  private topItem = 30;

  // private from = new Date(2020, 3, 1);
  // private to = new Date(2021, 2, 31);
  // private baseObject = "historyData[1]";

  // private from = new Date(2019, 3, 1);
  // private to = new Date(2020, 2, 31);
  // private baseObject = "historyData[0]";

  async test() {
    const exportExcel = new ExportExcel();
    const stockList = await exportExcel.loadStockCompanyList();
    const filterdStockList = exportExcel.filterStock(stockList, this.baseObject);

    // const targetList = filterdStockList.slice(0, this.topItem);
    const targetList = filterdStockList.slice(filterdStockList.length - this.topItem);
    const { stockResult, compareStockResult }: { stockResult: StockItemBacktestResult[]; compareStockResult: StockItemBacktestResult } = await this.backtest(targetList);

    const avgGain = _.meanBy(stockResult, (p) => p.gain);
    console.log("평균수익률 :>> ", CommonUtil.getPercentage(avgGain, 2) + "%");

    compareStockResult.gain = CommonUtil.getYield(compareStockResult.priceHistory[compareStockResult.priceHistory.length - 1][1], compareStockResult.priceHistory[0][1]);
    console.log(`비교 지수 ${compareStockResult.name}(${compareStockResult.code}): ${CommonUtil.getPercentage(compareStockResult.gain, 2)}%`);

    // excel 만들기
    await this.makeReport(compareStockResult, stockResult, avgGain);
  }

  private async makeReport(compareStockResult: StockItemBacktestResult, stockResult: StockItemBacktestResult[], avgGain: number) {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("종목");
    worksheet.columns = [
      { header: `날짜`, key: "date" },
      { header: `${compareStockResult.name}_종가`, key: "base_close" },
      { header: `${compareStockResult.name}_수익률`, key: "base_gain" },
      { header: `합계 수익률`, key: "sum_gain" },
    ];

    let count = 1;
    for (const s of stockResult) {
      worksheet.columns = [
        ...worksheet.columns,
        {
          header: `${s.name}_종가`,
          key: `close_${count}`,
          style: { numFmt: "###,###" },
        },
        { header: `${s.name}_수익률`, key: `gain_${count}`, style: { numFmt: "0.00%" } },
      ];
      count++;
    }

    const gainHistory: number[] = [];
    for (let rIdx = 0; rIdx < compareStockResult.priceHistory.length; rIdx++) {
      const price = compareStockResult.priceHistory[rIdx];
      const gain = CommonUtil.getYield(price[1], compareStockResult.priceHistory[0][1]);
      const row = {
        date: price[0],
        base_close: price[1],
        base_gain: CommonUtil.getPercentage(gain, 2) + "%",
      };
      let count = 1;
      const gainSum: number[] = [];
      for (const s of stockResult) {
        const gain = CommonUtil.getYield(s.priceHistory[rIdx][1], s.priceHistory[0][1]);
        gainSum.push(gain);
        row[`close_${count}`] = s.priceHistory[rIdx][1];
        row[`gain_${count}`] = CommonUtil.getPercentage(gain, 2) + "%";
        count++;
      }
      const avg = _.mean(gainSum);
      gainHistory.push(avg);
      row[`sum_gain`] = CommonUtil.getPercentage(avg, 2) + "%";
      worksheet.addRow(row);
    }

    worksheet.addRow([]);
    worksheet.addRow(["---------------------"]);
    worksheet.addRow(["평균수익률", CommonUtil.getPercentage(avgGain, 2) + "%"]);
    worksheet.addRow(["MDD", CommonUtil.getPercentage(CommonUtil.getMdd(gainHistory), 2) + "%"]);
    worksheet.addRow([`비교 지수 수익률`, `${CommonUtil.getPercentage(compareStockResult.gain, 2)}%`]);
    const comparePriceHistory = compareStockResult.priceHistory.map((p) => p[1]);
    const compareMdd = CommonUtil.getPercentage(CommonUtil.getMdd(comparePriceHistory), 2);
    worksheet.addRow([`비교 지수 MDD`, `${compareMdd}%`]);

    // 스타일
    this.appllyStyle(worksheet);

    await workbook.xlsx.writeFile(Config.report.file.backtest);
  }

  private appllyStyle(worksheet: Excel.Worksheet) {
    worksheet.eachRow((row, rIdx) => {
      row.eachCell((cell, cIdx) => {
        if (rIdx === 1) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "cccccc" },
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
  }

  private async backtest(targetList: import("d:/intellij-project/BokslStock/test/StockStruct").StockItem[]) {
    const stockResult: StockItemBacktestResult[] = [];

    const promises = targetList.map(async (s) => {
      const marketPriceFile = `${Config.crawling.dir.marketPrice}/${s.code}_${s.name}.json`;
      stockResult.push({
        code: s.code,
        name: s.name,
        priceHistory: await this.getPriceList(marketPriceFile, this.from, this.to),
      });
    });
    await Promise.all(promises);

    const marketPriceFile = `${Config.crawling.dir.marketPrice}/${compareStock.code}_${compareStock.name}.json`;
    const compareStockResult: StockItemBacktestResult = {
      code: compareStock.code,
      name: compareStock.name,
      priceHistory: await this.getPriceList(marketPriceFile, this.from, this.to),
    };

    for (const p of stockResult) {
      p.gain = CommonUtil.getYield(p.priceHistory[p.priceHistory.length - 1][1], p.priceHistory[0][1]);
    }
    return { stockResult, compareStockResult };
  }

  async getPriceList(file: string, from: Date, to: Date): Promise<[string, number][]> {
    const formStr = moment(from).format("YYYYMMDD");
    const toStr = moment(to).format("YYYYMMDD");

    const text = await CommonUtil.readTextFile(file);
    const priceObject: [] = JSON.parse(text);

    // priceObject.filter((p) => formStr <= p[0] && p[0] <= toStr).forEach((p) => console.log(p));
    const endPrice: [string, number][] = priceObject.filter((p) => formStr <= p[0] && p[0] <= toStr).map((p) => [p[0], p[4]]);
    return endPrice;
  }
}

type StockItemBacktestResult = {
  code: string;
  name: string;
  gain?: number;
  priceHistory: [string, number][];
};

const backtest = new Backtest();

backtest.test();
