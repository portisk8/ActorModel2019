const uuid = require("uuid/v4");
const ProtocolTypes = require("./ProtocolTypes");
const { start, dispatch, query, spawn } = require("nact");
const system = start();
const model = {
  todoList: ["Naranjas", "Manzanas", "Toronjas"]
};
// getSystem = function() {
//   if (system == null) {
//     system = start();
//   }
//   return system;
//   // const system = start();
// };

module.exports = {
  // getSystem: function() {
  //   if (system == null) {
  //     system = start();
  //   }
  //   return system;
  //   // const system = start();
  // },
  todoListService: spawn(
    system,
    (state = { items: {} }, msg, ctx) => {
      if (msg.type === ProtocolTypes.GET_TODOLIST) {
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
        dispatch(ctx.sender, { payload: obj, type: SUCCESS }, ctx.self);
      } else if (msg.type === ProtocolTypes.CREATE_ITEM) {
        const newContact = { id: uuid(), ...msg.payload };
        const nextState = {
          items: { ...state.items, [newContact.id]: newContact }
        };
        dispatch(ctx.sender, { type: SUCCESS, payload: newContact });
        return nextState;
      } else {
        // All these message types require an existing contact
        // So check if the contact exists
        const contact = state.items[msg.contactId];
        if (contact) {
          switch (msg.type) {
            case GET_CONTACT: {
              dispatch(ctx.sender, { payload: contact, type: SUCCESS });
              break;
            }
            case REMOVE_CONTACT: {
              // Create a new state with the contact value to undefined
              const nextState = { ...state.items, [contact.id]: undefined };
              dispatch(ctx.sender, { type: SUCCESS, payload: contact });
              return nextState;
            }
            case UPDATE_CONTACT: {
              // Create a new state with the previous fields of the contact
              // merged with the updated ones
              const updatedContact = { ...contact, ...msg.payload };
              const nextState = {
                ...state.items,
                [contact.id]: updatedContact
              };
              dispatch(ctx.sender, { type: SUCCESS, payload: updatedContact });
              return nextState;
            }
          }
        } else {
          // If it does not, dispatch a not found message to the sender
          dispatch(
            ctx.sender,
            { type: NOT_FOUND, contactId: msg.contactId },
            ctx.self
          );
        }
      }
      // Return the current state if unchanged.
      return state;
    },
    "items"
  ),
  performQuery: async (msg, res) => {
    try {
      const result = await query(this.todoListService, msg, 500); // Set a 250ms timeout
      switch (result.type) {
        case SUCCESS:
          //   res.json(result.payload);
          if (msg.type === ProtocolTypes.GET_TODOLIST) {
            res.render("home", obj);
          } else {
            res.redirect("/");
          }
          break;
        case NOT_FOUND:
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
  }
};
