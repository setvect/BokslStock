const Config = {
  crawling: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    url: {
      // 종목 목록
      stockList: "https://finance.naver.com/sise/sise_market_sum.nhn?sosok={marketSeq}&page={page}",
      // 기업정보: 실시간 PER, 실시간 PBR, 배당수익률, 상장주식수
      companyInfo: "https://finance.naver.com/item/main.nhn?code={code}",
      // 월별 주가 시세
      marketPrice: "https://api.finance.naver.com/siseJson.naver?symbol={code}&requestType=1&startTime={start}&endTime={end}&timeframe=day",
    },
    file: {
      stockList: "./crawler-data/stock-list.json",
      stockCompanyList: "./crawler-data/stock-company-list.json",
      stockMergeList: "./crawler-data/stock-merge-list.json",
    },
    dir: {
      marketPrice: "./crawler-data/marketPrice/",
      mabsMarketPrice: "./crawler-data/mabs/",
    },
  },
  report: {
    file: {
      stockList: "./crawler-data/report/stock-list.xlsx",
      backtest: "./crawler-data/report/backtest.xlsx",
      mabsBacktest: "./crawler-data/report/mabsBacktest.xlsx",
    },
  },
};

export default Config;
