const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const userController = require('../controllers/users');
const backendController = require('../controllers/backend-functions');

// Static routes
router.get(["/", "/login"], (req, res) => {
    if (req.user) userController.logout(req, res);
    res.render('login');
});

router.get("/register", (req, res) => {
    if (req.user) userController.logout(req, res);
    res.render('register');
});

router.get("/profile", userController.isLoggedIn, (req, res) => {
    if (req.user) res.render('profile', { user: req.user });
    else res.redirect('/login');
});

router.get("/home", userController.isLoggedIn, (req, res) => {
    if (req.user) res.render("home", { user: req.user });
    else res.redirect('/login');
});

// Function to scan the masters directory and create routes dynamically
const generateDynamicRoutes = (basePath, currentPath = '/masters') => {
    const files = fs.readdirSync(basePath);

    files.forEach(file => {
        const fullPath = path.join(basePath, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            generateDynamicRoutes(fullPath, `${currentPath}/${file}`);
        } else if (file.endsWith('.hbs')) {
            const routePath = `${currentPath}/${file.replace('.hbs', '')}`;

            // Dynamically generate routes
            router.get(routePath, userController.isLoggedIn, async (req, res) => {
                if (req.user) {
                    // Log page access using insert function
                    const logData = {
                        user_id: req.user.name,
                        page_name: routePath, // Using the route path as the page name
                    };

                    // Call insert function to log page access
                    await backendController.insert({
                        body: {
                            tableName: 'page_access_logs', // Table name for logging page access
                            data: logData, // Data to be inserted
                        }
                    }, res);
                    res.render(`${routePath.slice(1)}`, { user: req.user }); // Remove leading dot
                } else {
                    res.redirect('/login');
                }
            });
        }
    });
};

// Call the function to generate routes
generateDynamicRoutes(path.join(__dirname, '../views/masters')); // Adjusted path
module.exports = router;
