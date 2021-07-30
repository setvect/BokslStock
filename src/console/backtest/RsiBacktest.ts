import StockUtil from "@/util/stock-util";

import * as moment from "moment";
import Config from "@/config/default";
import CommonUtil from "@/util/common-util";
import * as _ from "lodash";
import * as Excel from "exceljs";
import { StockItem, BaseCondition, Trade } from "./BacktestType";
import CrawlerHttp from "../crawler/CrawlerHttp";
import { GenericObject } from "frontend/src/api/types";

/**
 * RSI 백테스트
 */
class RsiBacktest {
  async test(condition: RsiCondition) {
    // 1. 데이터 블러오기
    const text = await CommonUtil.readTextFile(this.getFilePath(condition.stock));
    const priceObject: Array<[string, number, number, number, number]> = JSON.parse(text);
    priceObject.splice(0, 1);

    // 2. 데이터 가공
    const initClosePrice = priceObject[0][4];
    const marketPriceList: RsiStockPrice[] = priceObject.map(
      (p): RsiStockPrice => {
        return {
          date: p[0],
          open: p[1],
          high: p[2],
          low: p[3],
          close: p[4],
          gain: CommonUtil.getYield(p[4], initClosePrice),
          rsi: 0,
          uperMarket: false,
          ma: {},
          trade: {},
        };
      },
    );
    const closePrice = marketPriceList.map((p) => p.close);

    const maList = [200];

    for (let i = 0; i < marketPriceList.length; i++) {
      const price = marketPriceList[i];

      for (const maSize of maList) {
        if (i >= maSize - 1) {
          const priceHistory = closePrice.slice(i - (maSize - 1), i + 1);
          price.ma[maSize + ""] = _.mean(priceHistory);
        }
      }
    }

    // 3. 분석
    const account = {
      cash: condition.cash,
      qty: 0,
      unitPrice: 0,
      buyCount: 0,
    };

    const formStr = moment(condition.start).format("YYYYMMDD");
    const endStr = moment(condition.end).format("YYYYMMDD");

    const resultAcc: RsiStockPrice[] = [];
    let historyValue = [];

    for (let i = 0; i < marketPriceList.length; i++) {
      const marketPrice = marketPriceList[i];
      const stockPrice = Object.assign(marketPrice, {});
      historyValue.push(stockPrice.close);
      if (historyValue.length >= condition.period) {
        historyValue = historyValue.slice(-(condition.period + 1));
      }

      if (marketPrice.date < formStr || marketPrice.date > endStr) {
        continue;
      }
      const rsi = StockUtil.getRsi(historyValue);
      marketPrice.rsi = rsi;
      marketPrice.uperMarket = marketPrice.ma["200"] <= marketPrice.close;

      // 매수, 또는 추가 매수
      if (rsi <= condition.downturn2 && account.buyCount <= 1 && marketPrice.uperMarket) {
        if (account.unitPrice === 0) {
          account.unitPrice = marketPrice.close;
        } else {
          account.unitPrice = (account.unitPrice + marketPrice.close) / 2;
        }
        const buyRate = account.buyCount === 0 ? 0.5 : 1;

        const qty = Math.floor((account.cash * condition.investRatio * buyRate) / account.unitPrice);
        account.qty += qty;
        account.buyCount++;

        const fee = Math.floor(marketPrice.close * qty * condition.feeRate);
        account.cash = account.cash - account.unitPrice * qty - fee;
        stockPrice.trade = {
          cash: account.cash,
          fee,
          qty: account.qty,
          unitPrice: account.unitPrice,
          gain: 0,
          total: account.cash + account.qty * account.unitPrice,
        };
      }
      // 매수
      else if (rsi <= condition.downturn1 && account.buyCount === 0 && marketPrice.uperMarket) {
        account.unitPrice = marketPrice.close;
        const qty = Math.floor((account.cash * condition.investRatio * 0.5) / account.unitPrice);
        account.qty = qty;
        account.buyCount++;

        const fee = Math.floor(marketPrice.close * qty * condition.feeRate);
        account.cash = account.cash - account.unitPrice * qty - fee;
        stockPrice.trade = {
          cash: account.cash,
          fee,
          qty: account.qty,
          unitPrice: account.unitPrice,
          gain: 0,
          total: account.cash + account.qty * account.unitPrice,
        };
      }
      // 매도 체크
      else if ((rsi >= condition.upturn && account.buyCount !== 0) || (account.buyCount !== 0 && !marketPrice.uperMarket)) {
        // 종가 매매
        const fee = Math.floor(marketPrice.close * account.qty * condition.feeRate);
        const gain = CommonUtil.getYield(marketPrice.close, account.unitPrice);

        account.cash = account.cash + marketPrice.close * account.qty - fee;
        account.qty = 0;
        account.unitPrice = 0;

        stockPrice.trade = {
          cash: account.cash,
          fee,
          qty: account.qty,
          unitPrice: account.unitPrice,
          buyPrice: marketPrice.close,
          gain,
          total: account.cash + account.qty * account.unitPrice,
        };
        account.buyCount = 0;
      }

      if (Object.keys(stockPrice.trade).length === 0) {
        stockPrice.trade = {
          cash: account.cash,
          fee: 0,
          qty: account.qty,
          unitPrice: account.unitPrice,
          buyPrice: 0,
          gain: 0,
          total: account.cash + account.qty * account.unitPrice,
        };
      }

      stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
      resultAcc.push(stockPrice);
      resultAcc[resultAcc.length - 1].gain = CommonUtil.getYield(resultAcc[resultAcc.length - 1].close, resultAcc[0].close);
    }

    // 4.결과 저장(excel)
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("종목");
    worksheet.columns = [
      { header: "날짜", key: "date" },
      { header: "시가", key: "open", style: { numFmt: "###,###" } },
      { header: "고가", key: "high", style: { numFmt: "###,###" } },
      { header: "저가.", key: "low", style: { numFmt: "###,###" } },
      { header: "종가", key: "close", style: { numFmt: "###,###" } },
      { header: "수익률", key: "gain", style: { numFmt: "0.00%" } },
      { header: "이동평균(200)", key: "ma_120", style: { numFmt: "###,###" } },
      { header: "대세 상승", key: "uperMarket" },
      { header: "RSI", key: "rsi", style: { numFmt: "0.00%" } },
      { header: "수량", key: "trade_qty", style: { numFmt: "###,###" } },
      { header: "매입평균가", key: "trade_unitPrice", style: { numFmt: "###,###" } },
      { header: "매도평균가", key: "trade_buyPrice", style: { numFmt: "###,###" } },
      { header: "수수료", key: "fee", style: { numFmt: "###,###" } },
      { header: "실현수익", key: "trade_gain", style: { numFmt: "0.00%" } },
      { header: "현금", key: "trade_cash", style: { numFmt: "###,###" } },
      { header: "통합 금액", key: "trade_total", style: { numFmt: "###,###" } },
      { header: "통합수익률", key: "total_gain", style: { numFmt: "0.00%" } },
    ];

    for (const marketPrice of resultAcc) {
      const row = {
        date: marketPrice["date"],
        open: marketPrice["open"],
        high: marketPrice["high"],
        low: marketPrice["low"],
        close: marketPrice["close"],
        gain: marketPrice["gain"],
        ma_120: marketPrice.ma["200"],
        rsi: marketPrice.rsi,
        uperMarket: marketPrice.uperMarket,
        trade_qty: marketPrice.trade.qty,
        trade_unitPrice: marketPrice.trade.unitPrice,
        trade_buyPrice: marketPrice.trade.buyPrice,
        fee: marketPrice.trade.fee,
        trade_gain: marketPrice.trade.gain,
        trade_cash: marketPrice.trade.cash,
        trade_total: marketPrice.trade.total,
        total_gain: marketPrice.trade.totalGain,
      };
      worksheet.addRow(row);
    }

    worksheet.addRow([]);
    worksheet.addRow([null, "------------"]);
    const diffDays = moment(condition.end).diff(moment(condition.start), "days");
    console.log("resultAcc.length :>> ", resultAcc.length);
    console.log("resultAcc[resultAcc.length - 1 :>> ", resultAcc[resultAcc.length - 1]);
    const gain = resultAcc[resultAcc.length - 1].gain;
    const mdd = CommonUtil.getMdd(resultAcc.map((p) => p.close));
    const cagr = CommonUtil.getCagr(1, gain + 1, diffDays);

    const gainResult = [null, "수익률", Math.round(gain * 100 * 100) / 100 + "%"];
    const mddResult = [null, "MDD", Math.round(mdd * 100 * 100) / 100 + "%"];
    const cagrResult = [null, "CAGR", Math.round(cagr * 100 * 100) / 100 + "%"];
    worksheet.addRow(gainResult);
    worksheet.addRow(mddResult);
    worksheet.addRow(cagrResult);
    worksheet.addRow([null, "------------"]);

    const sGain = resultAcc[resultAcc.length - 1].trade.totalGain;
    const sCagr = CommonUtil.getCagr(1, sGain + 1, diffDays);
    const sMdd = CommonUtil.getMdd(resultAcc.filter((p) => p.trade.total).map((p) => p.trade.total));
    const sTradeCount = resultAcc.filter((p) => p.trade.buyPrice).length;
    const sWinCount = resultAcc.filter((p) => p.trade.gain > 0).length;

    const sGainResult = [null, "전략 수익률", Math.round(sGain * 100 * 100) / 100 + "%"];
    const sMddResult = [null, "전략 MDD", Math.round(sMdd * 100 * 100) / 100 + "%"];
    const sCagrResult = [null, "전략 CAGR", Math.round(sCagr * 100 * 100) / 100 + "%"];
    const sTradeCountResult = [null, "전략 매매횟수", sTradeCount];
    const sTradeWinRateResult = [null, "전략 승률", Math.round((sWinCount / sTradeCount) * 100 * 100) / 100 + "%"];

    worksheet.addRow(sGainResult);
    worksheet.addRow(sMddResult);
    worksheet.addRow(sCagrResult);
    worksheet.addRow(sTradeCountResult);
    worksheet.addRow(sTradeWinRateResult);

    console.log(gainResult);
    console.log(mddResult);
    console.log(cagrResult);
    console.log(sGainResult);
    console.log(sMddResult);
    console.log(sCagrResult);
    console.log(sTradeCountResult);
    console.log(sTradeWinRateResult);

    worksheet.eachRow((row, rIdx) => {
      row.eachCell((cell, cIdx) => {
        let color = "cccccc";
        if (7 <= cIdx && cIdx <= 9) {
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

    await workbook.xlsx.writeFile(Config.report.file.rsiBacktest);
  }

  private getFilePath(stock: { code: string; name: string }): string {
    return Config.crawling.dir.marketPrice + "/" + `${stock.code}_${stock.name}.json`;
  }

  async crawler(stock: StockItem) {
    const START = "20010101";
    const END = moment().format("YYYYMMDD");

    const priceArray = await CrawlerHttp.getMakretPrice(stock.code, START, END);
    await CommonUtil.saveObjectToJson(priceArray, Config.crawling.dir.marketPrice + "/" + `${stock.code}_${stock.name}.json`);
    const delayTime = 500 + Math.random() * 1000;
    console.log(`code: ${stock.code}, name: ${stock.name}, delayTime: ${delayTime}`);
  }
}

export type RsiStockPrice = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  // 초기 값 기준 수익률
  gain: number;
  rsi: number;
  uperMarket: boolean;
  ma?: GenericObject;
  trade?: Trade;
};

export type RsiCondition = {
  period: number;
  // 과열 구간
  upturn: number;
  // 침체1 구간
  downturn1: number;
  // 침체2 구간
  downturn2: number;
  // 첫번째 매매 비율
  firstRatio: number;
} & BaseCondition;

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

const baseCondition: RsiCondition = {
  stock: targetStock[0],
  cash: 10_000_000,
  feeRate: 0.00015,
  investRatio: 1,
  start: new Date(2002, 0, 1),
  end: new Date(2021, 6, 30),
  period: 4,
  upturn: 0.55,
  downturn1: 0.3,
  downturn2: 0.25,
  firstRatio: 0.5,
};

const backtest = new RsiBacktest();
backtest.test(baseCondition);

// backtest.crawler(targetStock[0]);
