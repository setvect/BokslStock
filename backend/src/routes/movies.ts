var express = require("express");
var router = express.Router();
var movies = require("../movies.json");
router.get("/", function(req: any, res: any, next: any) {
  console.log("######################8888");
  res.send(movies);
});
// 영화 상세 페이지를 위한 코드
router.get("/:id", function(req: any, res: any, next: any) {
  var id = parseInt(req.params.id, 10);
  var movie = movies.filter((movie: any) => {
    return movie.id === id;
  });
  res.send(movie);
});
module.exports = router;
