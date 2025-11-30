import { COURSES } from "./src/courses.js";
import { ZDBK } from "./src/zdbk.js"
import { ZJUAM } from "./src/zjuam.js";
// import { COURSE } from "./src/course";
import { FORM } from "./src/form.js";
import { CLASSROOM } from "./src/classroom.js";
import { YQFKGL } from "./src/yqfkgl.js";

import pkg from "./package.json" with { type: "json" };
console.log("[login ZJU] You (or your application) are using login-ZJU version: " + pkg.version);
console.log("[login ZJU] If you find any issues, please report them at");
console.log("                https://github.com/5dbwat4/login-ZJU");


export {COURSES,ZDBK,ZJUAM,FORM,CLASSROOM,YQFKGL}