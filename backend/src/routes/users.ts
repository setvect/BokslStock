import * as express from "express";
const router = express.Router();

/* GET users listing. */
router.get("/", (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log("req", req);
  res.send(`${req.url} 호출`);
});

module.exports = router;
