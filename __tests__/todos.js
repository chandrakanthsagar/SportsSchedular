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
    let r = await agent.get("/signup");
    const csrfToken = extractCsrfToken(r);
    r = await agent.post("/users").send({
      firstName: "Allen",
      lastName: "Thomas",
      email: "Allen2023@gmail.com",
      password: "12345678",
      _csrf: csrfToken,
    });
    expect(r.statusCode).toBe(302); // 302 indicates page redirection
  });

  test("sign out for user", async () => {
    let r = await agent.get("/todos");
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
      firstName: "virat",
      lastName: "kohil",
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
  test("Creates a todo ", async () => {
    const agent = request.agent(server); // load localhost:3000
    await login(agent, "Allen2023@gmail.com", "12345678");
    const r = await agent.get("/todos");
    const csrfToken = extractCsrfToken(r);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response.statusCode).toBe(302);
  });

  test("Update a todo with given ID as complete /incomplete ", async () => {
    const agent = request.agent(server);
    await login(agent, "Allen2023@gmail.com", "12345678");
    let r = await agent.get("/todos");
    let csrfToken = extractCsrfToken(r);
    await agent.post("/todos").send({
      title: "Buy movietickets",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos") // list of todos
      .set("Accept", "application/json");

    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text); //
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latesttd = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    //console.log("todoid",latesttd)
    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse = await agent.put(`/todos/${latesttd.id}`).send({
      _csrf: csrfToken,
      completed: true,
    });

    const UpdateResponse = JSON.parse(markCompleteResponse.text); //
    expect(UpdateResponse.completed).toBe(true);

    res = await agent.get("/todos");
    csrfToken = extractCsrfToken(res);

    const markCompleteResponse1 = await agent
      .put(`/todos/${latesttd.id}`)
      .send({
        _csrf: csrfToken,
        completed: false,
      });

    const UpdateResponse1 = JSON.parse(markCompleteResponse1.text);
    expect(UpdateResponse1.completed).toBe(false);
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
    const agent = request.agent(server);
    await login(agent, "Allen2023@gmail.com", "12345678");
    let r = await agent.get("/todos");
    let csrfToken = extractCsrfToken(r); // ensuring there is no csrf attacks
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/todos")
      .set("Accept", "application/json");

    console.log("finddel", groupedTodosResponse);
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;

    const latesttd = parsedGroupedResponse.dueToday[dueTodayCount - 1];

    const todoID = latesttd.id;
    var c = await agent.delete(`/todos/${todoID}`).send({ _csrf: csrfToken });

    expect(c.text).toBe("true"); // item deleted sucessfully text is returning string response

    c = await agent.delete(`/todos/${todoID}`).send({ _csrf: csrfToken }); // testing to delete the test
    expect(c.text).toBe("false"); // item alreay deleted
  });
});
