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
}
