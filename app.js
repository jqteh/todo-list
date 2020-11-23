const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const app = express();
const _ = require("lodash");
// const date = require(__dirname + "/date.js");


app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static("public"));

// Database and starting defaults
mongoose.connect('insert_mongodb_url', {
  useNewUrlParser: true
});

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model("item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});
const item2 = new Item({
  name: "Hit the + button to add a new item"
});
const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("list", listSchema);

// Home app.get
app.get("/", function(req, res) {

  // let day = date.getDay();

  // If there are no items initially, i.e. "items" collection has 0 items , then add the default items, if they are there then show it
  Item.find({}, function(err, results) {
    if (results.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Succesfully added.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: results
      })
    }
  });
});

// Creating new custom pages instantly by typing after the "/", such as /Work and /Home
app.get("/:customListName", function(req, res) {

  const customListName = _.capitalize(req.params.customListName);

  // To find one particular object rather than an array of objects
  List.findOne({
    name: customListName
  }, function(err, foundList) {
    // If this is a new page, then create its custom "list" under the collection "List"
    // If this page already exists, then show that page by ejs partials using results parameter of findOne()
    if (!err) {
      if (!foundList) {
        // console.log("Doesn't exist.");
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save();
        // Redirect because otherwise page won't update
        res.redirect("/" + customListName);
      } else {
        // console.log("It exists!");
        // Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }
    }
  })
});

app.post("/", function(req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else{
    List.findOne({name: listName},function(err,foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    });
  }



});

// Check if an item is "checked", and then find its id and delete it by mongoose code
app.post("/delete", function(req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName==="Today"){
    Item.findByIdAndDelete(checkedItemId, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully deleted checked item.");
        // Redirect because while mongodb updates, the page doesn't refresh automatically
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err,foundList){
      if (!err){
        res.redirect("/"+listName);
      }
    });
  }


});

app.get("/about", function(req, res) {
  res.render("about");
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server is running successfully");
})
