const express = require("express");
const backendController = require('../../controllers/backend-functions');
const router = express.Router();

// Other routes...
router.post('/insert', backendController.insert);
router.post('/delete', backendController.deleted);
router.post('/createTable', backendController.createTable);
router.get('/fetchData', (req, res) => {
    const columns = [
        { title: 'tables', name: 'tablename' }
    ];
  
    // Specify that serial number and actions are always required
    const serialNeeded = true;  // Always true since serial number and actions are compulsory
    const act = true;

    // Extract custom actions from query parameters (or from body if needed)
    const customActions = {
        edit: 'editRowi',  // Default to 'editRow' if not provided
        delete: 'deleteRowi'  // Default to 'deleteRow' if not provided
    };

    // Call the common function to fetch the data for the 'tables' table, passing customActions
    backendController.fetchDataForTable(req, res, 'tables', columns, serialNeeded, act, null, customActions, ["deleteon = '0000-00-00' and deleteat='00:00:00'"]);
});


module.exports = router;
