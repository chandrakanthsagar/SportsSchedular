// npx sequelize-cli model:generate --name Admin --attributes firstname:string,lastname:string,email:string,password:string
//npx sequelize-cli db:migrate

/* eslint-disable no-undef */
const express = require("express"); //importing the Express module in Node.js. Express is a popular web application framework for Node.js that simplifies the process of building web applications and APIs.
const app = express(); // creating an instace of express using these varible we can define routes
const csrf = require("csurf");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));

const { Admin, Player,Sport } = require("./models");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

app.use(cookieParser("shh! some secret string"));
app.use(csrf({ cookie: true }));
const bcrypt = require("bcrypt");

const saltRounds = 10;

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const { Console } = require("console");

app.use(flash());
app.use(
  session({
    secret: "my_super-secret-key-217263018951768",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, //24hrs
    },
  })
);
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());


passport.use('admin',
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Admin.findOne({ where: { email: username } })
        .then(async function (user) {
          console.log("user is......................", user);
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(error);
        });
    }
  )
);
passport.use('player',
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Player.findOne({ where: { email: username } })
        .then(async function (user) {
          console.log("user is......................", user.isadmin);
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(error);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serilaizing user in session", user.id);
  var type = user.isadmin==true?"Admin":"Player";
  done(null, {id: user.id, type: type});
});

passport.deserializeUser((data, done) => {
  if(data.type == "Player") {
    Player.findByPk(data.id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
  }
  else {
    Admin.findByPk(data.id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
  }
  
});

app.get("/adminsignup", (request, response) => {
  response.render("Adminsignup", {
    title: "Adminsignup",
    csrfToken: request.csrfToken(),
  });
});
app.get("/playersignup", (request, response) => {
  response.render("playersignup", {
    title: "playersignup",
    csrfToken: request.csrfToken(),
  });
});

app.get("/adminlogin", (request, response) => {
  response.render("Adminlogin", { title: "Adminlogin", csrfToken: request.csrfToken() });
});
app.get("/playerlogin", (request, response) => {
  response.render("playerlogin", { title: "Adminlogin", csrfToken: request.csrfToken() });
});

app.get("/", async function (request, response) {
  response.render("start", {
    title: "sport scheduler Application",
    csrfToken: request.csrfToken(),
  });
});

app.get("/indexadmin", async function (request, response) {
  response.render("indexadmin", {
    title: "indexadmin",
    csrfToken: request.csrfToken(),
  });
});
app.get("/indexplayer", (request, response) => {
  response.render("indexplayer", {
    title: "sdf",
    csrfToken: request.csrfToken(),
  });
});
app.get("/createsport",connectEnsureLogin.ensureLoggedIn(),async function(request,response){
    const UserName = await request.user.firstname;
    const sports = await Sport.findAll({
      where:{
        adminid:request.user.id,
      }
  });
  return response.render("createsport",{
    title:"createsport",
    csrfToken: request.csrfToken(),
    UserName,
    sports
  });
});

app.get("/sports/:id",async(request,response)=>{
  const sport=await Sport.findOne({
    where:{
      id:request.params.id,
    }
  });
  response.render("adminsession", {
    title: "Session",
    sport,
    csrfToken: request.csrfToken(),
  });
});
app.post(
  "/sports",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("Creating a Sport", request.body);
    // console.log(request.user);
    try {
      // eslint-disable-next-line no-unused-vars
      const sport = await Sport.create({
        sportname: request.body.title,
        adminid: request.user.id, 
      });
      return response.redirect("/createSport");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);
//
// app.get(
//   "/sportlist",
//   connectEnsureLogin.ensureLoggedIn(),
//   async function (request, response) {
//     const loggedInUser = request.user.id;
   

//     const UserName = request.user.firstname;
   
//     const sports = await Sport.findAll({
//       where:{
//         adminid:loggedInUser,
//       }
//   });
//     if (request.accepts("html")) {
//       response.render("createsport", {
//         UserName,
//         loggedInUser,
//         sports,
//         csrfToken: request.csrfToken(),
//       });
//     } else {
//       response.json({
//         UserName,
//         loggedInUser,
//         sports,
//       });
//     }
//   }
// );





// signup page admin
app.post("/adminsignup", async (request, response) => {
  console.log(request.body.firstName+"::::::::::::::::::::::::::::::::::::::::::::::::::::");
  const hashedpwd = await bcrypt.hash(request.body.password, saltRounds);

  const firstName1 = request.body.firstName;
  console.log("fir1", firstName1);
  const secondName1 = request.body.lastName;
  const email1 = request.body.email;
  const pwd = request.body.password;
  if (!firstName1) {
    console.log("fir", firstName1);
    request.flash("error", "please enter your first Name");
    return response.redirect("/Adminsignup");
  }
  if (!secondName1) {
    request.flash("error", "please enter your second Name");
    return response.redirect("/Adminsignup");
  }
  if (!email1) {
    request.flash("error", "please enter your Email");
  }
  if (!pwd) {
    request.flash("error", "Please enter valid password");
    return response.redirect("/Adminsignup");
  }
  if (pwd < 8) {
    request.flash("error", "Password length should be atleast 8");
    return response.redirect("/Adminsignup");
  }
  
  try {
    const user = await Admin.create({
      firstname: request.body.firstName,
      lastname: request.body.lastName,
      email: request.body.email,
      password: hashedpwd,
    });
    console.log("user", user);
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/Adminlogin");
    });
  } catch (error) {
    console.log(error);
    request.flash("error", error.message);
    return response.redirect("/Adminsignup");
  }
});
///

app.post("/playersignup", async (request, response) => {
  console.log(request.body.firstName);
  const hashedpwd = await bcrypt.hash(request.body.password, saltRounds);

  const firstName1 = request.body.firstName;
  console.log("fir1", firstName1);
  const secondName1 = request.body.lastName;
  const email1 = request.body.email;
  const pwd = request.body.password;
  if (!firstName1) {
    console.log("fir", firstName1);
    request.flash("error", "please enter your first Name");
    return response.redirect("/playersignup");
  }
  if (!secondName1) {
    request.flash("error", "please enter your second Name");
    return response.redirect("/playersignup");
  }
  if (!email1) {
    request.flash("error", "please enter your Email");
  }
  if (!pwd) {
    request.flash("error", "Please enter valid password");
    return response.redirect("/playersignup");
  }
  if (pwd < 8) {
    request.flash("error", "Password length should be atleast 8");
    return response.redirect("/playersignup");
  }
  
  try {
    const user = await Player.create({
      firstname: request.body.firstName,
      lastname: request.body.lastName,
      email: request.body.email,
      password: hashedpwd,
    });
    console.log("user", user);
    request.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      response.redirect("/playerlogin");
    });
  } catch (error) {
    console.log(error);
    request.flash("error", error.message);
    return response.redirect("/playersignup");
  }
});



// 2 routers for authentication of admin and player
app.post(
  "/adminlogin",
  passport.authenticate("admin", {
    failureRedirect: "/adminlogin",
    failureFlash: true,
  }),
  (request, response) => {
    // we are calling this method for authentications
    console.log(request.user);
    response.redirect("/welcomeAdmin");
  }
);

app.post(
  "/playerlogin",
  passport.authenticate("player", {
    failureRedirect: "/playerlogin",
    failureFlash: true,
  }),
  (request, response) => {
    // we are calling this method for authentications
    console.log(request.user);
    response.redirect("/home");
  }
);


// home page for admin

app.get("/welcomeAdmin", (request, response) => {
  const user= request.user;

  response.render("welcomeAdmin", {
    csrfToken: request.csrfToken(),
    uname:user.firstname,
   
  });
})
app.delete(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Deleting a Sport with ID: ", request.params.id);
    try {
      await Sport.destroy({
        where:
        {
          id:request.params.id,
          adminid:request.user.id,
        }
      });
      return response.json({ success: true });
    } catch (error) {
      return response.status(422).json(error);
    }
  }
);
app.get("/signout", (request, response, next) => {
  //sign out code is here
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/"); //redirecting to landing page
  });
});



module.exports = app;

