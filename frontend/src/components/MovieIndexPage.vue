<template>
  <div class="wrap">
    <h1>5월 마지막주 영화 예매 순위</h1>
    <ul class="movies">
      <li v-for="movie in movies" :key="movie.id" class="item">
        <span class="rank">{{ movie.id }}</span>
        <router-link :to="{ name: 'show', params: { id: movie.id } }">
          <img v-bind:src="movie.poster" class="poster" />
        </router-link>
        <div class="detail">
          <strong class="tit">{{ movie.name }}</strong>
          <span class="rate">
            예매율
            <span class="num">{{ movie.rate }}</span>
          </span>
          <router-link :to="{ path: `/movie/${movie.id}`}" class="link">자세히보기</router-link>
        </div>
      </li>
    </ul>
  </div>
</template>
<script>
export default {
  created() {
    // 컴포넌트가 생성될 때, /api/movies에 요청을 보냅니다.
    this.$http.get("/api/movies").then((response) => {
      this.movies = response.data;
    });
    console.log("############");
    this.$http.get("/api/users").then((response) => {
      console.log("response333.data :>> ", response.data);
    });
  },
  data() {
    return {
      movies: [],
    };
  },
};
</script>
