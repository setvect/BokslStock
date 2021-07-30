# 1. 복슬스톡
- [1. 복슬스톡](#1-복슬스톡)
  - [1.1. 설치](#11-설치)
    - [1.1.1. 인스톨](#111-인스톨)
    - [1.1.2. 실행](#112-실행)
    - [1.1.3. 빌드](#113-빌드)
    - [1.1.4. 빌드된거 실행](#114-빌드된거-실행)
  - [1.2. 명령어 기반 수집 및 백테스트](#12-명령어-기반-수집-및-백테스트)
    - [1.2.1. 수집](#121-수집)
    - [1.2.2. 기업 재무 정보 엑셀 내보내기](#122-기업-재무-정보-엑셀-내보내기)
    - [1.2.3. 백테스트](#123-백테스트)
      - [1.2.3.1. 투자지표](#1231-투자지표)
      - [1.2.3.2. 이동평균 돌파](#1232-이동평균-돌파)
      - [1.2.3.3. 이동평균 반전](#1233-이동평균-반전)
      - [1.2.3.4. 절대 모멘텀](#1234-절대-모멘텀)
      - [1.2.3.5. RSI 지표를 이용한 매매](#1235-rsi-지표를-이용한-매매)
  - [1.3. 참고](#13-참고)

## 1.1. 설치
### 1.1.1. 인스톨

```bash
$ npm install
$ cd frontend
$ npm install
```
### 1.1.2. 실행

```bash
$ npm run start:dev
$ cd frontend
$ npm run start
```

### 1.1.3. 빌드

```bash
$ npm run build
$ cd frontend
$ npm run build
```

### 1.1.4. 빌드된거 실행
```bash
$ cd dist/backend
$ node main.js
```

## 1.2. 명령어 기반 수집 및 백테스트
### 1.2.1. 수집
1. 상장 종목 수집
   - 수집 항목: 종목 이름, 코드, 현재가, 시가총액
   ```sh
   npm run ts-node src/console/crawler/StockListCrawler.ts
   ```
  결과: `./crawler-data/stock-list.json`

2. 재무 및 투자 지표 수집
   - 수집 항목: 실시간 PER, 실시간 PBR, 실시간 EPS, 업종, 배당수익률, 상장주식수, 일반 주식/ETF,리츠 구분
   ```sh
   npm run ts-node src/console/crawler/CompanyInfoCrawler.ts
   ```
  결과: `./crawler-data/stock-company-list.json`

3. 시세 수집
   - 수집 항목: 일짜별 OHLC
   ```sh
   npm run ts-node src/console/crawler/MarketPriceCrawler.ts
   ```
  결과: `./crawler-data/marketPrice/${종목코드}_${종목이름}.json`

### 1.2.2. 기업 재무 정보 엑셀 내보내기
```sh
npm run ts-node src/console/export/ExportExcel.ts
```
결과: `./crawler-data/report/stock-list.xlsx`

### 1.2.3. 백테스트
#### 1.2.3.1. 투자지표
- PER, PBR이 낮은 기업 30개 동일가중
- 기타금융, 생명보험, 손해보험, 은행, 증권, 창업투자 기업 제외
```sh
npm run ts-node src/console/backtest/FinancialBacktest.ts
```
결과: `./crawler-data/report/financialBacktest.xlsx`
#### 1.2.3.2. 이동평균 돌파
- 단기 이동평균이 장기 이동평균을 돌파하면 `매수`
- 단기 이동평균이 장기 이동평균에 하락하면 `매도`
```sh
npm run ts-node src/console/backtest/MabsBacktest.ts
```
결과: `./crawler-data/report/mabsBacktest.xlsx`
####  1.2.3.3. 이동평균 반전
- 이동평균이 상승 반전하면 `매수`
- 이동평균이 하락 반전하면 `매도`
```sh
npm run ts-node src/console/backtest/MaisBacktest.ts
```
결과: `./crawler-data/report/maisBacktest.xlsx`

#### 1.2.3.4. 절대 모멘텀
- 현재 주가가 N월 전 종가 보다 높으면 `매수` 낮으면 `매도`
```sh
npm run ts-node src/console/backtest/MaisBacktest.ts
```
결과: `./crawler-data/report/amBacktest.xlsx`

#### 1.2.3.5. RSI 지표를 이용한 매매
- 현재 주가가 200일 이동평균 이상일 때만 매수 활성화
- RSI 침체구간에 매수
- RSI 과열구간 매도
```sh
npm run ts-node src/console/backtest/MaisBacktest.ts
```
결과: `./crawler-data/report/rsi.xlsx`

## 1.3. 참고
- [UI 템플릿 - bootstrap](https://bootstrap-vue.js.org/)
- [UI 템플릿 - gentelella](https://github.com/ColorlibHQ/gentelella)
