/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
const request = require("supertest");

const db = require("../models/index");
const app = require("../app");
var cheerio = require("cheerio");

let server, agent;
function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

let login = async (agent, username, password) => {
  let r = await agent.get("/login");
  const csrfToken = extractCsrfToken(r);
  r = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo test suite", function () {
  beforeAll(async () => {
    // to run all rows before each test starts
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });
  test("Test Sign up for first user", async () => {
    let r = await agent.get("/Adminsignup");
    const csrfToken = extractCsrfToken(r);
    r = await agent.post("/admins").send({
      firstname: "Allen",
      lastname: "Thomas",
      email: "Allen2023@gmail.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(r.statusCode).toBe(302); // 302 indicates page redirection
  });

  test("sign out for user", async () => {
    let r = await agent.get("/WelcomeAdmin");
    expect(r.statusCode).toBe(200); // to know the cofiramation of todos
    r = await agent.get("/signout");
    expect(r.statusCode).toBe(302);
    r = await agent.get("/todos");
    expect(r.statusCode).toBe(302); // indicates redirection
  });
  test("Test Sign up for second user", async () => {
    let r = await agent.get("/signup");
    const csrfToken = extractCsrfToken(r);
    r = await agent.post("/users").send({
      firstname: "virat",
      lastname: "kohil",
      email: "virat2023@gmail.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(r.statusCode).toBe(302); // 302 indicates page redirection
  });
  test("Test sign out for second user", async () => {
    let r = await agent.get("/todos");
    expect(r.statusCode).toBe(200); // to know the cofiramation of todos
    r = await agent.get("/signout");
    expect(r.statusCode).toBe(302);
    r = await agent.get("/todos");
    expect(r.statusCode).toBe(302); // indicates redirection
  });
  
});
