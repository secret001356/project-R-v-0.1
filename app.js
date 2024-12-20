const express = require('express');
const hbs = require('hbs');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const crypto = require('crypto');
const dotenv = require('dotenv');
const fs = require('fs');
// const exphbs = require('express-handlebars');
const ejs = require('ejs'); // To render EJS templates
const { initializeDatabase } = require('./db-connection');
const { registerHelpers } = require('./helpers');

dotenv.config({ path: '.env' });

const app = express();

// Database connection
initializeDatabase();

// Set up static folder location
const location = path.join(__dirname, "./public");
app.use(express.static(location));

// Middleware for parsing JSON and URL-encoded form data
app.use(express.json()); // <-- Add this to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Ensure extended parsing for URL-encoded data

// Middleware for security headers (CSP with nonce)
app.use(helmet());
app.use(cookieParser());

app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'`);
  res.locals.nonce = nonce;
  next();
});

// Setup Handlebars view engine
app.set("view engine", "hbs");
app.set('view cache', false); // Disable view cache

// Register partials for Handlebars
const partialsPath = path.join(__dirname, "./views/partials");
hbs.registerPartials(partialsPath);
hbs.registerHelper("eq", function (a, b) {
  return a === b;
});
// Register helpers for dynamic input generation
registerHelpers();

// **Start of dynamic menu loading**
const masterFolderPath = path.join(__dirname, 'views/masters');
let cachedFolderStructure = null;

// Function to recursively read directories and files
const getFolderStructure = (dirPath) => {
  let result = [];
  try {
    const filesAndFolders = fs.readdirSync(dirPath, { withFileTypes: true });
    filesAndFolders.forEach((entry) => {
      const fullPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        result.push({
          type: 'folder',
          name: entry.name,
          children: getFolderStructure(fullPath),
        });
      } else {
        result.push({
          type: 'file',
          name: entry.name,
          path: fullPath,
        });
      }
    });
  } catch (error) {
    console.error(`Error reading directory: ${dirPath}`, error);
  }
  return result;
};

// Load folder structure on server startup
const loadFolderStructure = () => {
  cachedFolderStructure = getFolderStructure(masterFolderPath);
};
loadFolderStructure();

// Middleware to make the folder structure available for all routes
app.use((req, res, next) => {
  if (!cachedFolderStructure) {
    console.error('Folder structure is not loaded.');
    return res.status(500).json({ error: 'Folder structure not loaded' });
  }
  ejs.renderFile(
    path.join(__dirname, 'views', 'partials', 'routers.ejs'),
    { folderStructure: cachedFolderStructure, isRoot: true },
    (err, routersHtml) => {
      if (err) {
        console.error('Error rendering routers:', err);
        return res.status(500).json({ error: 'Error rendering routers' });
      }
      res.locals.routers = routersHtml;
      next();
    }
  );
});

// **End of dynamic menu loading**

// Routes
app.use('/', require('./routes/pages'));
app.use('/auth', require('./routes/auth'));

// Dynamically require and use all route files
const routesPath = path.join(__dirname, 'routes/dev-scr');
fs.readdirSync(routesPath).forEach((file) => {
  // Ensure only JavaScript files are processed
  if (file.endsWith('.js')) {
    const route = require(path.join(routesPath, file));
    const routePath = `/${file.replace('.js', '')}`; // Remove ".js" and use file name as route prefix
    app.use(routePath, route);
    console.log(`Route loaded: ${routePath} ${file}`);
  }
});
// Start server
app.listen(5000, () => {
  console.log("Server started on http://localhost:5000");
});
