<template>
  <div>
    <div>
      <form>
        <input name="name" placeholder="이름" />
        <input name="tel" placeholder="연락처" />
        <button>등록</button>
      </form>
    </div>
    <div>
      <table>
        <tr>
          <th>번호</th>
          <th>이름</th>
          <th>연락처</th>
          <th>수정</th>
          <th>삭제</th>
        </tr>
        <tr>
          <td>1</td>
          <td>복슬이</td>
          <td>123-1234</td>
          <td><button>수정</button></td>
          <td><button>삭제</button></td>
        </tr>
      </table>
    </div>
  </div>
</template>
<script>
export default {
  name: "mongoCrud",
  data() {
    return {};
  },
  created() {},
};
</script>
