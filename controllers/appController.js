const Product = require('../models/Product');
const User = require("../models/User");
const Cart = require("../models/Cart");
const Comment = require("../models/Comment");
const passport = require('passport');
const bcrypt = require("bcryptjs");
const mongoose  = require('mongoose');
const toID = mongoose.Types.ObjectId
const { post } = require('../routes');
const { response } = require('express');
const e = require('express');

require('dotenv').config({ path: '.env' });













exports.register = (req, res) => {

  console.log(req.body);
  const {
      name,
      gender,
      accType,
      phoneNum,
      email,
      password,
      confirm_password,
  } = req.body;
  let errors = [];

  User.findOne({ email: email }).then(user => {
    if (user) {
      errors.push({ msg: 'Email already exists' });
      res.render('register', {
        errors,
        email
      });
    } else {
      const newUser = new User({
        name,
        gender,
        accType,
        phoneNum,
        email,
        password,
      });
    
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser
            .save()
            .then(user => {
              req.flash(
                'success_msg',
                'You are now registered and can log in'
              );
              res.redirect('/login');
            })
            .catch(err => console.log(err));
        });
      });
    }
})
};


exports.login = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',  
    failureFlash: true
  })(req, res, next);
};

exports.logout = (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/login');
};

exports.getAllProducts = async (req, res) => { 
  const products = await Product.find({})
      .limit(100)
      .sort({ createdAt: -1 });
  if (req.user != undefined) {
    const cart = await Cart.findOne({userID: req.user.id});
    if (cart != null){
      res.render('home', {
        title: "Home",
        small: "For All Types Of Products",
        styles: ['simple-sidebar'],
        products: products,
        cartItems: cart.orderItems,
        libs: ['sidebar'],
        user: req.user
      })
    } else {
      res.render('home', {
        title: "Home",
        small: "For All Types Of Products",
        styles: ['simple-sidebar'],
        products: products,
        libs: ['sidebar'],
        user: req.user
      })
    }
  } else {
  res.render('home', {
      title: "Home",
      small: "For All Types Of Products",
      styles: ['simple-sidebar'],
      products: products,
      libs: ['sidebar'],
      user: req.user
  })}
};





exports.getProduct = async (req, res,) => {
  try {
    const product = await Product.findOne({_id: req.params.id});
    const cart = await Cart.findOne({userID: req.user.id});
    if (cart != null){
      res.render('product', {
        styles: ['simple-sidebar','product'],
        product: product,
        libs: ['sidebar', 'product'],
        user: req.user,
        cartItems: cart.orderItems
      })
    } else {
      res.render('product', {
        styles: ['simple-sidebar','product'],
        product: product,
        libs: ['sidebar', 'product'],
        user: req.user
      })
    }
  } catch (error) {
    console.log(error);
    req.flash(
      'error_msg',
      'The product doesn\'t exist'
    );
    res.redirect('/home');
  }
};

exports.listProducts = async (req, res) => {
  
  const {
    name,
    description,
    category,
  } = req.body;

  const price = Number(req.body.price);
  const sellerID = toID(req.user.id);
  const newProduct = new Product({
    name,
    description,
    price,
    category,
    sellerID
  });

  newProduct.save()
  .then( products => {
    req.flash(
      'success_msg',
      'The product has been listed successfully'
    );
    res.redirect('/home');
  })
  .catch(err => console.log(err));
};

exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Please log in to view that resource');
  res.redirect('/login');
};

exports.forwardAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/home');      
};

exports.ensureSeller = async (req, res, next) => {
  
  if (req.user.accType == 'seller') {
    return next();
  }
  req.flash('error_msg', 'You need a seller account to access this section');
  res.redirect('/home');
};

exports.addToCart = async (req, res) => {
  const productID = toID(req.params.productID);
  const quantity = Number(req.params.quantity);
  const userID = toID(req.user.id);    
  const product = await Product.findById(productID);
  console.log(product);
  const name = product.name;
  const price = product.price;
  const cart = await Cart.findOne({userID: userID});
  
  if (cart) {
    if (cart.orderItems.some(item => item.productID.toString().includes(productID))) {
      const pos = cart.orderItems.map(item => {return item.productID.toString()}).indexOf(productID);
      cart.orderItems[pos].quantity += quantity;
      Cart.findByIdAndUpdate(cart._id,
        { $set: {
          orderItems: cart.orderItems
          }
      })
      .catch(err => console.log(err));
    } else {

      cart.orderItems.push({productID, name, price, quantity});
  
      Cart.findByIdAndUpdate(cart._id,
        { $set: {
          orderItems: cart.orderItems
          }
      })
      .catch(err => console.log(err));

    }

  } else {
    const newCart = new Cart({
      userID,
      orderItems:[{
        productID,
        name,
        price,
        quantity
    }],
    });
    await newCart.save()
    .catch(err => console.log(err));
    /*res.json({
      success_msg: 'The item was added to cart successfully'
    });*/
    
  };

  req.flash(
    'success_msg',
    'The item was added to cart successfully'
  );
  res.redirect('/product/'+productID);
};

exports.getCart = async (req, res) => {
  
  const userID = toID(req.user.id);   
  const cart = await Cart.findOne({userID: userID}).catch(err => console.log(err));
  if (cart) {
    res.render('cart', {
      styles: ['simple-sidebar'],
      cartItems: cart.orderItems,
      libs: ['sidebar'],
      user: req.user
    })
  } else {
    res.render('cart', {
      styles: ['simple-sidebar'],
      libs: ['sidebar'],
      user: req.user
    })
  }

  /*for (item in cart.orderItems) {
    const a = Cart.findOne()item.populate('productID', 'name price'));
  }*/
};


  /*Product.findByIdAndUpdate(user,
    { $set: {
       cart: fcart,
      }
  })
  .then( posts => {
    req.flash(
      'success_msg',
      'The item was added to cart successfully'
    );
    res.redirect('/product/'+productID);
  })
  .catch(err => console.log(err));
  */


/*
exports.getAllPosts = async (req, res) => { 
  const posts = await Post.find({})
      .limit(100)
      .sort({ createdAt: -1 });

  res.render('home', {
      title: "Home",
      small: "For All Types Of Posts",
      styles: ['simple-sidebar'],
      posts: posts,
      libs: ['sidebar'],
      username: req.user.username
  })
};




exports.ensureAuthorized = async (req, res, next) => {
  const postID = req.params.postID;
  const post = await Post.find({_id: postID});
  const originalUser = post[0].username;

  if (req.user.username == originalUser) {
    return next();
  }
  req.flash('error_msg', 'You don\'t have the access to modify this post');
  res.redirect('/post/'+postID);
};



exports.getPost = async (req, res,) => {
  try {
    const post = await Post.find({_id: req.params.id});
    const comments = await Comment.find({postID: req.params.id})
    .sort({ createdAt: -1 });
    res.render('product', {
      styles: ['simple-sidebar','post'],
      post: post[0],
      comments: comments,
      libs: ['sidebar'],
      username: req.user.username
    })
  } catch (error) {
    req.flash(
      'error_msg',
      'The post doesn\'t exist'
    );
    res.redirect('/home');
  }
};

exports.getCategoryPosts = async (req, res,) => {

    const posts = await Post.find({category: req.params.category})
    .limit(100)
    .sort({ createdAt: -1 });
    
    res.render('home', {
      title: req.params.category,
      small: "",
      styles: ['simple-sidebar'],
      posts: posts,
      libs: ['sidebar'],
      username: req.user.username
  })
};

exports.getUserProfile = async (req, res,) => {
  try {
    const user = await User.find({username: req.params.username});
    const posts = await Post.find({username: req.params.username})
    .sort({ createdAt: -1 });
    const comments = await Comment.find({username: req.params.username})
    .sort({ createdAt: -1 });
    res.render('userprofile', {
      styles: ['simple-sidebar'],
      user: user[0],
      posts: posts,
      comments: comments,
      libs: ['sidebar'],
      username: req.user.username
    })
  } catch (error) {
    req.flash(
      'error_msg',
      'The post doesn\'t exist'
    );
    res.redirect('/home');
  }
};



// POST register

exports.register = (req, res) => {
  
  console.log(req.body);
  const {
      fullname,
      email,
      username,
      password,
      password2
  } = req.body;
  const dob = new Date(req.body.dob);
  let errors = [];

  if (!fullname || !dob || !username || !email || !password || !password2) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (username.length > 25) {
    errors.push({ msg: 'Username cannot exceed 25 characters' });
  }

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }

  if (errors.length > 0) {
    res.render('register', {
      errors,
      fullname,
      username,
      email,
      password,
      password2
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          fullname,
          username,
          email,
          password,
          password2
        });
      } else {
        User.findOne({ username: username }).then(user => {
          if (user) {
            errors.push({ msg: 'Username not available! Try a different username' });
            res.render('register', {
              errors,
              email,
              fullname,
              password,
              password2
            });
          } else {
            const newUser = new User({
              fullname,
              email,
              username,
              dob,
              password
            });

            bcrypt.genSalt(10, (err, salt) => {
              bcrypt.hash(newUser.password, salt, (err, hash) => {
                if (err) throw err;
                newUser.password = hash;
                newUser
                  .save()
                  .then(user => {
                    req.flash(
                      'success_msg',
                      'You are now registered and can log in'
                    );
                    res.redirect('/login');
                  })
                  .catch(err => console.log(err));
              });
            });
          }
        });
      }
    })
  }
};


exports.login = (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',  
    failureFlash: true
  })(req, res, next);
};


// POST logout

exports.logout = (req, res) => {
  req.logout();
  req.flash('success_msg', 'You are logged out');
  res.redirect('/login');
};

// POST an update to the database

exports.createPost = (req, res) => {
  
  const {
    title,
    category,
    postBody
  } = req.body;
  
  const username = req.user.username;

  let errors = [];
  if ( !username || !title || !postBody || !category) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (postBody.length > 10000) {
    errors.push({ msg: 'Body text cannot exceed 10000 characters' });
  }
  
  


  if (errors.length > 0) {
    
      res.render('create', {
      errors,
      title,
      category,
      postBody,
      styles: ['simple-sidebar'],
      libs: ['sidebar'],
      username: req.user.username
    });
  } else {
    const newPost = new Post({
      title,
      username,
      category,
      postBody
    });

    newPost.save()
    .then( posts => {
      req.flash(
        'success_msg',
        'The post was created successfully'
      );
      res.redirect('/create');
    })
    .catch(err => console.log(err));

  }
};



exports.getEdit = async (req, res) => {
  
  const postID = req.params.postID;
  const post = await Post.findOne({_id: postID});
  const {
    title,
    category,
    postBody
  } = post;

  res.render('edit', {
    title,
    category,
    postBody,
    postID,
    styles: ['simple-sidebar'],
    libs: ['sidebar'],
    username: req.user.username
  });
};


exports.postEdit = async (req, res) => {
  
  const {
    title,
    postBody
  } = req.body;
  
  const postID = req.params.postID;

  const username = req.user.username;

  let errors = [];
  if ( !title || !postBody ) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (postBody.length > 10000) {
    errors.push({ msg: 'Body text cannot exceed 10000 characters' });
  }
  

  if (errors.length > 0) {
    
      res.render('edit', {
      errors,
      title,
      postBody,
      styles: ['simple-sidebar'],
      libs: ['sidebar'],
      username: req.user.username
    });
  } else {

    Post.findByIdAndUpdate(postID,
      { $set: {
         title: title,
         postBody: postBody,
         edited: true
        }
    })
    .then( posts => {
      req.flash(
        'success_msg',
        'The post was edited successfully'
      );
      res.redirect('/post/'+postID);
    })
    .catch(err => console.log(err));

  }
};


exports.deletePost = async (req, res) => {
  
  const postID = req.params.postID;
  Post.findByIdAndDelete(postID)
    .then( posts => {
      req.flash(
        'success_msg',
        'The post was deleted successfully'
      );
      res.redirect('/home');
    })
    .catch(err => console.log(err));
};



exports.postComment = async (req, res) => {
  
  const commentBody = req.body.commentBody;
  const postTitle = req.body.postTitle;
  const postID = req.params.postID;
  const username = req.user.username;
  const post = await Post.find({_id: postID});
  const comments = await Comment.find({postID: postID})
  .sort({ createdAt: -1 });

  let errors = [];
  if ( !username || !postID || !commentBody) {
    errors.push({ msg: 'Please enter all fields' });
  }

  if (commentBody.length > 500) {
    errors.push({ msg: 'Comment text cannot exceed 500 characters' });
  }
  
  
  if (errors.length > 0) {
    res.render('product', {
      errors,
      commentBody,
      styles: ['simple-sidebar'],
      post: post[0],
      comments: comments,
      libs: ['sidebar'],
      username: req.user.username
    });

  } else {
    const newComment = new Comment({
      username,
      postID,
      postTitle,
      commentBody
    });

    newComment.save()
    .then( posts => {
      req.flash(
        'success_msg',
        'Comment Added.'
      );
      res.redirect('/post/'+postID);
    })
    .catch(err => console.log(err));

  }
};




// Middlewares for checking stuff


exports.getUser = async (req, res) => {
  try {
    // request.user is getting fetched from Middleware after token authentication
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (e) {
    res.send({ message: "Error in Fetching user" });
  }
}

*/