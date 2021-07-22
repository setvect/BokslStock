import { Config } from "@/config";
import CommonUtil from "@/util/common-util";
import axios, { AxiosResponse } from "axios";

/**
 * Http 웹 페이지
 */
export default class CrawlerHttp {
  /**
   * 종목 전체 목록
   * @param page 페이지 번호
   * @returns
   */
  async getStockListPage(marketSeq: number, page: number): Promise<AxiosResponse> {
    return await axios({
      method: "get",
      url: Config.crawling.url.stockList.replace("{marketSeq}", marketSeq.toString()).replace("{page}", page.toString()),
      headers: {
        "User-Agent": Config.crawling.userAgent,
      },
      responseType: "arraybuffer",
    });
  }
  /**
   * 기업 정보
   * @param code
   */
  static async crawlerCompany(code: string): Promise<AxiosResponse> {
    return await axios({
      method: "get",
      url: Config.crawling.url.companyInfo.replace("{code}", code),
      headers: {
        "User-Agent": Config.crawling.userAgent,
      },
      responseType: "arraybuffer",
    });
  }

  /**
   * 시세 데이터(json)
   * @param code 종목 코드
   * @param start yyyyMMdd
   * @param end yyyyMMdd
   */
  static async getMakretPrice(code: string, start: string, end: string): Promise<[]> {
    const response: AxiosResponse = await CrawlerHttp.crawlerMarketPrice(code, start, end);
    const json = CommonUtil.replaceAll(response.data, "'", '"');
    const array = JSON.parse(json);
    return array;
  }

  /**
   * 시세 데이터(json)
   * @param code 종목 코드
   * @param start yyyyMMdd
   * @param end yyyyMMdd
   */
  static async crawlerMarketPrice(code: string, start: string, end: string): Promise<AxiosResponse> {
    const url = Config.crawling.url.marketPrice.replace("{code}", code).replace("{start}", start).replace("{end}", end);
    return await axios({
      method: "get",
      url: url,
      headers: {
        "User-Agent": Config.crawling.userAgent,
      },
    });
  }
}
