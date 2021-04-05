<template>
  <div class="wrap">
    <h1>5월 마지막주 영화 예매 순위</h1>
    <ul class="movies">
      <li v-for="movie in movies" :key="movie.id" class="item">
        <span class="rank">{{ movie.id }}</span>
        <router-link :to="{ name: 'show', params: { id: movie.id } }">
          <img :src="movie.poster" class="poster" />
        </router-link>
        <div class="detail">
          <strong class="tit">{{ movie.title }}</strong>
          <span class="rate">
            년도
            <span class="num">{{ movie.year }}</span>
          </span>
          <router-link :to="{ path: `/movie/${movie.id}` }" class="link">자세히보기</router-link>
        </div>
      </li>
    </ul>
  </div>
</template>
<script lang="ts">
import Vue from "vue";
import AjaxCall from "../utils/ajax";

export interface Movie {
  memoSeq: number;
  content: string;
  regDate: Date;
}

export default Vue.extend({
  data() {
    return {
      movies: [] as Array<Movie>,
    };
  },
  async mounted() {
    // 컴포넌트가 생성될 때, /api/movies에 요청을 보냅니다.
    const result: any = await AjaxCall.get("/api/movies", {});
    this.movies = result.data;
  },
});
</script>
