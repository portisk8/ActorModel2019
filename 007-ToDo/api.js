const express = require('express');
const app = express();
const bodyParser = require('body-parser');
//--- Variables
const model = {
  todoList: ["Naranjas", "Manzanas", "Limon"]
};
let respuesta = {
  error: false,
  codigo: 200,
  mensaje: ""
};

//--- Configuraciones
// set the port of our application
// process.env.PORT lets the port be set by Heroku
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(bodyParser.json());

//--- Metodos ---
//--- HOME ---

app.get('/api/tareas', (req,res) => { /* Fetch all contacts */ });

app.get('/api/contacts/:contact_id', (req,res) => { /* Fetch specific contact */ });

app.post('/api/contacts', (req,res) => { /* Create new contact */ });

app.patch('/api/contacts/:contact_id',(req,res) => { /* Update existing contact */ });

app.delete('api/contacts/:contact_id', (req,res) => { /* Delete contact */ });

app.listen(process.env.PORT || 3000, function () {
  console.log(`Address book listening on port ${process.env.PORT || 3000}!`);
});