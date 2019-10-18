var express = require("express");
var exphbs = require("express-handlebars");
const path = require("path");
const Handlebars = require("handlebars");
var app = express();
const ProtocolTypes = require("./ProtocolTypes");
const uuid = require("uuid/v4");
const { start, dispatch, query, spawn, spawnStateless } = require("nact");

const model = {
  todoList: ["Naranjas", "Manzanas", "Toronjas"]
};
//--- Variables

//--- Configuraciones
// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;
app.engine("handlebars", exphbs()); //Para el template-engine handlebars
app.set("view engine", "handlebars"); //Para el template-engine handlebars
// app.use(express.urlencoded()); //Para recibir los parametros por post
app.use(express.urlencoded({ extended: true }));
console.log(__dirname);
const publicPath = path.join(__dirname, "\\views\\assets"); //Carpeta publica > https://stackoverflow.com/questions/41582026/css-files-not-found-using-express-handlebars

Handlebars.registerHelper("if_not_first", function(a, opts) {
  if (a != 0) {
    opts.inverse(this);
  } else {
    opts.fn(this);
  }
});
Handlebars.registerHelper("if_not_last", function(a, opts) {
  if (a != model.todoList.length - 1) {
    opts.inverse(this);
  } else {
    opts.fn(this);
  }
});
// Model de actores

const todoListService = actor =>
  spawnStateless(
    actor, //Padre
    (msg, ctx) => {
      console.log("Actor nro > ", actor.name," > ", msg.type);
      switch (msg.type) {
        case ProtocolTypes.GET_TODOLIST: {
          // Return all the items as an array
          var obj = { todoList: [] };
          model.todoList.forEach((item, index) => {
            switch (index) {
              case 0:
                obj.todoList.push({ descripcion: item, up: false, down: true });
                break;
              case model.todoList.length - 1:
                obj.todoList.push({ descripcion: item, up: true, down: false });
                break;
              default:
                obj.todoList.push({ descripcion: item, up: true, down: true });
                break;
            }
          });
          dispatch(
            ctx.sender,
            { payload: obj, type: ProtocolTypes.SUCCESS },
            ctx.self
          );
        }
        case ProtocolTypes.REMOVE_ITEM: {
          let index = payload;
          model.todoList.splice(index, 1);
          dispatch(ctx.sender, { type: ProtocolTypes.SUCCESS, payload: model });
          break;
        }
        case ProtocolTypes.CREATE_ITEM:
          {
            model.todoList.push(msg.payload);
            dispatch(ctx.sender, {
              type: ProtocolTypes.SUCCESS,
              payload: model
            });
            break;
          }
          // Return the current state if unchanged.
          return state;
      }
    },
    "items" //Name Actor
  );

performQuery = async (msg, res) => {
  var system = start();
  try {
    const result = await query(todoListService(system), msg, 250); // Set a 250ms timeout
    switch (result.type) {
      case ProtocolTypes.SUCCESS:
        //   res.json(result.payload);
        if (msg.type === ProtocolTypes.GET_TODOLIST) {
          res.render("home", result.payload);
        } else {
          res.redirect("/");
        }
        break;
      case ProtocolTypes.NOT_FOUND:
        res.sendStatus(404);
        break;
      default:
        // This shouldn't ever happen, but means that something is really wrong in the application
        console.error(JSON.stringify(result));
        res.sendStatus(500);
        break;
    }
  } catch (e) {
    // 504 is the gateway timeout response code. Nact only throws on queries to a valid actor reference if the timeout
    // expires.
    res.sendStatus(504);
  }
};

//--- Metodos ---
//--- HOME ---

app.use(express.static(__dirname + "/views/assets"));

app.get("/", (req, res) =>
  performQuery({ type: ProtocolTypes.GET_TODOLIST }, res)
);

//--- AGREGAR ITEM ---
app.post("/add/todo", (req, res) => {
  performQuery(
    { type: ProtocolTypes.CREATE_ITEM, payload: req.body.todo },
    res
  );
});

//--- ELIMINAR ITEM ---
app.get("/delete/:id", (req, res, next) =>
  performQuery({ type: ProtocolTypes.REMOVE_ITEM, payload: req.params.id }, res)
);

//--- ITEM UP ---
app.get("/up/:id", (req, res, next) => {
  let index = req.params.id;
  if (index > 0) {
    var item = model.todoList.splice(index, 1);
    model.todoList.splice(index - 1, 0, item);
  }

  res.redirect("/");
});

//--- ITEM Down ---
app.get("/down/:id", (req, res, next) => {
  let index = req.params.id;

  if (model.todoList.length - 1 > index) {
    var item = model.todoList.splice(index, 1);
    model.todoList.splice(index + 1, 0, item);
  }

  res.redirect("/");
});

//--- INVERTIR ---
app.get("/invertir", (req, res, next) => {
  model.todoList.reverse();

  res.redirect("/");
});

app.listen(port);
