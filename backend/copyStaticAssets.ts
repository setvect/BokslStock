import * as shell from "shelljs";

shell.cp("-R", "src/public/", "dist/public/");
shell.cp("", "src/movies.json", "dist/");
