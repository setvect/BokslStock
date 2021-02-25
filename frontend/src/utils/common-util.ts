import Swal from "sweetalert2";
/**
 * 프로그램 전역적으로 사용하는 공통 함수
 */
export default class CommonUtil {
  /**
   * 프로그램 오류로 인한 경고창
   */
  // TODO err 타입 정확히 파악
  static popupError(err: any) {
    const message = err.response == null ? err.message : err.response.data.message;
    if (err.message != null) {
      console.log("프로그램 에러", message);
      Swal.fire("에러다", message, "error");
    } else {
      console.log("프로그램 에러", err);
      Swal.fire("에러다", err, "error");
    }
  }
  static clearHtml(html: string) {
    return html.replace(/<\/?[^>]+(>|$)/g, "");
  }
  static toComma(value: string) {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  static toBr(text: string): string {
    if (text === undefined || text == null) {
      return "";
    }
    return text.replace(/(?:\r\n|\r|\n)/g, "<br/>");
  }
  static isEmpty(val: any) {
    return val === undefined || val == null || val.length <= 0;
  }
  static removeWhiteSpace(val: any) {
    if (CommonUtil.isEmpty(val)) {
      return "";
    } else {
      return val.replace(/\s/gi, "");
    }
  }
  /**
   * 정규표현식에서 사용하는 특수문자를 escape 처리함
   * @param str
   */
  static escapeRegExp(str: string) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }
}
