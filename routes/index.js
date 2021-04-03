const router = require('express').Router();
const appController = require('../controllers/appController');




router.get('/register',
    appController.forwardAuthenticated, (req,res) => {
    res.render('register')
});

router.get('/login',
    appController.forwardAuthenticated, (req,res) => {
    res.render('login')
});

router.get('/home',
    appController.getAllProducts    
);

router.get('/product/:id',
    appController.getProduct 
);

router.get('/logout',
    appController.logout
);

router.post(
    '/register',
    appController.register
);

router.post(
    "/login",
    appController.login
);

router.post(
    '/product',
    appController.listProducts
);

router.get( '/product', (req, res) => {
    res.render('product', {
        user: req.user,
        styles: ['simple-sidebar','product'],
        libs: ['sidebar']
    })
});

router.post(
    '/cart/:productId',
    appController.addToCart
);

/*

router.get('/home',
    appController.ensureAuthenticated,
    appController.getAllPosts    
);

router.get('/',
    appController.forwardAuthenticated,
    (req, res) => {
    res.render('welcome')
});

router.get('/dashboard',
    appController.ensureAuthenticated,
    (req, res) => {
    res.render('dashboard', {
        username: req.user.username,
        libs: ['dashboard']
    });
});

//login handle
router.get('/login',
    appController.forwardAuthenticated, (req,res) => {
    res.render('login')
});

router.get('/register',
    appController.forwardAuthenticated, (req,res) => {
    res.render('register', {
        title: 'register',
        libs: ['register']
    })
});

router.get('/category/:category',
    appController.ensureAuthenticated,
    appController.getCategoryPosts    
);




router.get('/post/:id',
    appController.ensureAuthenticated,
    appController.getPost 
);

router.get('/edit/:postID',
    appController.ensureAuthenticated,
    appController.ensureAuthorized,
    appController.getEdit 
);

router.post('/edit/:postID',
    appController.postEdit 
);

router.get('/delete/:postID',
    appController.ensureAuthenticated,
    appController.ensureAuthorized,
    appController.deletePost 
);


router.get('/user/:username',
    appController.ensureAuthenticated,
    appController.getUserProfile 
);

// GET all posts in the runtime
//router.get('/all', appController.getAll);

// register for a username
router.post(
    '/register',
    appController.register
);

router.post(
    "/login",
    appController.login
);

router.get(
    "/me",
    appController.getUser
);

router.get(
    "/create",
    appController.ensureAuthenticated, (req, res) => {
    res.render('create', {
        active: 'Create',
        styles: ['simple-sidebar'],
        libs: ['sidebar'],
        username: req.user.username
    })
});


// Logout
router.get('/logout', appController.logout);

// POST an update
// NEEDS verification
router.post(
    '/create',
    appController.createPost
);

router.post(
    '/comment/:postID',
    appController.postComment
);

*/

module.exports = router;