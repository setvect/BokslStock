<template>
  <div class="detail">
    <h1>{{ movie.title }}</h1>
    <img :src="movie.poster" class="poster" />
    <section>
      <h2>영화정보</h2>
      <dl class="info">
        <dt>년도</dt>
        <dd>{{ movie.year }}</dd>
        <dt>장르</dt>
        <dd>{{ movie.genres.join(", ") }}</dd>
      </dl>
    </section>
    <router-link :to="{ name: 'index', params: { id: movie.id } }" class="link"> 돌아가기 </router-link>
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { Movie } from "./MovieIndexPage.vue";

export default Vue.extend({
  data() {
    return {
      movie: {} as Movie,
    };
  },
  created() {
    const id = this.$route.params.id;
    this.$http.get(`/api/movies/${id}`).then(({ data }) => {
      this.movie = data;
    });
  },
});
</script>
