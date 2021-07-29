export default class StockUtil {
  /**
   * RSI 값을 계산
   * 기간은 N = priceList.length - 1
   * @param priceList 가격. 마지막 인덱스가 최근 값
   */
  static getRsi(priceList: number[]): number {
    let plusSum = 0;
    let minusSum = 0;
    for (let i = 1; i < priceList.length; i++) {
      const diff = priceList[i] - priceList[i - 1];

      if (diff > 0) {
        plusSum += diff;
      } else {
        minusSum += -diff;
      }
    }

    const plusAvg = plusSum / (priceList.length - 1);
    const minusAvg = minusSum / (priceList.length - 1);

    return plusAvg / (plusAvg + minusAvg);
  }
}
