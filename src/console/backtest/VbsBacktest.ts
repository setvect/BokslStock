import * as moment from "moment";
import Config from "@/config/default";
import CommonUtil from "@/util/common-util";
import * as _ from "lodash";
import * as Excel from "exceljs";
import { StockItem } from "./BacktestType";
import CrawlerHttp from "../crawler/CrawlerHttp";

/**
 * 변동성 돌파전략 백테스트
 */
class VbsBacktest {
  async backtest(condition: VbsCondition) {
    // 1. 데이터 블러오기
    const stockByPrice: StockCodeByPrice[] = await _.chain(condition.stockList)
      .reduce(async (promise: Promise<StockCodeByPrice[]>, stock: StockItem) => {
        const text = await CommonUtil.readTextFile(this.getFilePath(stock));
        const priceObject: Array<[string, number, number, number, number]> = JSON.parse(text);
        priceObject.splice(0, 1);

        // 2. 데이터 가공
        const marketPriceList: VbsStockPrice[] = this.makeVbsStockPrice(priceObject);
        const dateByIndex = {};

        const closePrice = marketPriceList.map((p) => p.close);
        for (let i = 0; i < marketPriceList.length; i++) {
          dateByIndex[marketPriceList[i].date] = i;
          // 각 주가의 이동평균 구하기
          for (const maSize of condition.ma) {
            if (i >= maSize - 1) {
              const priceHistory = closePrice.slice(i - (maSize - 1), i + 1);
              marketPriceList[i].ma[maSize + ""] = _.mean(priceHistory);
            }
          }
        }

        const acc = await promise.then();
        acc.push({
          stock: stock,
          price: marketPriceList,
          priceByDateIndex: dateByIndex,
        });
        return Promise.resolve(acc);
      }, Promise.resolve([]))
      .value();

    // 3. 분석
    const [resultAcc, stockStartEndPrice] = this.analysis(condition, stockByPrice);

    // 4.결과 저장(excel)
    const summary = await this.makeReport(condition, resultAcc, stockStartEndPrice);
    return summary;
  }

  /**
   * 데이터 가공
   * @param priceObject
   */
  private makeVbsStockPrice(priceObject: Array<[string, number, number, number, number]>) {
    const initClosePrice = priceObject[0][4];
    const marketPriceList: VbsStockPrice[] = priceObject.map(
      (p): VbsStockPrice => {
        return {
          date: p[0],
          open: p[1],
          high: p[2],
          low: p[3],
          close: p[4],
          gain: CommonUtil.getYield(p[4], initClosePrice),
          targetPrice: Number.MAX_VALUE,
          targetPriceFormula: "",
          isMaUpper: false,
          trade: {},
          ma: {},
        };
      },
    );
    return marketPriceList;
  }

  /**
   * 분석
   * @param condition 조건
   * @param codeByPrice 종목별 시세 데이터
   */
  private analysis(condition: VbsCondition, codeByPrice: StockCodeByPrice[]): [VbsStockPrice[], StockStartEndPrice] {
    const account: Account = {
      cash: condition.cash,
      buyStock: _.chain(condition.stockList)
        .reduce((acc, stock) => {
          acc[stock.code] = {
            qty: 0,
            buyPrice: 0,
          };
          return acc;
        }, {})
        .value(),
    };

    let start = moment(condition.start);
    const end = moment(condition.end);
    const resultAcc: VbsStockPrice[] = [];
    const stockByStartEndPrice: StockStartEndPrice = {};

    while (start <= end) {
      const currentDate = moment(start).format("YYYYMMDD");
      // 종목별 날짜별 종가 정보 얻기
      for (const stockByPrice of codeByPrice) {
        const idx = stockByPrice.priceByDateIndex[currentDate];
        if (!idx) {
          continue;
        }
        let stockPriceRate = stockByStartEndPrice[stockByPrice.stock.code];
        const closePrice = stockByPrice.price[idx].close;
        // 각 종목마다 시작가격 등록
        if (!stockPriceRate) {
          stockByStartEndPrice[stockByPrice.stock.code] = {
            stock: stockByPrice.stock,
            startPrice: stockByPrice.price[idx].open,
            closePrice: [],
            rate: [],
          };
        }

        stockPriceRate = stockByStartEndPrice[stockByPrice.stock.code];
        stockPriceRate.closePrice.push(closePrice);
        // 최초 시가와 비교하여 수익률을 계산
        stockPriceRate.rate.push(CommonUtil.getYield(closePrice, stockPriceRate.startPrice));
      }

      // 동일비중 평균 수익률
      const meanGain = _.chain(Object.keys(stockByStartEndPrice))
        .map((stockCode) => {
          return stockByStartEndPrice[stockCode].rate[stockByStartEndPrice[stockCode].rate.length - 1];
        })
        .mean()
        .value();

      let isTrade = false;
      let isOpenMarket = false;

      for (const stockByPrice of codeByPrice) {
        const idx = stockByPrice.priceByDateIndex[currentDate];
        if (!idx) {
          continue;
        }
        isOpenMarket = true;

        const currentPrice = stockByPrice.price[idx];
        const beforePrice = stockByPrice.price[idx - 1];
        // 목표가
        // 오늘 시가 + (전날 고가 - 전날 저가) * 변동성 비율
        const targetPrice = currentPrice.open + (beforePrice.high - beforePrice.low) * condition.k;
        const stockCode = stockByPrice.stock.code;

        const buyStock = account.buyStock[stockCode];

        // 전날 이동평균이 전날 종가보다 위에 있는지 체크
        currentPrice.isMaUpper = true;
        for (const maDay of condition.ma) {
          // console.log(`${currentDate} ${stockByPrice.stock.name}[${maDay}] ${beforePrice.ma[maDay]}:${beforePrice.close}`);
          if (beforePrice.ma[maDay] > beforePrice.close) {
            currentPrice.isMaUpper = false;
            break;
          }
        }

        // 매도 체크(전날 매수를 했을 경우)
        if (buyStock.qty !== 0) {
          // 그날 시가 매도
          const fee = Math.floor(currentPrice.open * buyStock.qty * condition.feeRate);
          const gain = CommonUtil.getYield(currentPrice.open, buyStock.buyPrice);

          const gainPrice = buyStock.qty * currentPrice.open - buyStock.qty * buyStock.buyPrice;

          account.cash = account.cash + currentPrice.open * buyStock.qty - fee;
          buyStock.qty = 0;
          buyStock.buyPrice = 0;

          const stockPrice = _.cloneDeep(currentPrice);
          stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
          stockPrice.targetPrice = 0;

          const totalBuyPrice: number = this.getTotalBuyPrice(account);

          stockPrice.trade = {
            weightGain: meanGain,
            weightRate: 1 + meanGain,
            action: "SELL",
            cash: account.cash,
            stock: stockByPrice.stock,
            fee,
            qty: buyStock.qty,
            buyPrice: buyStock.buyPrice,
            sellPrice: currentPrice.open,
            gain,
            gainPrice: gainPrice,
            total: account.cash + totalBuyPrice,
          };
          stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
          resultAcc.push(stockPrice);
          resultAcc[resultAcc.length - 1].gain = CommonUtil.getYield(resultAcc[resultAcc.length - 1].open, resultAcc[0].open);
          isTrade = true;
        }

        // 매수 체크
        if (buyStock.qty === 0) {
          const stockPrice = _.cloneDeep(currentPrice);
          stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
          stockPrice.targetPrice = targetPrice;
          stockPrice.targetPriceFormula = `${currentPrice.open} + (${beforePrice.high} - ${beforePrice.low}) * ${condition.k}`;

          // 변동성 돌파 여부
          const isVb = currentPrice.high > stockPrice.targetPrice;

          if (isVb && currentPrice.isMaUpper) {
            // 정해진 목표가 매수
            buyStock.buyPrice = stockPrice.targetPrice;
            buyStock.qty = Math.floor((account.cash * condition.investRatio * this.getBuyRate(account)) / buyStock.buyPrice);

            const totalBuyPrice: number = this.getTotalBuyPrice(account);
            const fee = Math.floor(buyStock.buyPrice * buyStock.qty * condition.feeRate);
            account.cash = account.cash - buyStock.buyPrice * buyStock.qty - fee;
            stockPrice.trade = {
              weightGain: meanGain,
              weightRate: 1 + meanGain,
              action: "BUY",
              cash: account.cash,
              stock: stockByPrice.stock,
              fee,
              qty: buyStock.qty,
              buyPrice: buyStock.buyPrice,
              sellPrice: 0,
              gain: 0,
              gainPrice: 0,
              total: account.cash + totalBuyPrice,
            };
            stockPrice.trade.totalGain = CommonUtil.getYield(stockPrice.trade.total, condition.cash);
            resultAcc.push(stockPrice);
            resultAcc[resultAcc.length - 1].gain = CommonUtil.getYield(resultAcc[resultAcc.length - 1].close, resultAcc[0].close);
            isTrade = true;
          }
        }
      }

      // 해당 날짜에 매수/매도가 없는 경우 동일가중 정보를 채워 준다
      if (!isTrade && isOpenMarket) {
        const currentPrice: VbsStockPrice = {
          date: currentDate,
          open: 0,
          high: 0,
          low: 0,
          close: 0,
          gain: 0,
          targetPrice: 0,
          targetPriceFormula: "",
          isMaUpper: null,
          trade: {
            weightGain: meanGain,
            weightRate: 1 + meanGain,
            action: "BUY",
            cash: account.cash,
            stock: {
              code: "",
              name: "동일가중",
            },
            fee: 0,
            qty: 0,
            buyPrice: 0,
            sellPrice: 0,
            gain: 0,
            gainPrice: 0,
            total: account.cash,
            totalGain: CommonUtil.getYield(account.cash, condition.cash),
          },
        };
        resultAcc.push(currentPrice);
      }

      start = start.add(1, "days");
    }
    return [resultAcc, stockByStartEndPrice];
  }

  /**
   * 매수 가격 구함
   * @param account
   */
  private getTotalBuyPrice(account: Account): number {
    return _.chain(Object.keys(account.buyStock))
      .map((p) => account.buyStock[p].buyPrice * account.buyStock[p].qty)
      .sum()
      .value();
  }

  /**
   * 매수 비율
   * 예를 들어 매수 대상 종목이 5개이고 현재 2개 종목을 매수 하였다면
   * 다음 종목 매수 금액은 현재 가지고 있는 현금에서 3/5 만큼 매수한다.
   * @param account
   */
  private getBuyRate(account: Account): number {
    const keys = Object.keys(account.buyStock);
    const buyCount = keys.filter((p) => account.buyStock[p].qty > 0).length;
    return (buyCount + 1) / keys.length;
  }

  /**
   * 엑레 리포트 만듦
   * @param condition 조건
   * @param resultAcc 매매 이력
   * @param stockByStartEndPrice 각 종목별 시작, 종료 가격 정보
   */
  private async makeReport(condition: VbsCondition, resultAcc: VbsStockPrice[], stockByStartEndPrice: StockStartEndPrice): Promise<Summary> {
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet("종목");
    worksheet.columns = [
      { header: "날짜", key: "date" },
      { header: "종목", key: "stock" },
      { header: "시가", key: "open", style: { numFmt: "###,###" } },
      { header: "고가", key: "high", style: { numFmt: "###,###" } },
      { header: "저가", key: "low", style: { numFmt: "###,###" } },
      { header: "종가", key: "close", style: { numFmt: "###,###" } },
      { header: "동일비중 수익률", key: "weight_gain", style: { numFmt: "0.00%" } },
      { header: "동일비중 수익비", key: "weight_rate", style: { numFmt: "###,###.00" } },
      { header: "목표가 계산식", key: "target_price_formula", style: { numFmt: "###,###" } },
      { header: "이동평균 돌파 여부", key: "ma_vb" },
      { header: "목표가", key: "target_price", style: { numFmt: "###,###" } },
      { header: "매매여부", key: "action", style: { alignment: { horizontal: "center" } } },
      { header: "수량", key: "trade_qty", style: { numFmt: "###,###" } },
      { header: "매입가", key: "trade_buyPrice", style: { numFmt: "###,###" } },
      { header: "매도가", key: "trade_sellPrice", style: { numFmt: "###,###" } },
      { header: "수수료", key: "fee", style: { numFmt: "###,###" } },
      { header: "실현수익률(수수료 X)", key: "trade_gain", style: { numFmt: "0.00%" } },
      { header: "수익금(수수료 X)", key: "price_gain", style: { numFmt: "###,###" } },
      { header: "현금", key: "trade_cash", style: { numFmt: "###,###" } },
      { header: "통합 금액", key: "trade_total", style: { numFmt: "###,###" } },
      { header: "전략 수익률", key: "total_gain", style: { numFmt: "0.00%" } },
      { header: "전략 수익비", key: "total_gain_rate", style: { numFmt: "###,###.00" } },
    ];

    for (const marketPrice of resultAcc) {
      const row = {
        date: marketPrice["date"],
        stock: `${marketPrice.trade.stock.name}(${marketPrice.trade.stock.code})`,
        open: marketPrice["open"],
        high: marketPrice["high"],
        low: marketPrice["low"],
        close: marketPrice["close"],
        weight_gain: marketPrice.trade.weightGain,
        weight_rate: marketPrice.trade.weightRate,
        target_price_formula: marketPrice.targetPriceFormula,
        ma_vb: marketPrice.isMaUpper,
        target_price: marketPrice.targetPrice,
        action: marketPrice.trade.action,
        trade_qty: marketPrice.trade.qty,
        trade_buyPrice: marketPrice.trade.buyPrice,
        trade_sellPrice: marketPrice.trade.sellPrice,
        fee: marketPrice.trade.fee,
        trade_gain: marketPrice.trade.gain,
        price_gain: marketPrice.trade.gainPrice,
        trade_cash: marketPrice.trade.cash,
        trade_total: marketPrice.trade.total,
        total_gain: marketPrice.trade.totalGain,
        total_gain_rate: 1 + marketPrice.trade.totalGain,
      };
      worksheet.addRow(row);
    }

    const diffDays = moment(condition.end).diff(condition.start, "days");

    worksheet.addRow([]);
    worksheet.addRow([null, `----- 동일비중 주가 -----`]);
    const gain = resultAcc[resultAcc.length - 1].trade.weightGain;
    const mdd = CommonUtil.getMdd(resultAcc.map((p) => p.trade.weightRate));
    const cagr = CommonUtil.getCagr(1, gain + 1, diffDays);

    const gainResult = [null, "수익률", Math.round(gain * 100 * 100) / 100 + "%"];
    const mddResult = [null, "MDD", Math.round(mdd * 100 * 100) / 100 + "%"];
    const cagrResult = [null, "CAGR", Math.round(cagr * 100 * 100) / 100 + "%"];

    console.log(gainResult);
    console.log(mddResult);
    console.log(cagrResult);

    worksheet.addRow(gainResult);
    worksheet.addRow(mddResult);
    worksheet.addRow(cagrResult);

    worksheet.addRow([null, `----- 기준 주가 -----`]);
    const stockGain = [];

    for (const key in stockByStartEndPrice) {
      const stockPrice = stockByStartEndPrice[key];

      worksheet.addRow([null, `: ${stockPrice.stock.name}(${stockPrice.stock.code})`]);
      const gain = CommonUtil.getYield(stockPrice.closePrice[stockPrice.closePrice.length - 1], stockPrice.startPrice);
      const cagr = CommonUtil.getCagr(1, gain + 1, diffDays);
      stockGain.push(gain);
      const gainResult = [null, "수익률", Math.round(gain * 100 * 100) / 100 + "%"];
      const cagrResult = [null, "CAGR", Math.round(cagr * 100 * 100) / 100 + "%"];

      console.log(`--- ${stockPrice.stock.name}(${stockPrice.stock.code})`);
      console.log(gainResult);
      console.log(cagrResult);

      worksheet.addRow(gainResult);
      worksheet.addRow(cagrResult);
    }

    const sGain = resultAcc[resultAcc.length - 1].trade.totalGain;
    const sCagr = CommonUtil.getCagr(1, sGain + 1, diffDays);
    const sMdd = CommonUtil.getMdd(resultAcc.filter((p) => p.trade.total).map((p) => p.trade.total));
    const sTradeCount = resultAcc.filter((p) => p.trade.sellPrice).length;
    const sWinCount = resultAcc.filter((p) => p.trade.gain > 0).length;

    worksheet.addRow([null, `----- 전략결과 -----`]);
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

    worksheet.addRow([null, `----- 조건 -----`]);
    worksheet.addRow([null, "기간", `${resultAcc[0].date} ~ ${resultAcc[resultAcc.length - 1].date}`]);
    worksheet.addRow([null, "시작현금", `${CommonUtil.toComma(condition.cash)}원`]);
    worksheet.addRow([null, "투자비율", `${condition.investRatio * 100}%`]);
    worksheet.addRow([null, "수수료", `${condition.feeRate * 100}%`]);
    worksheet.addRow([null, "K", `${condition.k}`]);
    worksheet.addRow([null, "이동평균", `${condition.ma}`]);

    // 결과 출력
    console.log("----- 전략결과 -----");
    console.log(sGainResult);
    console.log(sMddResult);
    console.log(sCagrResult);
    console.log(sTradeCountResult);
    console.log(sTradeWinRateResult);

    worksheet.eachRow((row, rIdx) => {
      row.eachCell((cell, cIdx) => {
        let color = "cccccc";
        if (8 <= cIdx && cIdx <= 9) {
          color = "00eeee";
        } else if (10 <= cIdx && cIdx <= 20) {
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

    const stockBundleName = condition.stockList.map((p) => `${p.name}(${p.code})`).join("_");
    const pattern = ` ${stockBundleName}_${resultAcc[0].date}-${resultAcc[resultAcc.length - 1].date}`;
    await workbook.xlsx.writeFile(CommonUtil.replaceAll(Config.report.file.vbsBacktest, "{pattern}", pattern));

    const gGain = _.mean(stockGain);
    const summary: Summary = {
      market: {
        gain: gGain,
        mdd: mdd,
        cagr: CommonUtil.getCagr(1, gGain + 1, diffDays),
      },
      strategy: {
        gain: sGain,
        mdd: sMdd,
        cagr: sCagr,
        tradeCount: sTradeCount,
        winCount: sWinCount,
      },
      resultHistory: resultAcc,
    };
    return summary;
  }
  async crawler(stock: StockItem) {
    const START = "20010101";
    const END = moment().format("YYYYMMDD");

    const priceArray = await CrawlerHttp.getMakretPrice(stock.code, START, END);
    await CommonUtil.saveObjectToJson(priceArray, Config.crawling.dir.marketPrice + "/" + `${stock.code}_${stock.name}.json`);
    const delayTime = 500 + Math.random() * 1000;
    console.log(`code: ${stock.code}, name: ${stock.name}, delayTime: ${delayTime}`);
  }

  private getFilePath(stock: { code: string; name: string }): string {
    return Config.crawling.dir.marketPrice + "/" + `${stock.code}_${stock.name}.json`;
  }
}

type VbsStockPrice = {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  // 초기 값 기준 수익률
  gain: number;
  targetPrice: number;
  // 목표가 계산식
  targetPriceFormula: string;
  // 이동평균 돌파 여부
  isMaUpper: boolean;
  ma?: { [key: string]: number };
  trade?: Trade;
};

type Trade = {
  // 동일 비중 수익률
  weightGain?: number;
  // 동일 비중 수익비
  weightRate?: number;
  qty?: number;
  // 매수단가
  buyPrice?: number;
  // 매도단가
  sellPrice?: number;
  // 거래 종목
  stock?: StockItem;
  // 거래 수수료
  fee?: number;
  cash?: number;
  // 수익률
  gain?: number;
  // 수익금
  gainPrice?: number;
  total?: number;
  // 전체 수익금
  totalGain?: number;
  // 매수, 매도, 매매 하지 않음
  action?: "BUY" | "SELL" | "-";
};

type VbsCondition = {
  // 변동성 비율
  k: number;
  stockList: StockItem[];
  cash: number;
  feeRate: number;
  investRatio: number;
  start: Date;
  end: Date;
  // 이동평균
  // 현재가가 해당 이동평균(들)보다 높아야 매수
  ma: number[];
  comment?: string;
};

type Summary = {
  market: {
    gain: number;
    mdd: number;
    cagr: number;
  };
  strategy: {
    gain: number;
    mdd: number;
    cagr: number;
    tradeCount: number;
    winCount: number;
  };
  resultHistory: VbsStockPrice[];
  condtion?: VbsCondition;
};

type StockCodeByPrice = {
  stock: StockItem;
  price: VbsStockPrice[];
  // 날짜(yyyyMMdd) 기준, 해당 값을 담고 있는 인덱스 번호
  priceByDateIndex: { [key: string]: number };
};

/**
 * 매수 정보
 */
type Account = {
  cash: number;
  buyStock: {
    // Key: 종목 코드
    [key: string]: {
      qty: number;
      buyPrice: number;
    };
  };
};

type StockStartEndPrice = {
  [key: string]: {
    stock: StockItem;
    // 해당종목 최초 시가
    startPrice: number;
    // 대상종목 종가
    closePrice: number[];
    // 전일과 비교하여 변동률
    rate: number[];
  };
};

const targetStock: StockItem[] = [
  // start 2003.02
  // {
  //   code: "069500",
  //   name: "KODEX 200",
  // },
  // start 2010.03
  {
    code: "122630",
    name: "KODEX 레버리지",
  },
  // start 2015.11
  // {
  //   code: "229200",
  //   name: "KODEX 코스닥 150",
  // },
  // start 2016.01
  {
    code: "233740",
    name: "KODEX 코스닥150 레버리지",
  },
  // start 2009.12
  // {
  //   code: "114800",
  //   name: "KODEX 인버스",
  // },
  // // start 2016.10
  // {
  //   code: "252670",
  //   name: "KODEX 200선물인버스2X",
  // },
  // start 2014.2
  // {
  //   code: "192090",
  //   name: "TIGER 차이나CSI300",
  // },
  // // start 19970102
  // {
  //   code: "A00001",
  //   name: "spy",
  // },
  // // // start 20000103
  // {
  //   code: "A00002",
  //   name: "qqq",
  // },
  // start 20100211
  // {
  //   code: "A00003",
  //   name: "tqqq",
  // },
];

async function baktest() {
  const baseCondition: VbsCondition = {
    stockList: targetStock,
    cash: 10_000_000,
    feeRate: 0.0002,
    investRatio: 0.99,
    start: new Date(2002, 1, 1),
    end: new Date(2021, 6, 31),
    ma: [1],
    k: 0.5,
  };

  const rangeList = [
    // { start: new Date(2000, 1 - 1, 1), end: new Date(2021, 12 - 1, 31) },
    // { start: new Date(2010, 1 - 1, 1), end: new Date(2021, 12 - 1, 31) },
    // { start: new Date(2000, 1 - 1, 1), end: new Date(2000, 12 - 1, 31) },
    // { start: new Date(2001, 1 - 1, 1), end: new Date(2001, 12 - 1, 31) },
    // { start: new Date(2002, 1 - 1, 1), end: new Date(2002, 12 - 1, 31) },
    // { start: new Date(2003, 1 - 1, 1), end: new Date(2003, 12 - 1, 31) },
    // { start: new Date(2004, 1 - 1, 1), end: new Date(2004, 12 - 1, 31) },
    // { start: new Date(2005, 1 - 1, 1), end: new Date(2005, 12 - 1, 31) },
    // { start: new Date(2006, 1 - 1, 1), end: new Date(2006, 12 - 1, 31) },
    // { start: new Date(2007, 1 - 1, 1), end: new Date(2007, 12 - 1, 31) },
    // { start: new Date(2008, 1 - 1, 1), end: new Date(2008, 12 - 1, 31) },
    // { start: new Date(2009, 1 - 1, 1), end: new Date(2009, 12 - 1, 31) },
    // { start: new Date(2010, 1 - 1, 1), end: new Date(2010, 12 - 1, 31) },
    // { start: new Date(2011, 1 - 1, 1), end: new Date(2011, 12 - 1, 31) },
    // { start: new Date(2012, 1 - 1, 1), end: new Date(2012, 12 - 1, 31) },
    // { start: new Date(2013, 1 - 1, 1), end: new Date(2013, 12 - 1, 31) },
    // { start: new Date(2014, 1 - 1, 1), end: new Date(2014, 12 - 1, 31) },
    // { start: new Date(2015, 1 - 1, 1), end: new Date(2015, 12 - 1, 31) },
    { start: new Date(2016, 1 - 1, 1), end: new Date(2021, 7 - 1, 31) },
    // { start: new Date(2016, 1 - 1, 1), end: new Date(2016, 12 - 1, 31) },
    // { start: new Date(2017, 1 - 1, 1), end: new Date(2017, 12 - 1, 31) },
    // { start: new Date(2018, 1 - 1, 1), end: new Date(2018, 12 - 1, 31) },
    // { start: new Date(2019, 1 - 1, 1), end: new Date(2019, 12 - 1, 31) },
    // { start: new Date(2020, 1 - 1, 1), end: new Date(2020, 12 - 1, 31) },
    // { start: new Date(2021, 1 - 1, 1), end: new Date(2021, 7 - 1, 31) },
  ];

  const backtest = new VbsBacktest();
  const summaryList: Summary[] = [];
  for (const range of rangeList) {
    baseCondition.start = range.start;
    baseCondition.end = range.end;

    const summary = await backtest.backtest(baseCondition);
    summary.condtion = _.cloneDeep(baseCondition);
    summaryList.push(summary);
  }

  await makeReportSummary(summaryList);
}
/**
 * 요약 엑셀 리포트
 * @param summaryList
 */
async function makeReportSummary(summaryList: Summary[]) {
  const workbook = new Excel.Workbook();
  const worksheet = workbook.addWorksheet("변동성돌파 전략 요약");
  worksheet.columns = [
    { header: "기간", key: "rnage" },
    { header: "대상종목", key: "market" },
    { header: "시작현금", key: "cash", style: { numFmt: "###,###" } },
    { header: "투자비율", key: "investRatio", style: { numFmt: "0.00%" } },
    { header: "수수료", key: "feeRate", style: { numFmt: "0.000%" } },
    { header: "K", key: "k", style: { numFmt: "0.0" } },
    { header: "이동평균", key: "ma" },
    { header: "조건 설명", key: "comment" },
    { header: "종목 수익률", key: "marketGain", style: { numFmt: "0.00%" } },
    { header: "종목 MDD", key: "marketMdd", style: { numFmt: "0.00%" } },
    { header: "종목 CAGR", key: "marketCagr", style: { numFmt: "0.00%" } },
    { header: "전략 수익률", key: "strategyGain", style: { numFmt: "0.00%" } },
    { header: "전략 MDD", key: "strategyMdd", style: { numFmt: "0.00%" } },
    { header: "전략 CAGR", key: "strategyCagr", style: { numFmt: "0.00%" } },
    { header: "매매회수", key: "strategyTradeCount", style: { numFmt: "###,###" } },
    { header: "승률", key: "strategyTradeWinRate", style: { numFmt: "0.00%" } },
  ];

  for (const summary of summaryList) {
    const condition = summary.condtion;
    const stockBundleName = condition.stockList.map((p) => `${p.name}(${p.code})`).join("_");
    const row = {
      rnage: `${summary.resultHistory[0].date} ~ ${summary.resultHistory[summary.resultHistory.length - 1].date}`,
      market: `${stockBundleName}`,
      cash: condition.cash,
      investRatio: condition.investRatio,
      feeRate: condition.feeRate,
      k: condition.k,
      ma: condition.ma,
      comment: condition.comment || "",
      marketGain: summary.market.gain,
      // TODO
      marketMdd: summary.market.mdd,
      marketCagr: summary.market.cagr,
      strategyGain: summary.strategy.gain,
      strategyMdd: summary.strategy.mdd,
      strategyCagr: summary.strategy.cagr,
      strategyTradeCount: summary.strategy.tradeCount,
      strategyTradeWinRate: summary.strategy.winCount / summary.strategy.tradeCount,
    };
    worksheet.addRow(row);
  }

  worksheet.eachRow((row, rIdx) => {
    row.eachCell((cell, cIdx) => {
      let color = "cccccc";
      if (9 <= cIdx && cIdx <= 11) {
        color = "00eeee";
      } else if (12 <= cIdx && cIdx <= 16) {
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

  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  CommonUtil.applyAutoColumnWith(worksheet);
  await workbook.xlsx.writeFile(Config.report.file.vbsBacktestSummary);
}

async function crawler() {
  const backtest = new VbsBacktest();
  for (const stock of targetStock) {
    await backtest.crawler(stock);
  }
}

// crawler();
baktest();
