// npx sequelize-cli model:generate --name Admin --attributes firstname:string,lastname:string,email:string,password:string
//npx sequelize-cli db:migrate
// npx sequelize-cli migration:create --name ________ 

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
// const { Console } = require("console");

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

const { Admin, Player,Sport,Session,Sessionplayer} = require("./models");
app.get("/", async function (request, response) {//starting router
  response.render("start", {
    title: "sport scheduler Application",
    csrfToken: request.csrfToken(),
  });
});
app.get("/indexadmin", async function (request, response) {// if you select admin
  response.render("indexadmin", {
    title: "indexadmin",
    csrfToken: request.csrfToken(),
  });
});

app.get("/adminsignup", (request, response) => {//adminsignup
  response.render("Adminsignup", {
    title: "Adminsignup",
    csrfToken: request.csrfToken(),
  });
});

app.get("/adminlogin", (request, response) => {//once adminsingup done render adminlogin
  response.render("Adminlogin", { title: "Adminlogin", csrfToken: request.csrfToken() });
});
app.post(
  "/adminlogin",
  passport.authenticate("admin", {
    failureRedirect: "/adminlogin",
    failureFlash: true,
  }),
  (request, response) => {
    
    console.log(request.user);
    response.redirect("/welcomeAdmin");//authentication suceesfull
  }
);

app.get("/WelcomeAdmin",connectEnsureLogin.ensureLoggedIn(),async (request, response) => {
  // admin login is successful, then render welcome page for admin
  const csrfToken = request.csrfToken();
  const uname = request.user.firstname;
  const userid = parseInt(request.user.id); // Convert to integer if necessary

  return response.render("WelcomeAdmin", {
    csrfToken,
    uname,
    userid
  });
});

app.get("/createsport",connectEnsureLogin.ensureLoggedIn(),async function(request,response){// when i click on create sport 
return response.render("createsport",{
  csrfToken: request.csrfToken(),
});
});
app.get(
  "/Editsport/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      const sport = await Sport.findOne({
        where: {
          id: request.params.id,
        },
      });
      

      if (!sport) {
        return response.status(404).json({ error: "Sport not found" });
      }

      response.render("Editsport", {
        sport,
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.post(
  "/sport/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    try {
      console.log("hehe2", request.body.title);
      console.log("hehehe", request.params.id);
      await Sport.update(
        { sportname: request.body.title }, // Replace `name` with the correct attribute name
        { where: { id: request.params.id } }
      );
      return response.redirect("/WelcomeAdmin");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);


const { Op } = require('sequelize');
const { render } = require("ejs");

app.get("/adminsports",connectEnsureLogin.ensureLoggedIn(),async(request,response)=>{
  const loggedInUser=request.user.id;
  const UserName=request.user.firstname;
  const adminId = parseInt(loggedInUser, 10); // Parse the id to an integer
  
  const sports = await Sport.findAll({
    where: {
      adminid: adminId,
    },
  });
  if (request.accepts("html")) {
    response.render("admincreatedsport", {
      UserName,
      loggedInUser,
      sports,
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      UserName,
      loggedInUser,
      sports,
    });
  }
});

app.get("/nonadminsports",connectEnsureLogin.ensureLoggedIn(),async function(request,response){
  const loggedInUser=request.user.id;
  const UserName=request.user.firstname;
  const adminId = parseInt(loggedInUser, 10); // Parse the id to an integer
  const sports = await Sport.findAll({
    where: {
      adminid: {
        [Op.ne]: adminId, // Use Op.ne to indicate "not equal to"
      },
    },
  });
  if (request.accepts("html")) {
    response.render("nonadminsports", {
      UserName,
      loggedInUser,
      sports,
    
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      UserName,
      loggedInUser,
      sports,
    });
  }
});
app.get("/alladminsports",connectEnsureLogin.ensureLoggedIn(),async function(request,response){
 const sports = await Sport.findAll()
 if (request.accepts("html")) {
    response.render("alladminsports", {
   
      sports,
    
      csrfToken: request.csrfToken(),
    });
  } else {
    response.json({
      UserName,
      loggedInUser,
      sports,
    });
  }
});

app.get("/sports/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const loggedInAdminId = request.user.id; // Assuming the logged-in user is an admin
  const sport = await Sport.findOne({
    where: {
      id: request.params.id,
    },
  });
  const sname = sport.firstname;
  const sportid = request.params.id;
  response.render("welcomesport", {
    title: "Session",
    loggedInAdmin: loggedInAdminId, // Update the variable name to loggedInAdmin
    sname,
    sportid,
    sport,
    csrfToken: request.csrfToken(),
  });
});

app.get("/sports1/:id",async(request,response)=>{
  const sport=await Sport.findOne({
    where:{
      id:request.params.id,
    }
  });
  const sname=sport.firstname;
  const sportid=request.params.id;
  response.render("Adminsession", {
title: "Session",
sname,
sportid,
    sport,
    csrfToken: request.csrfToken(),
  });
});


app.get("/playersignup", (request, response) => {
  response.render("playersignup", {
    title: "playersignup",
    csrfToken: request.csrfToken(),
  });
});


app.get("/playerlogin", (request, response) => {
  response.render("playerlogin", { title: "playerlogin", csrfToken: request.csrfToken() });
});




app.get("/indexplayer", (request, response) => {
  response.render("indexplayer", {
    title: "sdf",
    csrfToken: request.csrfToken(),
  });
});



app.post(
  "/sports",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const enteredSport = request.body.title;
      const sportsList = await Sport.findAll();
      if (sportsList.some(sport => sport.sportname === enteredSport)) {
        request.flash("error", "Sport already exists!");
        return response.redirect("/createsport");
      }
      

    
    try {
      const sport = await Sport.create({
        sportname: request.body.title,
        adminid: request.user.id,
      });

      // Access the ID of the created sport using sport.id
      const sportId = sport.id;

      return response.render("welcomesport", {
        loggedInAdmin:request.user.id,
        sname: request.body.title,
        sport,
        sportid: parseInt(sportId), // Convert sportId to an integer
        csrfToken: request.csrfToken(),
      });
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);


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
    return response.redirect("/adminsignup");
  }
  if (!secondName1) {
    request.flash("error", "please enter your second Name");
    return response.redirect("/adminsignup");
  }
  if (!email1) {
    request.flash("error", "please enter your Email");
  }
  if (!pwd) {
    request.flash("error", "Please enter valid password");
    return response.redirect("/adminsignup");
  }
  if (pwd.length < 8) {
    request.flash("error", "Password length should be atleast 8");
    return response.redirect("/adminsignup");
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
    return response.redirect("/adminsignup");
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
  if (pwd.length < 8) {
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
  "/playerlogin",
  passport.authenticate("player", {
    failureRedirect: "/playerlogin",
    failureFlash: true,
  }),
  (request, response) => {
    // we are calling this method for authentications
    console.log(request.user);
    response.redirect("/alladminsports");
  }
);

// home page for admin




app.delete(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("Deleting a Sport with ID: %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%", request.params.id);
    try {
      await Sport.destroy({
        where:
        {
          id:request.params.id,
          
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

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/",
    failureFlash: true,
  }),
  function (request, response) {
    console.log(request.user);
    if (request.user.isadmin==true) {
      response.redirect("/Adminlogin");
    } else {
      response.redirect("/playerlogin");
    }
  }
);




app.get("/sessionviewyou/:id",connectEnsureLogin.ensureLoggedIn(),async function(request,response){
  let adminId, playerId;
  console.log(request.user.isadmin+"RRRRRRRRRRRRRRRRRRRRRRRRRRRR");
let sports,sessions;
  if (request.user.isadmin == true) {
    adminId = request.user.id;
    sports = await Sport.findByPk(request.params.id);// retriving sport done 
     sessions = await Session.findAll({ //sessions retriving done 
      where: {
        sportId: request.params.id,
        adminId:adminId
      },
  });
  } else {
    playerId = request.user.id;
     sports = await Sport.findByPk(request.params.id);// retriving sport done 
     sessions = await Session.findAll({ //sessions retriving done 
      where: {
        sportId: request.params.id,
        playerId:playerId
      },
  });
  
}
response.render("sessionviewyou", {
  adminId,
  playerId,
  sports,
  id:request.params.id,
  sessions,
  csrfToken: request.csrfToken(),
});
});


//   const participants = new Array(sessions.length);
// for (let j = 0; j < sessions.length; j++) {
//   const sessionPlayers = await Sessionplayer.findAll({ where: { sessionId: sessions[j].id } });
//   participants[j] = sessionPlayers.length;
// }
// console.log(participants,"$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$")

app.get("/sessionviewothers/:id",connectEnsureLogin.ensureLoggedIn(),async function(request,response){
  let adminId, playerId;
  console.log(request.user.isadmin+"RRRRRRRRRRRRRRRRRRRRRRRRRRRR");
let sports,sessions;
  if (request.user.isadmin == true) {
    adminId = request.user.id;
    sports = await Sport.findByPk(request.params.id);// retriving sport done 
     sessions = await Session.findAll({ //sessions retriving done 
      where: {
        sportId: request.params.id
      },
  });
  } else {
    playerId = request.user.id;
     sports = await Sport.findByPk(request.params.id);// retriving sport done 
     sessions = await Session.findAll({ //sessions retriving done 
      where: {
        sportId: request.params.id
      },
  });
  
}
response.render("sessionviewothers", {
  adminId,
  playerId,
  sports,
  id:request.params.id,
  sessions,
  csrfToken: request.csrfToken(),
});
});
app.get("/sessionviewyou/:id/:sid",connectEnsureLogin.ensureLoggedIn(),async function(request,response){

  const session = await Session.findByPk(request.params.sid);
  const sport = await Sport.findByPk(session.sportId);
  const players = await Sessionplayer.getPlayers({id:request.params.sid})
  var adminId,playerId;
  if(request.user.isadmin==true){
     adminId=request.user.id;

  } 
  else{
     playerId=request.user.id;
  }
  console.log("SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",players);
  response.render("createdsession",{
    adminId,
    playerId,
    sport,
    players,
    session,

    csrfToken: request.csrfToken(),
  });
  
});




app.post(
  "/createsession",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("Creating a Session for the sport", request.body);
    const { joiningplayers, date, venue, requiredplayers, sportid } = request.body;
    const playernames = joiningplayers.split(",");
    
    let adminId, playerId;
    if (request.user.isadmin == true) {
      adminId = request.user.id;
    } else {
      playerId = request.user.id;
    }
    
    try {
      const createdSession = await Session.create({
        date,
        venue,
        participants: requiredplayers,
        isCreated: true,
        sportId: sportid,
        adminId,
        playerId
      });

      for (let i = 0; i < playernames.length; i++) {
        await Sessionplayer.create({
          playername: playernames[i],
          adminId,
          playerId,
          sportId: sportid,
          sessionId: createdSession.id
        });
      }

      return response.redirect(`/createdsession/${createdSession.id}`);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.get("/createdsession/:id",connectEnsureLogin.ensureLoggedIn(),async function(request,response){
  const session = await Session.findByPk(request.params.id);
  const sport = await Sport.findByPk(session.sportId);
  const players = await Sessionplayer.getPlayers({id:request.params.id})
  var adminId,playerId;
  if(request.user.isadmin==true){
     adminId=request.user.id;

  } 
  else{
     playerId=request.user.id;
  }
  console.log("SSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS",players);
  response.render("createdsession",{
    adminId,
    playerId,
    sport,
    players,
    session,

    csrfToken: request.csrfToken(),
  });
  
});






module.exports = app;