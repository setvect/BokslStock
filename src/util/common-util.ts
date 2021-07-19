import * as fs from "fs";
import { promisify } from "util";
import * as Excel from "exceljs";
export default class CommonUtil {
  static escapeHtml(text: string): string {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
  static unescapeHtml(text: string) {
    return text
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/#039;/g, "'");
  }

  /**
   * 변수의 타입 정보
   * @param obj
   */
  static getClass(obj: any): string {
    const instance = typeof obj;
    if (instance === "object") {
      return obj.constructor.name;
    }
    return instance;
  }

  /**
   * 정규표현식에서 사용하는 특수문자를 escape 처리함
   * @param str
   */
  static escapeRegExp(str: string) {
    return str.replace(/[\\-\\[\]\\/\\{\\}\\(\\)\\*\\+\\?\\.\\\\^\\$\\|]/g, "\\$&");
  }

  /**
   * 문장 전체 치환
   * @param text
   * @param org
   * @param dest
   */
  static replaceAll(text: string, org: string, dest: string): string {
    const escape = CommonUtil.escapeRegExp(org);
    const re = new RegExp(escape, "g");
    return text.replace(re, dest);
  }

  static async delay(ms: number): Promise<number> {
    return new Promise((resolve) => setTimeout(() => resolve(ms), ms));
  }

  static saveObjectToJson(data: any, savePath: string) {
    const json = JSON.stringify(data, null, 2);
    fs.writeFile(savePath, json, (err: NodeJS.ErrnoException) => {
      if (err) {
        console.error(err);
      }
    });
  }

  static saveText(text: string, savePath: string) {
    fs.writeFile(savePath, text, (err: NodeJS.ErrnoException) => {
      if (err) {
        console.error(err);
      }
    });
  }

  static async readTextFile(path: string, encode = "utf-8"): Promise<string> {
    const readFilePromise = promisify(fs.readFile);
    const text = await readFilePromise(path, encode);
    return text;
  }

  static async getFileList(baseDir: string) {
    const readFilePromise = promisify(fs.readdir);
    const list = await readFilePromise(baseDir);
    return list;
  }

  static getElementText(element: cheerio.Cheerio): string {
    return element.text().trim();
  }

  static getElementInt(element: cheerio.Cheerio): number | null {
    const value = CommonUtil.getText(element);
    const n = parseInt(value);
    return isNaN(n) ? null : n;
  }

  static getElementFloat(element: cheerio.Cheerio): number | null {
    const value = CommonUtil.getText(element);
    const n = parseFloat(value);
    return isNaN(n) ? null : n;
  }
  /**
   * 수익률 계산
   * 예시)
   * 반환값: 0.1 → 10%
   * 반환값: -0.2 → -20%
   * 반환값: 1.2 → 120%
   *
   * @param current  현재값
   * @param base  기준값
   * @return 수익률
   */
  static getYield(current: number, base: number): number {
    return current / base - 1;
  }

  /**
   * @param values
   * @return 최대 낙폭 계산 - MDD(Max. Draw Down)
   */
  static getMdd(values: number[]) {
    let highValue = -1;
    let mdd = 0;

    values.forEach((v) => {
      if (highValue < v) {
        highValue = v;
      } else {
        mdd = Math.min(mdd, v / highValue - 1);
      }
    });

    return mdd;
  }

  /**
   * 연 복리
   * CAGR = (EV / BV) ^ (1 / n)   - 1
   *
   * @param bv       초기 값, BV (시작 값)
   * @param ev       종료 값, EV (종료 값)
   * @param dayCount 일수
   * @return 연복리
   */
  static getCagr(bv: number, ev: number, dayCount: number): number {
    const year = dayCount / 365.0;
    return Math.pow(ev / bv, 1 / year) - 1;
  }

  /**
   *
   * @param value 백분률 표시할 값
   * @param point 소수점 자리
   */
  static getPercentage(value: number, point = 0) {
    const up = Math.pow(10, point);
    return Math.round(value * up * 100) / up;
  }

  static applyAutoColumnWith(worksheet: Excel.Worksheet) {
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column["eachCell"]({ includeEmpty: true }, function (cell) {
        const columnLength = cell.value ? cell.value.toString().length + 5 : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength;
    });
  }

  private static getText(element: cheerio.Cheerio) {
    let value = this.getElementText(element);
    value = CommonUtil.replaceAll(value, ",", "");
    return value;
  }
}
