// folderStructure.js


let cachedFolderStructure = null;

// Path to the master folder
const masterFolderPath = path.join(__dirname, 'views/masters');

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

// Cache the folder structure when the server starts
const loadFolderStructure = () => {
  cachedFolderStructure = getFolderStructure(masterFolderPath);
};

// Middleware to make the folder structure available in all routes
function folderStructureMiddleware(req, res, next) {
  if (!cachedFolderStructure) {
    console.error('Folder structure is not loaded.');
    return res.status(500).json({ error: 'Folder structure not loaded' });
  }

  // Make folder structure available in all views
  res.locals.folderStructure = cachedFolderStructure;
  next();
}

// Middleware to make the folder structure available for all routes
app.use((req, res, next) => {
    if (!cachedFolderStructure) {
      console.error('Folder structure is not loaded.');
      return res.status(500).json({ error: 'Folder structure not loaded' });
    }
  
    // Render the 'routers.ejs' partial and make it available in all routes
    ejs.renderFile(path.join(__dirname, 'views', 'partials', 'routers.ejs'), { folderStructure: cachedFolderStructure, isRoot: true }, (err, routersHtml) => {
        if (err) {
            console.error('Error rendering routers:', err);
            return res.status(500).json({ error: 'Error rendering routers' });
        }
  
        // Store the rendered routers HTML in res.locals to make it available in all views
        res.locals.routers = routersHtml;
        next();
    });
  });
  

module.exports = { loadFolderStructure, folderStructureMiddleware };
