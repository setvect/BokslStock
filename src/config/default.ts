const Config = {
  crawling: {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.96 Safari/537.36",
    url: {
      // 종목 목록
      stockList: "https://finance.naver.com/sise/sise_market_sum.nhn?sosok={marketSeq}&page={page}",
      // 기업정보: 실시간 PER, 실시간 PBR, 업종, 배당수익률, 상장주식수, 일반 주식/ETF,리츠 구분
      companyInfo: "https://finance.naver.com/item/coinfo.nhn?code={code}",
      // 일일 주가 시세
      marketPrice: "https://api.finance.naver.com/siseJson.naver?symbol={code}&requestType=1&startTime={start}&endTime={end}&timeframe=day",
      // 투자 지표
      investmentIndicator: "https://navercomp.wisereport.co.kr/v2/company/c1040001.aspx?cmp_cd={code}&cn=",
    },
  },
};

export default Config;
