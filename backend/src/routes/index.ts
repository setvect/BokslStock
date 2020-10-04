var express = require("express");
var router = express.Router();
console.log("############@@@@@@@@@@@@@@@@@@@");
/* GET home page. */
router.get("/", function(req: any, res: any, next: any) {
  console.log("##############################");
  res.render("index", { title: "Express", });
});

module.exports = router;
